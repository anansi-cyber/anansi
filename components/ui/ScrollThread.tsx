"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

// Fil de soie tissé tout en haut de l'écran : il s'allonge avec le défilement
// de la page et se termine par une perle lumineuse. Purement décoratif : il ne
// reçoit ni clic ni focus, et ne pilote jamais le défilement.
export default function ScrollThread() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const spring = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    restDelta: 0.0005,
  });
  // Animations réduites : le fil suit le défilement tel quel, sans ressort.
  const progress = reduceMotion ? scrollYProgress : spring;

  // La perle est portée par un calque de la largeur de l'écran, qu'on fait
  // glisser : contrairement à un scaleX, elle n'est pas écrasée.
  const beadX = useTransform(progress, (value) => `${(value - 1) * 100}%`);
  // En haut de page le fil est vide : la perle n'apparaît qu'aux premiers pixels.
  const beadOpacity = useTransform(progress, [0, 0.015], [0, 1]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 print:hidden"
    >
      <motion.div
        style={{ scaleX: progress }}
        className="absolute inset-0 origin-left bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400"
      />
      <motion.div
        style={{ x: beadX, opacity: beadOpacity }}
        className="absolute inset-0"
      >
        <span className="absolute -right-0.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-cyan-200 shadow-[0_0_10px_2px_rgb(34_211_238/0.85),0_0_22px_6px_rgb(45_212_191/0.4)]" />
      </motion.div>
    </div>
  );
}
