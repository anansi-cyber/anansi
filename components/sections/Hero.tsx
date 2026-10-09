"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import HeroVisual from "@/components/ui/HeroVisual";
import Magnetic from "@/components/ui/Magnetic";
import Reveal from "@/components/ui/Reveal";
import ScrambleText from "@/components/ui/ScrambleText";

const facts = [
  { label: "Nos métiers", value: "Développement, sécurité, IA, audit" },
  { label: "Nos clients", value: "Des TPE aux PME" },
  { label: "Premier échange", value: "Gratuit, pour comprendre votre besoin" },
  { label: "Devis", value: "Clair et détaillé, sous 24h" },
];

// Plan de profondeur de la colonne de texte : plus `depth` est grand, plus le
// bloc semble proche et suit le pointeur. L'effet reste de quelques pixels et
// d'un degré et demi au plus, pour ne jamais gêner la lecture.
function Depth({
  pointerX,
  pointerY,
  depth,
  children,
}: {
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  depth: number; // déplacement maximal, en pixels, d'un bord à l'autre de l'écran
  children: React.ReactNode;
}) {
  const x = useTransform(pointerX, (value) => value * depth);
  const y = useTransform(pointerY, (value) => value * depth);
  const rotateY = useTransform(pointerX, (value) => value * 3);
  const rotateX = useTransform(pointerY, (value) => value * -3);

  return (
    <motion.div style={{ x, y, rotateX, rotateY, transformPerspective: 1000 }}>
      {children}
    </motion.div>
  );
}

export default function Hero() {
  const reduceMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness: 80, damping: 18 });
  const springY = useSpring(pointerY, { stiffness: 80, damping: 18 });

  // Souris uniquement : au doigt, le texte ne doit pas bouger pendant qu'on
  // fait défiler la page.
  function handlePointerMove(event: React.PointerEvent<HTMLElement>) {
    if (reduceMotion || event.pointerType !== "mouse") return;
    pointerX.set(event.clientX / window.innerWidth - 0.5);
    pointerY.set(event.clientY / window.innerHeight - 0.5);
  }

  function handlePointerLeave() {
    pointerX.set(0);
    pointerY.set(0);
  }

  return (
    <section
      id="accueil"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="scroll-mt-20 flex min-h-[calc(100vh-4.5rem)] items-center px-4 sm:px-6"
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-16 py-20 md:grid-cols-[1fr_auto]">
        <div>
          <Reveal>
            <p className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-1.5 text-sm font-medium text-emerald-200 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Réponse sous 24h · Devis gratuit
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <Depth pointerX={springX} pointerY={springY} depth={12}>
              <h1 className="font-display text-4xl font-bold tracking-tight text-zinc-50 md:text-6xl">
                Vous avez un projet&nbsp;?{" "}
                <ScrambleText
                  text="Parlons-en."
                  className="text-gradient text-gradient-animated"
                />
              </h1>
            </Depth>
          </Reveal>
          <Reveal delay={0.16}>
            <Depth pointerX={springX} pointerY={springY} depth={8}>
              <p className="mt-4 text-xl text-slate-300 md:text-2xl">
                Développement web | Cybersécurité | Intelligence artificielle
              </p>
            </Depth>
          </Reveal>
          <Reveal delay={0.24}>
            <Depth pointerX={springX} pointerY={springY} depth={5}>
              <p className="mt-6 max-w-[58ch] text-base leading-relaxed text-slate-400 md:text-lg">
                Conception d&apos;applications, sites web, tests de sécurité,
                intégration IA ou renforcement de systèmes. ANANSI vous accompagne
                de l&apos;idée à la livraison.
              </p>
            </Depth>
          </Reveal>
          <Reveal delay={0.28}>
            <Depth pointerX={springX} pointerY={springY} depth={3}>
              <dl className="mt-8 grid max-w-2xl gap-x-8 gap-y-5 border-t border-white/10 pt-6 sm:grid-cols-2">
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <dt className="text-sm text-slate-500">{fact.label}</dt>
                    <dd className="mt-1 text-sm font-medium text-zinc-100">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Depth>
          </Reveal>

          <Reveal delay={0.32}>
            {/* inline-block : dans l'aimant, les liens ne sont plus des
                éléments flex et doivent garder leur hauteur de 48px. */}
            <div className="mt-10 flex flex-wrap gap-4">
              <Magnetic>
                <a
                  href="#contact"
                  className="btn-gradient inline-block rounded-xl px-6 py-3.5 text-sm font-semibold text-white"
                >
                  <span className="relative z-10">
                    Contactez-nous pour votre projet{" "}
                    <span aria-hidden="true">→</span>
                  </span>
                </a>
              </Magnetic>
              <Magnetic>
                <a
                  href="#services"
                  className="inline-block rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-zinc-100 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-400/60 hover:bg-white/10"
                >
                  Voir nos services
                </a>
              </Magnetic>
            </div>
          </Reveal>
        </div>

        <Reveal variant="flip" delay={0.2}>
          <HeroVisual />
        </Reveal>
      </div>
    </section>
  );
}
