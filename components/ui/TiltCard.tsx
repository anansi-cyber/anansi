"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionStyle,
} from "framer-motion";

// Position du « regard » sur un objet, de 0 à 1 sur chaque axe (0.5 = centre).
// À la souris, elle suit le pointeur. Sans survol (téléphone), elle suit la
// place de l'objet dans la fenêtre : la profondeur se voit aussi en défilant.
export function useTilt<T extends HTMLElement>() {
  const reduceMotion = useReducedMotion();
  const ref = useRef<T>(null);
  const targetX = useMotionValue(0.5);
  const targetY = useMotionValue(0.5);
  const x = useSpring(targetX, { stiffness: 180, damping: 18 });
  const y = useSpring(targetY, { stiffness: 180, damping: 18 });

  useEffect(() => {
    const element = ref.current;
    if (!element || reduceMotion) return;
    if (!window.matchMedia("(hover: none)").matches) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = element.getBoundingClientRect();
      const centre = (rect.top + rect.height / 2) / window.innerHeight;
      // Amplitude réduite : quelques degrés seulement entre le bas et le haut.
      const clamped = Math.min(1, Math.max(0, centre));
      targetY.set(0.5 + (0.5 - clamped) * 0.7);
    };
    // Écoute passive : on lit la position, on ne retient jamais le défilement.
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    // On n'écoute le défilement que tant que l'objet est à l'écran.
    const observer = new IntersectionObserver(([entry]) => {
      window.removeEventListener("scroll", onScroll);
      if (entry.isIntersecting) {
        window.addEventListener("scroll", onScroll, { passive: true });
        update();
      }
    });
    observer.observe(element);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [reduceMotion, targetY]);

  function onPointerMove(event: React.PointerEvent<T>) {
    if (reduceMotion || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    targetX.set((event.clientX - rect.left) / rect.width);
    targetY.set((event.clientY - rect.top) / rect.height);
  }

  function onPointerLeave(event: React.PointerEvent<T>) {
    if (event.pointerType !== "mouse") return;
    targetX.set(0.5);
    targetY.set(0.5);
  }

  return { ref, x, y, onPointerMove, onPointerLeave };
}

// Étage d'une TiltCard : son contenu flotte à "depth" pixels au-dessus de la
// surface de la carte. La hauteur réelle dépend de --tilt-lift (globals.css) :
// les étages montent au survol et restent à plat si les animations sont réduites.
export function TiltLayer({
  children,
  depth = 24,
  className = "",
}: {
  children: React.ReactNode;
  depth?: number;
  className?: string;
}) {
  return (
    <div
      className={`tilt-layer ${className}`}
      style={{ "--tilt-depth": `${depth}px` } as CSSProperties}
    >
      {children}
    </div>
  );
}

// Carte en verre qui s'incline en 3D vers le pointeur. Le fond flouté est un
// calque séparé : backdrop-filter sur l'élément incliné aplatirait la 3D.
export default function TiltCard({
  children,
  className = "",
  max = 9,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
}) {
  const tilt = useTilt<HTMLDivElement>();

  const rotateY = useTransform(tilt.x, [0, 1], [-max, max]);
  const rotateX = useTransform(tilt.y, [0, 1], [max, -max]);
  // Mêmes valeurs de -1 à 1, exposées en variables CSS : les enfants (jeton
  // d'icône, ombres) peuvent tourner avec la carte sans écouter la souris.
  const pointerX = useTransform(tilt.x, [0, 1], [-1, 1]);
  const pointerY = useTransform(tilt.y, [0, 1], [-1, 1]);

  const lightX = useTransform(tilt.x, (value) => `${value * 100}%`);
  const lightY = useTransform(tilt.y, (value) => `${value * 100}%`);
  const glare = useMotionTemplate`radial-gradient(420px circle at ${lightX} ${lightY}, rgb(45 212 191 / 0.22), transparent 60%)`;
  // Reflet spéculaire : seule l'arête proche de la lumière s'éclaire.
  const edge = useMotionTemplate`radial-gradient(260px circle at ${lightX} ${lightY}, rgb(204 251 241 / 0.95), rgb(45 212 191 / 0.4) 40%, transparent 70%)`;

  // L'ombre portée glisse à l'opposé de la lumière.
  const shadowX = useTransform(tilt.x, [0, 1], [18, -18]);
  const shadowY = useTransform(tilt.y, [0, 1], [30, 2]);

  return (
    <div
      ref={tilt.ref}
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
      className="tilt-card group relative h-full [perspective:1100px]"
    >
      <motion.div
        aria-hidden="true"
        style={{ x: shadowX, y: shadowY }}
        className="pointer-events-none absolute inset-3 rounded-2xl bg-teal-500/30 opacity-40 blur-2xl transition-opacity duration-300 group-hover:opacity-100 group-has-[:focus-visible]:opacity-100"
      />
      <motion.div
        style={
          {
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
            "--tilt-px": pointerX,
            "--tilt-py": pointerY,
          } as MotionStyle
        }
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
        className="tilt-card-body relative h-full rounded-2xl shadow-[0_20px_50px_-25px_rgb(0_0_0/0.9)]"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] transition-colors duration-300 group-hover:border-emerald-400/40 group-has-[:focus-visible]:border-emerald-400/40"
        />
        <motion.div
          aria-hidden="true"
          style={{ background: glare }}
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
        {/* Sans survol (tactile), l'arête reste un peu éclairée : le reflet se
            déplace alors avec le défilement. */}
        <motion.div
          aria-hidden="true"
          style={{ background: edge }}
          className="tilt-edge pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 [@media(hover:none)]:opacity-60"
        />
        {/* preserve-3d : les TiltLayer enfants s'élèvent au-dessus de ce plan. */}
        <div
          className={`relative h-full [transform-style:preserve-3d] [transform:translateZ(28px)] ${className}`}
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
}
