"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";

// Aimant : l'élément enfant (bouton, lien) est attiré vers le pointeur quand
// celui-ci s'approche, puis revient en place. Souris uniquement.
export default function Magnetic({
  children,
  strength = 0.3,
  className,
}: {
  children: React.ReactNode;
  strength?: number; // part de la distance au centre suivie par l'élément
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 16, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 220, damping: 16, mass: 0.4 });

  function handlePointerMove(event: React.PointerEvent<HTMLSpanElement>) {
    if (reduceMotion || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((event.clientY - (rect.top + rect.height / 2)) * strength);
  }

  function handlePointerLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.span
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{ x: springX, y: springY }}
      className={`inline-block ${className ?? ""}`}
    >
      {children}
    </motion.span>
  );
}
