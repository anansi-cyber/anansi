"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import Reveal from "@/components/ui/Reveal";

export default function SectionHeading({
  index,
  title,
  subtitle,
}: {
  index: string;
  title: string;
  subtitle?: string;
}) {
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const springX = useSpring(x, { stiffness: 140, damping: 20 });
  const springY = useSpring(y, { stiffness: 140, damping: 20 });
  // Inclinaison très légère : le numéro, posé plus près du lecteur que le
  // titre, se décale par parallaxe quand la souris bouge.
  const rotateY = useTransform(springX, [0, 1], [-4, 4]);
  const rotateX = useTransform(springY, [0, 1], [4, -4]);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (reduceMotion || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - rect.left) / rect.width);
    y.set((event.clientY - rect.top) / rect.height);
  }

  function handlePointerLeave() {
    x.set(0.5);
    y.set(0.5);
  }

  return (
    <Reveal>
      <div onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave}>
        {/* Origine à gauche : le titre reste aligné sur le reste de la section. */}
        <motion.div
          style={{
            rotateX,
            rotateY,
            transformPerspective: 900,
            transformStyle: "preserve-3d",
            originX: 0,
            originY: 0.5,
          }}
          className="w-fit max-w-full"
        >
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-emerald-300/80 [transform:translateZ(36px)]">
            {index}
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-zinc-50 md:text-4xl">
            <span className="text-gradient">{title}</span>
          </h2>
          {/* Le trait se dessine de gauche à droite à l'arrivée du titre. */}
          <motion.div
            aria-hidden="true"
            initial={{ scaleX: 0.08, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{ z: 14, originX: 0 }}
            className="mt-4 h-px w-24 bg-gradient-to-r from-teal-400 via-emerald-400 to-transparent"
          />
        </motion.div>
        {subtitle && <p className="mt-4 max-w-2xl text-zinc-400">{subtitle}</p>}
      </div>
    </Reveal>
  );
}
