"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { Rotate3d } from "lucide-react";
import WebCanvas from "@/components/WebCanvas";

// Étiquettes flottantes : chacune sur son propre plan de profondeur, de la
// plus proche de la carte à la plus proche du visiteur.
const chips = [
  {
    label: "Développement",
    depth: 40,
    className: "-left-2 top-10 text-teal-200 md:-left-8",
  },
  {
    label: "IA",
    depth: 65,
    className: "-right-1 top-1/3 text-emerald-200 [animation-delay:-2s] md:-right-6",
  },
  {
    label: "Cybersécurité",
    depth: 90,
    className: "right-0 bottom-16 text-cyan-200 [animation-delay:-3s] md:-right-3",
  },
];

// Carte en parallaxe 3D : le cadre pivote vers le pointeur, tandis que le
// halo, le cadre, la carte et les étiquettes sont étagés en profondeur au-dessus
// d'une ombre au sol. À l'intérieur, la toile d'araignée d'ANANSI se saisit et
// se fait tourner, à la souris, au doigt ou au clavier.
export default function HeroVisual() {
  const reduceMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const [touched, setTouched] = useState(false);
  const handleInteract = useCallback(() => setTouched(true), []);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness: 80, damping: 18 });
  const springY = useSpring(pointerY, { stiffness: 80, damping: 18 });

  const rotateY = useTransform(springX, [-0.5, 0.5], [-14, 14]);
  const rotateX = useTransform(springY, [-0.5, 0.5], [10, -10]);
  const glowX = useTransform(springX, [-0.5, 0.5], [28, -28]);
  const glowY = useTransform(springY, [-0.5, 0.5], [28, -28]);
  // L'ombre glisse à l'opposé de l'inclinaison, comme sous un objet éclairé.
  const shadowX = useTransform(springX, [-0.5, 0.5], [34, -34]);
  const shadowScale = useTransform(springY, [-0.5, 0.5], [1.08, 0.92]);
  // Reflet qui se déplace sur la surface de la carte avec le pointeur.
  const sheenX = useTransform(springX, [-0.5, 0.5], ["-30%", "30%"]);
  const sheenY = useTransform(springY, [-0.5, 0.5], ["-30%", "30%"]);

  const { scrollY } = useScroll();
  const scrollShift = useTransform(scrollY, [0, 700], [0, 40]);

  useEffect(() => {
    if (reduceMotion) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    function handlePointerMove(event: PointerEvent) {
      if (event.pointerType !== "mouse") return;
      pointerX.set(event.clientX / window.innerWidth - 0.5);
      pointerY.set(event.clientY / window.innerHeight - 0.5);
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [reduceMotion, pointerX, pointerY]);

  return (
    <motion.div
      style={{ y: reduceMotion ? 0 : scrollShift }}
      className="relative mx-auto w-full max-w-xs [perspective:1200px] md:w-80"
    >
      <motion.div
        aria-hidden="true"
        style={{ x: shadowX, scaleX: shadowScale }}
        className="pointer-events-none absolute inset-x-8 -bottom-12 h-10 rounded-[50%] bg-teal-400/25 blur-2xl"
      />

      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative"
      >
        <motion.div
          aria-hidden="true"
          style={{ x: glowX, y: glowY, z: -110 }}
          className="pointer-events-none absolute -inset-10 bg-[radial-gradient(closest-side,rgb(20_184_166/0.5),transparent)]"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-3 rounded-[2rem] border border-emerald-400/25 [transform:translateZ(-60px)]"
        />

        <div
          ref={cardRef}
          role="group"
          tabIndex={0}
          aria-label="Toile d'araignée ANANSI en 3D. Utilisez les flèches du clavier pour la faire tourner."
          className="relative isolate aspect-[3/4] cursor-grab touch-pan-y select-none overflow-hidden rounded-3xl border border-white/15 bg-[#071214] shadow-[0_40px_80px_-30px_rgb(13_148_136/0.7)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400 data-[dragging=true]:cursor-grabbing"
        >
          <WebCanvas hostRef={cardRef} onInteract={handleInteract} />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(closest-side,rgb(7_18_20/0.85),transparent)]"
          />
          <motion.div
            aria-hidden="true"
            style={{ x: sheenX, y: sheenY }}
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(closest-side,rgb(255_255_255/0.07),transparent)]"
          />
          <p className="pointer-events-none flex h-full items-center justify-center font-display text-3xl font-bold tracking-tight text-zinc-50">
            ANANSI<span className="text-gradient">.</span>
          </p>
          {/* Indice visuel seulement : le nom accessible de la carte explique
              déjà le clavier aux lecteurs d'écran. */}
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute inset-x-0 bottom-4 flex justify-center transition-opacity duration-700 ${
              touched ? "opacity-0" : "opacity-100"
            }`}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#040b0c]/85 px-3 py-1.5 text-[11px] font-medium text-slate-200">
              <Rotate3d className="h-3.5 w-3.5 text-teal-300" />
              Glissez pour la faire tourner
            </span>
          </span>
        </div>

        {chips.map((chip) => (
          <motion.a
            key={chip.label}
            href="#services"
            style={{ z: chip.depth }}
            whileHover={reduceMotion ? undefined : { z: chip.depth + 45, scale: 1.06 }}
            whileFocus={reduceMotion ? undefined : { z: chip.depth + 45, scale: 1.06 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className={`absolute inline-flex min-h-11 animate-float items-center rounded-full border border-white/15 bg-[#0a171a]/90 px-4 text-xs font-medium shadow-lg transition-colors duration-300 hover:border-emerald-400/60 hover:bg-[#0d2023] focus-visible:border-emerald-400/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${chip.className}`}
          >
            {chip.label}
          </motion.a>
        ))}
      </motion.div>
    </motion.div>
  );
}
