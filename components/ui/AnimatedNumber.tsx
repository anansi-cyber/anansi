"use client";

import { useEffect, useRef, useState } from "react";
import {
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
} from "framer-motion";

// Nombre qui glisse vers sa nouvelle valeur avec un ressort. Le texte animé est
// écrit directement dans le DOM (aucun rendu React par image) et masqué aux
// lecteurs d'écran, qui lisent la valeur réelle dans un texte invisible : ils
// n'entendent donc jamais les valeurs intermédiaires.
export default function AnimatedNumber({
  value,
  format,
  className,
}: {
  value: number;
  format: Intl.NumberFormat;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const textRef = useRef<HTMLSpanElement>(null);
  const spring = useSpring(value, { stiffness: 110, damping: 20 });
  // Texte du premier rendu, figé : React ne réécrit donc jamais ce nœud et ne
  // vient pas écraser l'animation quand la valeur change.
  const [initialText] = useState(() => format.format(value));

  useEffect(() => {
    // Animations réduites : on saute directement à la valeur.
    if (reduceMotion) spring.jump(value);
    else spring.set(value);
  }, [value, reduceMotion, spring]);

  useMotionValueEvent(spring, "change", (latest) => {
    if (textRef.current) textRef.current.textContent = format.format(latest);
  });

  return (
    <span className={className}>
      {/* Chiffres à chasse fixe : la largeur ne tremble pas pendant l'animation. */}
      <span ref={textRef} aria-hidden="true" className="tabular-nums">
        {initialText}
      </span>
      <span className="sr-only">{format.format(value)}</span>
    </span>
  );
}
