"use client";

import { useEffect, useRef, type RefObject } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import TiltCard, { TiltLayer } from "@/components/ui/TiltCard";

type Step = {
  title: string;
  description: string;
};

// Pour ajouter une étape : ajouter une ligne à ce tableau.
const steps: Step[] = [
  {
    title: "Échange",
    description: "On écoute votre besoin, gratuitement.",
  },
  {
    title: "Réalisation",
    description: "On construit, avec des points d'étape réguliers.",
  },
  {
    title: "Suivi",
    description:
      "Livraison, formation et accompagnement après le lancement.",
  },
];

function StepItem({
  step,
  index,
  progress,
  marks,
}: {
  step: Step;
  index: number;
  progress: MotionValue<number>;
  marks: RefObject<number[]>;
}) {
  const reduceMotion = useReducedMotion();
  const itemRef = useRef<HTMLLIElement>(null);
  const onRight = index % 2 === 1;

  // Trajet de l'étape dans la fenêtre : 0 quand elle entre par le bas, 0.5
  // quand elle est au centre, 1 quand elle sort par le haut.
  const { scrollYProgress } = useScroll({
    target: itemRef,
    offset: ["start end", "end start"],
  });
  const smoothTravel = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
  });
  const centred = useMotionValue(0.5);
  const travel = reduceMotion ? centred : smoothTravel;
  // La carte arrive de biais et en retrait, fait face au lecteur autour du
  // centre (palier de 0.4 à 0.6, pour la lire à plat), puis se détourne un peu.
  // Les cartes de gauche et de droite se tournent vers le fil central.
  const side = onRight ? -1 : 1;
  const poseRotateY = useTransform(
    travel,
    [0, 0.4, 0.6, 1],
    [16 * side, 0, 0, -7 * side]
  );
  const poseRotateX = useTransform(travel, [0, 0.4, 0.6, 1], [12, 0, 0, -8]);
  const poseZ = useTransform(travel, [0, 0.4, 0.6, 1], [-90, 0, 0, -50]);

  // Le repère s'allume quand le fil dégradé l'atteint.
  const active = useTransform(progress, (value) => {
    const at = marks.current[index] ?? (index + 0.5) / steps.length;
    return Math.min(1, Math.max(0, (value - at + 0.05) / 0.05));
  });
  const borderColor = useTransform(
    active,
    [0, 1],
    ["rgba(255, 255, 255, 0.15)", "rgba(94, 234, 212, 1)"]
  );
  const color = useTransform(
    active,
    [0, 1],
    ["rgba(113, 113, 122, 1)", "rgba(250, 250, 250, 1)"]
  );
  const boxShadow = useTransform(
    active,
    [0, 1],
    [
      "0 0 0px 0px rgba(20, 184, 166, 0)",
      "0 0 14px 3px rgba(20, 184, 166, 0.7)",
    ]
  );
  // Allumé, le repère avance vers le lecteur ; le ressort lui donne un rebond.
  const pop = useSpring(active, { stiffness: 320, damping: 14 });
  const markerZ = useTransform(pop, [0, 1], [0, 70], { clamp: false });

  return (
    <li
      ref={itemRef}
      className="relative mb-10 pl-14 last:mb-0 md:grid md:grid-cols-2 md:gap-16 md:pl-0"
    >
      <motion.span
        aria-hidden="true"
        data-step-marker=""
        style={{
          borderColor,
          color,
          boxShadow,
          z: markerZ,
          transformPerspective: 500,
        }}
        className="absolute left-0 top-5 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-[#040b0c] font-mono text-sm font-semibold md:left-1/2 md:-translate-x-1/2"
      >
        {String(index + 1).padStart(2, "0")}
      </motion.span>

      <Reveal
        variant={onRight ? "right" : "left"}
        className={onRight ? "md:col-start-2" : undefined}
      >
        {/* Pose liée au défilement, sur une enveloppe à part : Reveal et
            TiltCard gardent chacun leur propre transformation. */}
        <motion.div
          style={{
            rotateX: poseRotateX,
            rotateY: poseRotateY,
            z: poseZ,
            transformPerspective: 1100,
          }}
        >
          <TiltCard className="p-6">
            <TiltLayer depth={26}>
              <p className="font-mono text-xs uppercase tracking-widest text-teal-300">
                Étape {index + 1}
              </p>
            </TiltLayer>
            <TiltLayer depth={14} className="mt-3">
              <h3 className="font-display text-lg font-semibold text-zinc-50">
                {step.title}
              </h3>
            </TiltLayer>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              {step.description}
            </p>
          </TiltCard>
        </motion.div>
      </Reveal>
    </li>
  );
}

export default function Process() {
  const reduceMotion = useReducedMotion();
  const timelineRef = useRef<HTMLDivElement>(null);
  // Position de chaque repère le long du fil, de 0 à 1.
  const marks = useRef<number[]>([]);
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start 75%", "end 85%"],
  });
  const lineProgress = useSpring(scrollYProgress, { stiffness: 90, damping: 22 });
  const complete = useMotionValue(1);
  const progress = reduceMotion ? complete : lineProgress;
  // Perle lumineuse en tête du fil. Un pourcentage de translation se mesure
  // sur la hauteur de son enveloppe, qui est celle du fil : aucun recalcul
  // de mise en page pendant le défilement.
  const beadY = useTransform(progress, (value) => `${value * 100}%`);

  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;

    const measure = () => {
      const box = timeline.getBoundingClientRect();
      if (box.height === 0) return;
      marks.current = Array.from(
        timeline.querySelectorAll<HTMLElement>("[data-step-marker]")
      ).map((marker) => {
        const rect = marker.getBoundingClientRect();
        return (rect.top + rect.height / 2 - box.top) / box.height;
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(timeline);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="methode" className="scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          index="02"
          title="Comment on travaille"
          subtitle="Du premier échange au suivi après le lancement."
        />

        <div ref={timelineRef} className="relative mt-12">
          <div
            aria-hidden="true"
            className="absolute left-[19px] top-0 h-full w-px bg-white/10 md:left-1/2"
          />
          <motion.div
            aria-hidden="true"
            style={{ scaleY: progress }}
            className="absolute left-[19px] top-0 h-full w-px origin-top bg-gradient-to-b from-teal-400 via-emerald-400 to-cyan-500 shadow-[0_0_12px_1px_rgb(20_184_166/0.8)] md:left-1/2"
          />
          {/* Masquée si les animations sont réduites : le fil est alors complet. */}
          <motion.div
            aria-hidden="true"
            style={{ y: beadY }}
            className="pointer-events-none absolute left-[19px] top-0 h-full w-px motion-reduce:hidden md:left-1/2"
          >
            <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-100 shadow-[0_0_14px_4px_rgb(45_212_191/0.8)]" />
          </motion.div>

          <ol>
            {steps.map((step, index) => (
              <StepItem
                key={step.title}
                step={step}
                index={index}
                progress={progress}
                marks={marks}
              />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
