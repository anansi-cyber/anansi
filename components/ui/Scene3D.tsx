"use client";

import { useEffect, useRef } from "react";

// Décor vivant de toute la page : un champ de soie en 3D dessiné dans un
// <canvas> fixe. Le défilement fait avancer la caméra, la souris la fait
// pivoter, le curseur se prend dans les fils et un clic envoie une onde de choc.
// Tout reste très discret : ce décor passe sous le texte.

const DEPTH = 11; // profondeur du volume, qui se répète à l'infini
const NEAR = 0.7; // en deçà, un nœud est trop près de la caméra pour être dessiné
const FOCAL = 1.4;
const NEIGHBOURS = 3; // fils tissés depuis chaque nœud
const MAX_THREAD = 4.5; // longueur maximale d'un fil, en unités du monde
const BUCKETS = 6; // paliers d'opacité : un seul tracé par palier
const MAX_ALPHA = 0.22;
const SCROLL_RATE = 0.0016; // unités de profondeur parcourues par pixel défilé
const DRIFT = 0.05; // lente avancée au repos, pour que le décor respire
const POINTER_RADIUS = 190;
const SHOCK_SPEED = 7;
const SHOCK_RADIUS = 6;
const SHOCK_IMPULSE = 1.8;

const SLATE = "rgb(148, 163, 184)";
const TEAL = "rgb(45, 212, 191)";

type SilkNode = {
  bx: number; // position de repos
  by: number;
  bz: number;
  ox: number; // déplacement courant (onde de choc)
  oy: number;
  oz: number;
  vx: number; // vitesse
  vy: number;
  vz: number;
  rz: number; // profondeur de repos par rapport à la caméra, après bouclage
  sx: number; // position à l'écran
  sy: number;
  z: number; // profondeur vue par la caméra
  fade: number; // brouillard : 0 = invisible, 1 = net
  near: number; // proximité du curseur, de 0 à 1
};

type Field = { nodes: SilkNode[]; pairA: Uint16Array; pairB: Uint16Array };

type Shock = { x: number; y: number; z: number; age: number; active: boolean };

// Générateur pseudo-aléatoire à graine fixe : le champ a toujours la même forme.
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildField(count: number, extentX: number, extentY: number): Field {
  const random = seeded(11);
  const nodes: SilkNode[] = [];
  for (let i = 0; i < count; i++) {
    nodes.push({
      bx: (random() * 2 - 1) * extentX,
      by: (random() * 2 - 1) * extentY,
      bz: random() * DEPTH,
      ox: 0,
      oy: 0,
      oz: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      rz: 0,
      sx: 0,
      sy: 0,
      z: 0,
      fade: 0,
      near: 0,
    });
  }

  // Chaque nœud est relié à ses plus proches voisins, une fois pour toutes.
  // La distance en profondeur est calculée « en boucle », comme le volume.
  const seen = new Set<number>();
  const a: number[] = [];
  const b: number[] = [];
  for (let i = 0; i < count; i++) {
    const closest: { index: number; dist: number }[] = [];
    for (let j = 0; j < count; j++) {
      if (j === i) continue;
      let dz = Math.abs(nodes[i].bz - nodes[j].bz);
      dz = Math.min(dz, DEPTH - dz);
      const dist = Math.hypot(
        nodes[i].bx - nodes[j].bx,
        nodes[i].by - nodes[j].by,
        dz
      );
      if (dist < MAX_THREAD) closest.push({ index: j, dist });
    }
    closest.sort((p, q) => p.dist - q.dist);
    for (const { index } of closest.slice(0, NEIGHBOURS)) {
      const key = Math.min(i, index) * count + Math.max(i, index);
      if (seen.has(key)) continue;
      seen.add(key);
      a.push(i);
      b.push(index);
    }
  }
  return { nodes, pairA: Uint16Array.from(a), pairB: Uint16Array.from(b) };
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export default function Scene3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let field: Field | null = null;
    let narrow: boolean | null = null;
    let buckets = new Uint8Array(0); // palier d'opacité de chaque fil
    let glows = new Float32Array(0); // éclat turquoise de chaque fil
    let width = 0;
    let height = 0;
    let unit = 1;
    let reveal = reduceMotion ? 1 : 0;
    let frame = 0;
    let last = 0;
    let onScreen = true;
    let scrollTarget = window.scrollY * SCROLL_RATE;
    let scrollZ = scrollTarget;
    let drift = 0;
    const camera = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, cosY: 1, sinY: 0, cosP: 1, sinP: 0 };
    const pointer = { x: 0, y: 0, nx: 0, ny: 0, active: false, presence: 0 };
    // Réserve fixe d'ondes de choc : aucune allocation pendant l'animation.
    const shocks: Shock[] = Array.from({ length: 3 }, () => ({
      x: 0,
      y: 0,
      z: 0,
      age: 0,
      active: false,
    }));

    // Chaque nœud est un ressort accroché à sa position de repos : l'onde le
    // pousse vers l'extérieur au moment où elle l'atteint, puis il revient.
    const step = (dt: number) => {
      if (!field) return;
      for (const shock of shocks) {
        if (!shock.active) continue;
        const from = shock.age * SHOCK_SPEED;
        shock.age += dt;
        const to = shock.age * SHOCK_SPEED;
        const originZ = shock.z - camera.z;
        for (const node of field.nodes) {
          const dx = node.bx - shock.x;
          const dy = node.by - shock.y;
          const dz = node.rz - originZ;
          const dist = Math.hypot(dx, dy, dz);
          if (dist < from || dist >= to || dist >= SHOCK_RADIUS) continue;
          const k = 1 - dist / SHOCK_RADIUS;
          const push = (k * k * SHOCK_IMPULSE) / Math.max(dist, 0.001);
          node.vx += dx * push;
          node.vy += dy * push;
          node.vz += dz * push;
        }
        if (to >= SHOCK_RADIUS) shock.active = false;
      }
      for (const node of field.nodes) {
        node.vx += (-30 * node.ox - 3.2 * node.vx) * dt;
        node.vy += (-30 * node.oy - 3.2 * node.vy) * dt;
        node.vz += (-30 * node.oz - 3.2 * node.vz) * dt;
        node.ox = clamp(node.ox + node.vx * dt, -1, 1);
        node.oy = clamp(node.oy + node.vy * dt, -1, 1);
        node.oz = clamp(node.oz + node.vz * dt, -1, 1);
      }
    };

    const project = () => {
      if (!field) return;
      camera.cosY = Math.cos(camera.yaw);
      camera.sinY = Math.sin(camera.yaw);
      camera.cosP = Math.cos(camera.pitch);
      camera.sinP = Math.sin(camera.pitch);
      const { cosY, sinY, cosP, sinP } = camera;
      const centerX = width / 2;
      const centerY = height / 2;

      for (const node of field.nodes) {
        // Le volume boucle en profondeur : un nœud dépassé par la caméra
        // réapparaît tout au fond, invisible dans le brouillard.
        let rz = (node.bz - camera.z) % DEPTH;
        if (rz < 0) rz += DEPTH;
        node.rz = rz;
        const wx = node.bx + node.ox - camera.x;
        const wy = node.by + node.oy - camera.y;
        const wz = rz + node.oz;
        const x1 = wx * cosY - wz * sinY;
        const z1 = wx * sinY + wz * cosY;
        const y2 = wy * cosP - z1 * sinP;
        const z2 = wy * sinP + z1 * cosP;
        node.z = z2;
        node.near = 0;
        if (z2 < NEAR) {
          node.fade = 0;
          continue;
        }
        const scale = (unit * FOCAL) / z2;
        node.sx = centerX + x1 * scale;
        node.sy = centerY + y2 * scale;
        node.fade =
          reveal *
          smoothstep(NEAR, NEAR + 1.4, z2) *
          (1 - smoothstep(DEPTH * 0.5, DEPTH - 0.3, z2));
        if (pointer.presence > 0.01 && node.fade > 0.05) {
          const dist = Math.hypot(node.sx - pointer.x, node.sy - pointer.y);
          if (dist < POINTER_RADIUS) {
            node.near = (1 - dist / POINTER_RADIUS) * pointer.presence;
          }
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      if (!field) return;
      const { nodes, pairA, pairB } = field;
      const margin = 40;

      // Premier passage : chaque fil reçoit son palier d'opacité et son éclat.
      for (let i = 0; i < pairA.length; i++) {
        const a = nodes[pairA[i]];
        const b = nodes[pairB[i]];
        buckets[i] = 0;
        glows[i] = 0;
        if (a.fade <= 0 || b.fade <= 0) continue;
        // Un des deux nœuds vient de boucler : le fil traverserait tout le volume.
        if (Math.abs(a.rz - b.rz) > DEPTH / 2) continue;
        if (
          (a.sx < -margin && b.sx < -margin) ||
          (a.sx > width + margin && b.sx > width + margin) ||
          (a.sy < -margin && b.sy < -margin) ||
          (a.sy > height + margin && b.sy > height + margin)
        ) {
          continue;
        }
        const fade = Math.min(a.fade, b.fade);
        // Plus un fil est loin, plus il est pâle et fin.
        const closeness = 1 - (a.z + b.z) / (2 * DEPTH);
        const strength = fade * (0.3 + 0.7 * closeness);
        if (strength < 0.06) continue;
        buckets[i] = Math.min(BUCKETS, Math.ceil(strength * BUCKETS));
        glows[i] = (a.near + b.near) * 0.5 * fade * 0.6;
      }

      ctx.strokeStyle = SLATE;
      for (let bucket = 1; bucket <= BUCKETS; bucket++) {
        const level = bucket / BUCKETS;
        ctx.globalAlpha = MAX_ALPHA * level;
        ctx.lineWidth = 0.5 + 0.7 * level;
        ctx.beginPath();
        for (let i = 0; i < pairA.length; i++) {
          if (buckets[i] !== bucket) continue;
          const a = nodes[pairA[i]];
          const b = nodes[pairB[i]];
          ctx.moveTo(a.sx, a.sy);
          ctx.lineTo(b.sx, b.sy);
        }
        ctx.stroke();
      }

      // Près du curseur, les fils s'allument et un fil neuf vient s'y accrocher.
      ctx.strokeStyle = TEAL;
      ctx.lineWidth = 1;
      for (let i = 0; i < pairA.length; i++) {
        if (glows[i] < 0.02) continue;
        const a = nodes[pairA[i]];
        const b = nodes[pairB[i]];
        ctx.globalAlpha = glows[i];
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        ctx.lineTo(b.sx, b.sy);
        ctx.stroke();
      }
      ctx.lineWidth = 0.8;
      for (const node of nodes) {
        if (node.near <= 0) continue;
        ctx.globalAlpha = node.near * node.near * node.fade * 0.6;
        ctx.beginPath();
        ctx.moveTo(node.sx, node.sy);
        ctx.lineTo(pointer.x, pointer.y);
        ctx.stroke();
      }

      for (const node of nodes) {
        if (node.fade <= 0.03) continue;
        if (
          node.sx < -margin ||
          node.sx > width + margin ||
          node.sy < -margin ||
          node.sy > height + margin
        ) {
          continue;
        }
        const closeness = 1 - node.z / DEPTH;
        const alpha = node.fade * (0.16 + 0.3 * closeness);
        const radius = Math.min(2.4, 0.5 + 3 / node.z);
        ctx.fillStyle = node.near > 0 ? TEAL : SLATE;
        ctx.globalAlpha = Math.max(alpha, node.near * node.fade);
        ctx.beginPath();
        ctx.arc(node.sx, node.sy, radius + node.near * 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Anneau discret qui montre le front de l'onde de choc.
      ctx.strokeStyle = TEAL;
      ctx.lineWidth = 1;
      for (const shock of shocks) {
        if (!shock.active) continue;
        const wx = shock.x - camera.x;
        const wy = shock.y - camera.y;
        const wz = shock.z - camera.z;
        const x1 = wx * camera.cosY - wz * camera.sinY;
        const z1 = wx * camera.sinY + wz * camera.cosY;
        const y2 = wy * camera.cosP - z1 * camera.sinP;
        const z2 = wy * camera.sinP + z1 * camera.cosP;
        if (z2 < NEAR) continue;
        const scale = (unit * FOCAL) / z2;
        const progress = (shock.age * SHOCK_SPEED) / SHOCK_RADIUS;
        const rest = 1 - progress;
        ctx.globalAlpha = rest * rest * 0.28;
        ctx.beginPath();
        ctx.arc(
          width / 2 + x1 * scale,
          height / 2 + y2 * scale,
          progress * SHOCK_RADIUS * scale,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const resize = () => {
      const nextWidth = canvas.clientWidth;
      const nextHeight = canvas.clientHeight;
      if (nextWidth === width && nextHeight === height && field) return;
      width = nextWidth;
      height = nextHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      unit = 0.5 * Math.hypot(width, height);

      // Moins de nœuds sur petit écran, et un volume plus haut que large.
      // Le champ n'est reconstruit que si l'on change de catégorie d'écran.
      const isNarrow = width < 768;
      if (isNarrow !== narrow) {
        narrow = isNarrow;
        field = isNarrow ? buildField(40, 3.4, 5.5) : buildField(90, 6.5, 4);
        buckets = new Uint8Array(field.pairA.length);
        glows = new Float32Array(field.pairA.length);
      }
      // Redessine tout de suite : changer la taille du canvas l'efface.
      project();
      draw();
    };

    const loop = (now: number) => {
      const time = now / 1000;
      const dt = last ? Math.min(0.033, time - last) : 0.016;
      last = time;

      reveal = Math.min(1, reveal + dt / 1.4);
      drift += dt * DRIFT;
      // Lissage indépendant de la fréquence d'affichage : la caméra glisse
      // vers sa cible au lieu de suivre le défilement à la lettre.
      const glide = 1 - Math.exp(-dt * 4);
      scrollZ += (scrollTarget - scrollZ) * glide;
      camera.z = scrollZ + drift;
      const targetX = pointer.active ? pointer.nx : 0;
      const targetY = pointer.active ? pointer.ny : 0;
      // La caméra se décale (les nœuds proches bougent plus que les lointains)
      // et pivote légèrement.
      camera.x += (targetX * 0.55 - camera.x) * glide;
      camera.y += (targetY * 0.4 - camera.y) * glide;
      camera.yaw += (targetX * 0.06 - camera.yaw) * glide;
      camera.pitch += (targetY * 0.045 - camera.pitch) * glide;
      pointer.presence += ((pointer.active ? 1 : 0) - pointer.presence) * 0.12;

      step(dt);
      project();
      draw();
      frame = requestAnimationFrame(loop);
    };

    const onResize = () => resize();
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(canvas);
    resize();

    // Mouvement réduit : une image fixe du champ, sans aucune interaction.
    if (reduceMotion) {
      return () => resizeObserver.disconnect();
    }

    // L'animation s'arrête quand l'onglet est caché ou le canvas hors écran.
    const sync = () => {
      cancelAnimationFrame(frame);
      if (onScreen && !document.hidden) {
        last = 0;
        frame = requestAnimationFrame(loop);
      }
    };
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    visibilityObserver.observe(canvas);

    const onScroll = () => {
      scrollTarget = window.scrollY * SCROLL_RATE;
    };

    // Seule une vraie souris pilote la caméra : au doigt, on fait défiler.
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || width === 0 || height === 0) return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.nx = (event.clientX / width) * 2 - 1;
      pointer.ny = (event.clientY / height) * 2 - 1;
      pointer.active = true;
    };

    const onPointerLeave = () => {
      pointer.active = false;
    };

    // Un clic (ou un appui du doigt) lance une onde de choc depuis ce point.
    // « click » plutôt que « pointerdown » : un glissement pour défiler ne
    // déclenche rien. detail === 0 : clic simulé au clavier, sans position.
    const onClick = (event: MouseEvent) => {
      if (!field || event.detail === 0) return;
      const px = event.clientX;
      const py = event.clientY;
      // L'onde part de la profondeur du nœud visible le plus proche du clic.
      let depth = 4;
      let best = 240;
      for (const node of field.nodes) {
        if (node.fade < 0.2) continue;
        const dist = Math.hypot(node.sx - px, node.sy - py);
        if (dist < best) {
          best = dist;
          depth = node.z;
        }
      }
      depth = clamp(depth, 1.5, 6);
      // Chemin inverse de la projection : de l'écran vers le monde.
      const x1 = ((px - width / 2) / (unit * FOCAL)) * depth;
      const y2 = ((py - height / 2) / (unit * FOCAL)) * depth;
      const wy = y2 * camera.cosP + depth * camera.sinP;
      const z1 = -y2 * camera.sinP + depth * camera.cosP;
      const wx = x1 * camera.cosY + z1 * camera.sinY;
      const wz = -x1 * camera.sinY + z1 * camera.cosY;

      let slot = shocks[0];
      for (const shock of shocks) {
        if (!shock.active) {
          slot = shock;
          break;
        }
        if (shock.age > slot.age) slot = shock;
      }
      slot.x = wx + camera.x;
      slot.y = wy + camera.y;
      slot.z = wz + camera.z;
      slot.age = 0;
      slot.active = true;
    };

    const root = document.documentElement;
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("click", onClick, { passive: true });
    window.addEventListener("blur", onPointerLeave);
    root.addEventListener("pointerleave", onPointerLeave);
    sync();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("click", onClick);
      window.removeEventListener("blur", onPointerLeave);
      root.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
    />
  );
}
