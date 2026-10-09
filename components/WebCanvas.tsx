"use client";

import { useEffect, useRef, type RefObject } from "react";

// Toile d'araignée en 3D dessinée dans un <canvas> : elle s'incline avec la
// souris, se déforme sous le curseur, ondule quand on clique dessus et se
// saisit pour être tournée dans l'espace. Une petite araignée y marche le long
// des fils vers le dernier endroit cliqué.

const SPOKES = 18; // nombre de fils qui partent du centre
const RINGS = 12; // nombre de cercles de la spirale
const HUB = 0.08;
const MAX_RADIUS = 1.35;
const CAMERA = 2.4;
const BASE_TILT = 0.5; // inclinaison de repos, pour que la profondeur se voie
const POINTER_RADIUS = 170;

// Seconde toile, plus pâle, placée derrière : c'est elle qui donne le relief
// quand on fait tourner l'ensemble.
const BACK_SCALE = 1.15;
const BACK_OFFSET = -0.45;

const ORBIT_SPEED = 0.009; // radians par pixel glissé
const ORBIT_MAX_X = 0.9; // au-delà, la toile se verrait à l'envers
const ORBIT_MAX_VELOCITY = 6;
const DRAG_THRESHOLD = 6; // en dessous, le geste reste un simple clic
const KEY_STEP = 0.2;

// L'araignée évite les cercles du centre : c'est là que se trouve le texte.
const SPIDER_MIN_RING = 3;
const SPIDER_HOME = { ring: 5, spoke: 15 };
const SPIDER_SPEED = 0.85;

type WebNode = {
  bx: number;
  by: number;
  bz: number;
  rad: number;
  o: number; // déplacement courant
  v: number; // vitesse
  a: number; // accélération
  sx: number; // position à l'écran
  sy: number;
  depth: number;
};

type Pulse = { spoke: number; pos: number; speed: number };

// Générateur pseudo-aléatoire à graine fixe : la toile a toujours la même forme.
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Rayon théorique de chaque cercle (sans l'irrégularité ajoutée ensuite).
const RING_RADII = Array.from(
  { length: RINGS },
  (_, r) => HUB + (MAX_RADIUS - HUB) * Math.pow(r / (RINGS - 1), 1.2)
);

function buildWeb(): WebNode[][] {
  const random = seeded(7);
  const angles = Array.from(
    { length: SPOKES },
    (_, s) => (s / SPOKES) * Math.PI * 2 + (random() - 0.5) * 0.12
  );
  const web: WebNode[][] = [];
  for (let r = 0; r < RINGS; r++) {
    const base = RING_RADII[r];
    const ring: WebNode[] = [];
    for (let s = 0; s < SPOKES; s++) {
      const rad = base * (1 + (random() - 0.5) * 0.06);
      ring.push({
        bx: Math.cos(angles[s]) * rad,
        by: Math.sin(angles[s]) * rad,
        bz: -0.28 * rad * rad + (random() - 0.5) * 0.03,
        rad,
        o: 0,
        v: 0,
        a: 0,
        sx: 0,
        sy: 0,
        depth: 0,
      });
    }
    web.push(ring);
  }
  return web;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

// Un fil qui arrive trop près de la caméra s'efface au lieu de traverser l'écran.
const nearFade = (depth: number) => 1 - smoothstep(1.2, 1.7, depth);

// Longueur du plus court chemin entre deux nœuds en suivant les fils : on
// descend vers un cercle intérieur, on le longe, puis on remonte.
function threadDistance(r: number, s: number, tr: number, ts: number) {
  const gap = Math.abs(s - ts);
  const turns = Math.min(gap, SPOKES - gap);
  const arc = (Math.PI * 2) / SPOKES;
  let best = Infinity;
  for (let m = Math.min(r, tr); m >= SPIDER_MIN_RING; m--) {
    const cost =
      RING_RADII[r] + RING_RADII[tr] - 2 * RING_RADII[m] + turns * RING_RADII[m] * arc;
    if (cost < best) best = cost;
  }
  return best;
}

export default function WebCanvas({
  hostRef,
  onInteract,
}: {
  hostRef?: RefObject<HTMLElement | null>; // élément qui reçoit le glisser et le clavier
  onInteract?: () => void; // appelé une fois, à la première manipulation
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const host: HTMLElement = hostRef?.current ?? canvas;

    const web = buildWeb();
    const backX = new Float32Array(RINGS * SPOKES);
    const backY = new Float32Array(RINGS * SPOKES);
    const backDepth = new Float32Array(RINGS * SPOKES);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let width = 0;
    let height = 0;
    let unit = 1;
    let hubX = 0;
    let hubY = 0;
    let reveal = reduceMotion ? 1 : 0;
    let frame = 0;
    let last = 0;
    let nextPulse = 0;
    let nextWander = 0;
    let onScreen = false;
    let interacted = false;
    let releasedAt = -10;
    const pointer = { x: 0, y: 0, active: false, energy: 0 };
    const tilt = { x: 0, y: 0, targetX: 0, targetY: 0 };
    // Rotation ajoutée par le visiteur, avec sa vitesse pour l'inertie.
    const orbit = { x: 0, y: 0, vx: 0, vy: 0 };
    const drag = { id: -1, x: 0, y: 0, travel: 0, moved: false, time: 0 };
    const pulses: Pulse[] = [];
    const spider = {
      r: SPIDER_HOME.ring,
      s: SPIDER_HOME.spoke,
      nr: SPIDER_HOME.ring, // nœud vers lequel elle marche
      ns: SPIDER_HOME.spoke,
      tr: SPIDER_HOME.ring, // destination finale
      ts: SPIDER_HOME.spoke,
      t: 0,
      length: 1,
      moving: false,
      angle: -Math.PI / 2,
      gait: 0,
      stride: 0, // 0 = immobile, 1 = en pleine marche
    };

    const notify = () => {
      if (interacted) return;
      interacted = true;
      onInteract?.();
    };

    const project = (time: number) => {
      const spin = reduceMotion ? 0 : time * 0.02;
      const backSpin = Math.PI / SPOKES - (reduceMotion ? 0 : time * 0.012);
      const rotX =
        BASE_TILT + tilt.x + orbit.x + (reduceMotion ? 0 : Math.cos(time * 0.2) * 0.04);
      const rotY = tilt.y + orbit.y + (reduceMotion ? 0 : Math.sin(time * 0.25) * 0.06);
      const cosS = Math.cos(spin);
      const sinS = Math.sin(spin);
      const cosB = Math.cos(backSpin);
      const sinB = Math.sin(backSpin);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      hubX = width / 2;
      hubY = height / 2;

      for (let r = 0; r < RINGS; r++) {
        for (let s = 0; s < SPOKES; s++) {
          const node = web[r][s];
          const breath = reduceMotion
            ? 0
            : 0.015 * Math.sin(time * 0.9 - node.rad * 5);
          const d = node.o + breath;
          const px = (node.bx * cosS - node.by * sinS) * (1 + d * 0.1);
          const py = (node.bx * sinS + node.by * cosS) * (1 + d * 0.1);
          const pz = node.bz + d * 0.4;
          const x1 = px * cosY + pz * sinY;
          const z1 = -px * sinY + pz * cosY;
          const y2 = py * cosX - z1 * sinX;
          const z2 = py * sinX + z1 * cosX;
          const scale = CAMERA / Math.max(0.6, CAMERA - z2);
          node.sx = hubX + x1 * unit * scale;
          node.sy = hubY + y2 * unit * scale;
          node.depth = z2;

          // Même nœud sur la toile du fond : plus grande, plus loin, décalée
          // d'un demi-fil et tournant lentement dans l'autre sens.
          const qx = (node.bx * cosB - node.by * sinB) * BACK_SCALE;
          const qy = (node.bx * sinB + node.by * cosB) * BACK_SCALE;
          const qz = node.bz * BACK_SCALE + BACK_OFFSET + d * 0.12;
          const bx1 = qx * cosY + qz * sinY;
          const bz1 = -qx * sinY + qz * cosY;
          const by2 = qy * cosX - bz1 * sinX;
          const bz2 = qy * sinX + bz1 * cosX;
          const backScale = CAMERA / Math.max(0.6, CAMERA - bz2);
          const index = r * SPOKES + s;
          backX[index] = hubX + bx1 * unit * backScale;
          backY[index] = hubY + by2 * unit * backScale;
          backDepth[index] = bz2;
        }
      }
    };

    // Chaque nœud est un petit ressort relié à ses voisins : une poussée
    // locale se propage donc en onde dans toute la toile.
    const step = (dt: number) => {
      for (let r = 0; r < RINGS; r++) {
        for (let s = 0; s < SPOKES; s++) {
          const node = web[r][s];
          let sum = web[r][(s + 1) % SPOKES].o + web[r][(s + SPOKES - 1) % SPOKES].o;
          let count = 2;
          if (r > 0) {
            sum += web[r - 1][s].o;
            count++;
          }
          if (r < RINGS - 1) {
            sum += web[r + 1][s].o;
            count++;
          }
          let force = 0;
          if (pointer.active) {
            const dist = Math.hypot(node.sx - pointer.x, node.sy - pointer.y);
            if (dist < POINTER_RADIUS) {
              const k = 1 - dist / POINTER_RADIUS;
              force -= k * k * (4 + pointer.energy * 40);
            }
          }
          node.a = -14 * node.o - 1.8 * node.v + 50 * (sum / count - node.o) + force;
        }
      }
      for (const ring of web) {
        for (const node of ring) {
          node.v += node.a * dt;
          node.o = clamp(node.o + node.v * dt, -1.2, 1.2);
        }
      }
      pointer.energy *= 0.9;
    };

    // Rotation libre : l'élan du geste s'épuise, puis la toile revient
    // doucement à son inclinaison de repos.
    const stepOrbit = (dt: number, time: number) => {
      if (drag.moved) return;
      orbit.x += orbit.vx * dt;
      orbit.y += orbit.vy * dt;
      const friction = Math.exp(-3 * dt);
      orbit.vx *= friction;
      orbit.vy *= friction;
      if (Math.abs(orbit.x) > ORBIT_MAX_X) {
        orbit.x = clamp(orbit.x, -ORBIT_MAX_X, ORBIT_MAX_X);
        orbit.vx = 0;
      }
      // Un tour complet ne change rien à l'image : on garde l'angle court pour
      // que le retour ne « déroule » pas tous les tours accumulés.
      if (orbit.y > Math.PI) orbit.y -= Math.PI * 2;
      if (orbit.y < -Math.PI) orbit.y += Math.PI * 2;
      const back = smoothstep(0.5, 1.6, time - releasedAt);
      const pull = 1 - Math.exp(-2.4 * dt * back);
      orbit.x -= orbit.x * pull;
      orbit.y -= orbit.y * pull;
    };

    const stepSpider = (dt: number, time: number) => {
      if (!spider.moving) {
        const arrived = spider.r === spider.tr && spider.s === spider.ts;
        if (arrived && reveal >= 1 && time > nextWander) {
          // Sans consigne, elle se promène un peu autour de sa position.
          spider.tr = clamp(
            spider.r + Math.floor(Math.random() * 5) - 2,
            SPIDER_MIN_RING,
            RINGS - 3
          );
          spider.ts = (spider.s + Math.floor(Math.random() * 5) - 2 + SPOKES) % SPOKES;
          nextWander = time + 5 + Math.random() * 5;
        }
        if (spider.r === spider.tr && spider.s === spider.ts) {
          spider.stride += (0 - spider.stride) * Math.min(1, dt * 8);
          return;
        }
        // Prochain fil : le voisin qui rapproche le plus de la destination.
        const options = [
          [spider.r - 1, spider.s],
          [spider.r + 1, spider.s],
          [spider.r, (spider.s + 1) % SPOKES],
          [spider.r, (spider.s + SPOKES - 1) % SPOKES],
        ];
        let best = threadDistance(spider.r, spider.s, spider.tr, spider.ts);
        let found = false;
        for (const [r, s] of options) {
          if (r < SPIDER_MIN_RING || r > RINGS - 1) continue;
          const cost = threadDistance(r, s, spider.tr, spider.ts);
          if (cost < best - 1e-6) {
            best = cost;
            spider.nr = r;
            spider.ns = s;
            found = true;
          }
        }
        if (!found) {
          spider.tr = spider.r;
          spider.ts = spider.s;
          return;
        }
        const from = web[spider.r][spider.s];
        const to = web[spider.nr][spider.ns];
        spider.length = Math.max(
          0.05,
          Math.hypot(to.bx - from.bx, to.by - from.by, to.bz - from.bz)
        );
        spider.t = 0;
        spider.moving = true;
      }

      const from = web[spider.r][spider.s];
      const to = web[spider.nr][spider.ns];
      // Elle se tourne dans le sens du fil tel qu'on le voit à l'écran.
      const heading = Math.atan2(to.sy - from.sy, to.sx - from.sx);
      const turn = Math.atan2(
        Math.sin(heading - spider.angle),
        Math.cos(heading - spider.angle)
      );
      spider.angle += turn * Math.min(1, dt * 10);
      spider.stride += (1 - spider.stride) * Math.min(1, dt * 8);
      spider.gait += dt * 16;
      spider.t += (dt * SPIDER_SPEED) / spider.length;
      if (spider.t >= 1) {
        spider.r = spider.nr;
        spider.s = spider.ns;
        spider.t = 0;
        spider.moving = false;
        to.v -= 0.8; // son poids fait vibrer le nœud où elle arrive
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const eased = 1 - Math.pow(1 - reveal, 3);
      const limit = eased * (MAX_RADIUS + 0.2);

      const visibility = (rad: number) => clamp((limit - rad) / 0.15, 0, 1);
      const proximity = (x: number, y: number) =>
        pointer.active
          ? Math.max(0, 1 - Math.hypot(x - pointer.x, y - pointer.y) / 190)
          : 0;

      // Toile du fond, dessinée en premier : un cercle sur deux suffit.
      const backSegment = (i: number, j: number, rad: number) => {
        const shown = visibility(rad);
        if (shown <= 0) return;
        const z = (backDepth[i] + backDepth[j]) / 2;
        const depth = clamp(0.7 + z * 0.35, 0.25, 1);
        const alpha = shown * nearFade(z) * depth * 0.17;
        if (alpha <= 0.004) return;
        ctx.lineWidth = 0.5 + depth * 0.4;
        ctx.strokeStyle = `rgba(94, 234, 212, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(backX[i], backY[i]);
        ctx.lineTo(backX[j], backY[j]);
        ctx.stroke();
      };
      for (let s = 0; s < SPOKES; s++) {
        for (let r = 0; r < RINGS - 1; r++) {
          backSegment(r * SPOKES + s, (r + 1) * SPOKES + s, web[r][s].rad);
        }
      }
      for (let r = 1; r < RINGS; r += 2) {
        for (let s = 0; s < SPOKES; s++) {
          backSegment(r * SPOKES + s, r * SPOKES + ((s + 1) % SPOKES), web[r][s].rad);
        }
      }

      const segment = (a: WebNode, b: WebNode, curved: boolean) => {
        const rad = (a.rad + b.rad) / 2;
        const shown = visibility(rad) * nearFade((a.depth + b.depth) / 2);
        if (shown <= 0) return;
        const mx = (a.sx + b.sx) / 2;
        const my = (a.sy + b.sy) / 2;
        const depth = clamp(0.75 + (a.depth + b.depth) * 0.6, 0.35, 1);
        // Les fils sont plus discrets au centre, là où se trouve le texte.
        const alpha = shown * (0.06 + 0.4 * smoothstep(0.1, 0.7, rad)) * depth;

        // Un fil proche est plus épais qu'un fil lointain.
        ctx.lineWidth = 0.45 + depth;
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        if (curved) {
          ctx.quadraticCurveTo(
            mx + (hubX - mx) * 0.08,
            my + (hubY - my) * 0.08,
            b.sx,
            b.sy
          );
        } else {
          ctx.lineTo(b.sx, b.sy);
        }
        ctx.strokeStyle = `rgba(148, 163, 184, ${alpha})`;
        ctx.stroke();

        const near = proximity(mx, my);
        if (near > 0) {
          ctx.strokeStyle = `rgba(45, 212, 191, ${shown * near * 0.85})`;
          ctx.stroke();
        }
      };

      for (let s = 0; s < SPOKES; s++) {
        for (let r = 0; r < RINGS - 1; r++) {
          segment(web[r][s], web[r + 1][s], false);
        }
      }
      for (let r = 0; r < RINGS; r++) {
        for (let s = 0; s < SPOKES; s++) {
          segment(web[r][s], web[r][(s + 1) % SPOKES], true);
        }
      }

      for (let r = 1; r < RINGS; r++) {
        for (const node of web[r]) {
          const shown = visibility(node.rad) * nearFade(node.depth);
          if (shown <= 0) continue;
          const near = proximity(node.sx, node.sy);
          const depth = clamp(0.75 + node.depth * 1.2, 0.35, 1);
          const alpha = shown * (0.1 + 0.4 * smoothstep(0.1, 0.7, node.rad));
          ctx.beginPath();
          ctx.arc(node.sx, node.sy, 0.7 + depth * 0.8 + near * 2.2, 0, Math.PI * 2);
          ctx.fillStyle =
            near > 0
              ? `rgba(45, 212, 191, ${Math.max(alpha, shown * near)})`
              : `rgba(148, 163, 184, ${alpha})`;
          ctx.fill();
        }
      }

      // Signaux lumineux qui voyagent du centre vers l'extérieur.
      for (const pulse of pulses) {
        const index = Math.floor(pulse.pos);
        const a = web[index][pulse.spoke];
        const b = web[index + 1][pulse.spoke];
        const t = pulse.pos - index;
        const x = a.sx + (b.sx - a.sx) * t;
        const y = a.sy + (b.sy - a.sy) * t;
        const rad = a.rad + (b.rad - a.rad) * t;
        const alpha =
          (0.25 + 0.75 * smoothstep(0.1, 0.6, rad)) *
          nearFade(a.depth + (b.depth - a.depth) * t);
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(45, 212, 191, ${alpha * 0.15})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, 1.9, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(45, 212, 191, ${alpha})`;
        ctx.fill();
      }

      drawSpider(visibility);
    };

    // L'araignée : deux ovales et huit pattes en deux segments, posée sur le
    // fil qu'elle parcourt et grossie par la perspective comme le reste.
    const drawSpider = (visibility: (rad: number) => number) => {
      const a = web[spider.r][spider.s];
      const b = spider.moving ? web[spider.nr][spider.ns] : a;
      const t = spider.t;
      let x = a.sx + (b.sx - a.sx) * t;
      let y = a.sy + (b.sy - a.sy) * t;
      if (spider.moving && spider.r === spider.nr) {
        // Sur un cercle, elle suit la même courbe que le fil dessiné.
        const mx = (a.sx + b.sx) / 2;
        const my = (a.sy + b.sy) / 2;
        const cx = mx + (hubX - mx) * 0.08;
        const cy = my + (hubY - my) * 0.08;
        const u = 1 - t;
        x = u * u * a.sx + 2 * u * t * cx + t * t * b.sx;
        y = u * u * a.sy + 2 * u * t * cy + t * t * b.sy;
      }
      const depth = a.depth + (b.depth - a.depth) * t;
      const alpha = visibility(a.rad + (b.rad - a.rad) * t) * nearFade(depth);
      if (alpha <= 0.01) return;
      const size = clamp(
        (unit * 0.024 * CAMERA) / Math.max(0.6, CAMERA - depth),
        4.5,
        13
      );

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(spider.angle);
      ctx.globalAlpha = alpha;

      ctx.beginPath();
      ctx.arc(0, 0, size * 3.2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(45, 212, 191, 0.1)";
      ctx.fill();

      ctx.lineWidth = Math.max(1, size * 0.15);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(153, 246, 228, 0.9)";
      ctx.beginPath();
      for (let side = -1; side <= 1; side += 2) {
        for (let leg = 0; leg < 4; leg++) {
          // Les pattes avancent par paires alternées, comme une vraie marche.
          const phase = spider.gait + (leg % 2 ? Math.PI : 0) + (side > 0 ? 0 : Math.PI);
          const swing = Math.sin(phase) * 0.24 * spider.stride;
          const base = side * (0.55 + leg * 0.62);
          const knee = base + swing * 0.5;
          const foot = base + side * (leg < 2 ? -0.3 : 0.3) + swing;
          ctx.moveTo(size * 0.3, 0);
          ctx.lineTo(Math.cos(knee) * size * 1.25, Math.sin(knee) * size * 1.25);
          ctx.lineTo(Math.cos(foot) * size * 2.3, Math.sin(foot) * size * 2.3);
        }
      }
      ctx.stroke();

      ctx.fillStyle = "#0b2a2c";
      ctx.strokeStyle = "rgba(94, 234, 212, 0.95)";
      ctx.beginPath();
      ctx.ellipse(-size * 0.8, 0, size * 0.95, size * 0.72, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(size * 0.35, 0, size * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    };

    // Image fixe : sert quand les animations sont réduites, où seule une
    // manipulation directe du visiteur change le dessin.
    const renderStatic = () => {
      project(0);
      draw();
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      unit = 0.5 * Math.hypot(width, height);
      if (reduceMotion) renderStatic();
    };

    const loop = (now: number) => {
      const time = now / 1000;
      const dt = last ? Math.min(0.033, time - last) : 0.016;
      last = time;

      reveal = Math.min(1, reveal + dt / 1.8);
      tilt.x += (tilt.targetX - tilt.x) * 0.06;
      tilt.y += (tilt.targetY - tilt.y) * 0.06;

      stepOrbit(dt, time);
      step(dt);
      project(time);
      stepSpider(dt, time);

      if (reveal >= 1 && time > nextPulse) {
        pulses.push({
          spoke: Math.floor(Math.random() * SPOKES),
          pos: 0,
          speed: 2.5 + Math.random() * 2,
        });
        nextPulse = time + 0.5 + Math.random();
      }
      for (let i = pulses.length - 1; i >= 0; i--) {
        pulses[i].pos += pulses[i].speed * dt;
        if (pulses[i].pos >= RINGS - 1) pulses.splice(i, 1);
      }

      draw();
      frame = requestAnimationFrame(loop);
    };

    // Un clic (ou un appui du doigt) donne une impulsion : la toile ondule, et
    // l'araignée se met en route vers le nœud le plus proche.
    const ripple = (x: number, y: number) => {
      let nearest = Infinity;
      for (let r = 0; r < RINGS; r++) {
        for (let s = 0; s < SPOKES; s++) {
          const node = web[r][s];
          const dist = Math.hypot(node.sx - x, node.sy - y);
          if (dist < 220) node.v -= (1 - dist / 220) * 7;
          if (r >= SPIDER_MIN_RING && dist < nearest) {
            nearest = dist;
            spider.tr = r;
            spider.ts = s;
          }
        }
      }
      nextWander = performance.now() / 1000 + 8;
    };

    const endDrag = () => {
      drag.id = -1;
      drag.moved = false;
      releasedAt = performance.now() / 1000;
      delete host.dataset.dragging;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!event.isPrimary || event.button !== 0) return;
      drag.id = event.pointerId;
      drag.x = event.clientX;
      drag.y = event.clientY;
      drag.travel = 0;
      drag.moved = false;
      drag.time = performance.now() / 1000;
      orbit.vx = 0;
      orbit.vy = 0;
      // Capture : le relâchement nous parvient même hors de la fenêtre, sinon
      // la toile resterait « tenue ». Le doigt est déjà capturé d'office.
      if (event.pointerType === "mouse") {
        try {
          host.setPointerCapture(event.pointerId);
        } catch {
          // pointeur déjà relâché : rien à capturer
        }
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (drag.id === event.pointerId) {
        const dx = event.clientX - drag.x;
        const dy = event.clientY - drag.y;
        drag.x = event.clientX;
        drag.y = event.clientY;
        drag.travel += Math.hypot(dx, dy);
        if (!drag.moved && drag.travel > DRAG_THRESHOLD) {
          drag.moved = true;
          host.dataset.dragging = "true";
          notify();
        }
        if (drag.moved) {
          const now = performance.now() / 1000;
          const elapsed = Math.max(0.008, now - drag.time);
          drag.time = now;
          // Le côté proche de la toile suit le doigt.
          const turnY = dx * ORBIT_SPEED;
          const turnX = -dy * ORBIT_SPEED;
          orbit.y += turnY;
          orbit.x = clamp(orbit.x + turnX, -ORBIT_MAX_X, ORBIT_MAX_X);
          orbit.vy = clamp(
            orbit.vy * 0.5 + (turnY / elapsed) * 0.5,
            -ORBIT_MAX_VELOCITY,
            ORBIT_MAX_VELOCITY
          );
          orbit.vx = clamp(
            orbit.vx * 0.5 + (turnX / elapsed) * 0.5,
            -ORBIT_MAX_VELOCITY,
            ORBIT_MAX_VELOCITY
          );
          if (reduceMotion) renderStatic();
        }
      }
      if (reduceMotion) return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const inside = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;
      if (inside) {
        if (pointer.active) {
          pointer.energy = Math.min(
            1,
            pointer.energy + Math.hypot(x - pointer.x, y - pointer.y) / 300
          );
        }
        pointer.x = x;
        pointer.y = y;
      }
      // L'inclinaison au survol ne concerne que la souris, et se fige pendant
      // qu'on tient la toile pour ne pas se battre avec le glisser.
      if (event.pointerType === "mouse" && drag.id === -1) {
        tilt.targetY = inside ? (x / rect.width - 0.5) * 0.5 : 0;
        tilt.targetX = inside ? (y / rect.height - 0.5) * -0.35 : 0;
      }
      pointer.active = inside;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") pointer.active = false;
      if (drag.id !== event.pointerId) return;
      const wasDrag = drag.moved;
      // Geste arrêté avant d'être relâché : pas d'élan à conserver.
      if (performance.now() / 1000 - drag.time > 0.1) {
        orbit.vx = 0;
        orbit.vy = 0;
      }
      endDrag();
      if (wasDrag) return;
      notify();
      if (reduceMotion) return;
      const rect = canvas.getBoundingClientRect();
      ripple(event.clientX - rect.left, event.clientY - rect.top);
    };

    // Le navigateur reprend la main (défilement vertical au doigt) : on lâche
    // la toile sans déclencher d'onde.
    const onPointerCancel = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") pointer.active = false;
      if (drag.id !== event.pointerId) return;
      orbit.vx = 0;
      orbit.vy = 0;
      endDrag();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      // Uniquement au focus clavier : après un simple clic sur la carte, les
      // flèches doivent continuer à faire défiler la page.
      if (event.target !== host || !host.matches(":focus-visible")) return;
      let turnX = 0;
      let turnY = 0;
      if (event.key === "ArrowLeft") turnY = -1;
      else if (event.key === "ArrowRight") turnY = 1;
      else if (event.key === "ArrowUp") turnX = 1;
      else if (event.key === "ArrowDown") turnX = -1;
      else return;
      // Les flèches font tourner la toile au lieu de faire défiler la page.
      event.preventDefault();
      notify();
      if (reduceMotion) {
        orbit.y += turnY * KEY_STEP;
        orbit.x = clamp(orbit.x + turnX * KEY_STEP, -ORBIT_MAX_X, ORBIT_MAX_X);
        renderStatic();
        return;
      }
      orbit.vy = clamp(orbit.vy + turnY * 2.4, -ORBIT_MAX_VELOCITY, ORBIT_MAX_VELOCITY);
      orbit.vx = clamp(orbit.vx + turnX * 2.4, -ORBIT_MAX_VELOCITY, ORBIT_MAX_VELOCITY);
      releasedAt = performance.now() / 1000;
    };

    // L'animation s'arrête quand la toile n'est plus visible à l'écran ou que
    // l'onglet passe en arrière-plan.
    const syncLoop = () => {
      cancelAnimationFrame(frame);
      if (!reduceMotion && onScreen && !document.hidden) {
        last = 0;
        frame = requestAnimationFrame(loop);
      }
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      syncLoop();
    });
    visibilityObserver.observe(canvas);

    host.addEventListener("pointerdown", onPointerDown);
    host.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
    document.addEventListener("visibilitychange", syncLoop);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      host.removeEventListener("pointerdown", onPointerDown);
      host.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      document.removeEventListener("visibilitychange", syncLoop);
      delete host.dataset.dragging;
    };
  }, [hostRef, onInteract]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 -z-20 h-full w-full touch-pan-y"
    />
  );
}
