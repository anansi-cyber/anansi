"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

type Variant = "up" | "flip" | "left" | "right";

const hidden: Record<Variant, Record<string, number>> = {
  up: { opacity: 0, y: 32 },
  flip: { opacity: 0, y: 40, rotateX: -35 },
  left: { opacity: 0, x: -48, rotateY: 28 },
  right: { opacity: 0, x: 48, rotateY: -28 },
};

const shown = { opacity: 1, x: 0, y: 0, rotateX: 0, rotateY: 0 };

export default function Reveal({
  children,
  variant = "up",
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  variant?: Variant;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  // Cas normal : le bloc apparaît quand il dépasse de 80 px le bas de l'écran.
  const entered = useInView(ref, {
    once: true,
    margin: "0px 0px -80px 0px",
  });
  // Filet de sécurité : un bloc visible à l'écran mais qui ne franchit jamais
  // cette marge (tout en bas de la page, par exemple) s'affiche quand même.
  const onScreen = useInView(ref, { once: true });
  const [late, setLate] = useState(false);

  useEffect(() => {
    if (!onScreen || entered) return;
    const timer = window.setTimeout(() => setLate(true), 600);
    return () => window.clearTimeout(timer);
  }, [onScreen, entered]);

  // Animations réduites : le contenu est affiché tout de suite, sans attendre.
  const revealed = reduceMotion === true || entered || late;

  return (
    <motion.div
      ref={ref}
      data-reveal=""
      className={className}
      initial={hidden[variant]}
      animate={revealed ? shown : hidden[variant]}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }
      }
      style={{ transformPerspective: 1000 }}
    >
      {children}
    </motion.div>
  );
}
