"use client";

// Calculateur de temps gagné avec l'IA. Tout se calcule dans le navigateur.
//
// Pour modifier les hypothèses par défaut :
// - tâches, nombres par semaine et durées : tableau "tasks" ci-dessous ;
// - gain de temps (bornes du curseur et valeur de départ) : objet "gain" ;
// - conversions semaine -> mois / an et durée d'une journée de travail :
//   WEEKS_PER_MONTH, WEEKS_PER_YEAR et HOURS_PER_WORKDAY.

import { useEffect, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import Magnetic from "@/components/ui/Magnetic";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";

type Task = {
  id: string;
  label: string;
  count: number; // nombre par semaine
  minutes: number; // durée moyenne d'une tâche, en minutes
};

// Pour ajouter une tâche : ajouter une ligne à ce tableau.
const tasks: Task[] = [
  { id: "emails", label: "Emails répétitifs", count: 10, minutes: 5 },
  { id: "devis", label: "Devis ou documents à rédiger", count: 2, minutes: 30 },
  { id: "relances", label: "Relances clients", count: 3, minutes: 10 },
];

// Part du temps économisée, en pourcentage.
const gain = { min: 20, max: 70, step: 5, initial: 50 };

const WEEKS_PER_MONTH = 4.33;
const WEEKS_PER_YEAR = 52;
const HOURS_PER_WORKDAY = 7;
// Plafond de saisie d'un champ, pour garder un résultat lisible.
const MAX_VALUE = 9999;

type Field = "count" | "minutes";
type Values = Record<string, Record<Field, string>>;

const initialValues: Values = Object.fromEntries(
  tasks.map((task) => [
    task.id,
    { count: String(task.count), minutes: String(task.minutes) },
  ])
);

// Une valeur vide, invalide ou négative compte pour 0.
function toNumber(value: string) {
  const number = Number(value.replace(",", "."));
  return Number.isFinite(number) && number > 0 ? Math.min(number, MAX_VALUE) : 0;
}

// Arrondi à une décimale : le nombre affiché et son accord restent cohérents.
function round1(value: number) {
  return Math.round(value * 10) / 10;
}

const hoursFormat = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const daysFormat = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

function plural(value: number, word: string) {
  return value >= 2 ? `${word}s` : word;
}

// Même profondeur au focus que le formulaire de contact : le champ actif se
// soulève légèrement, avec une lueur teal dessous (CSS seul).
const fieldClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 transition-[translate,box-shadow,border-color,background-color] duration-300 focus:-translate-y-0.5 focus:border-teal-400/60 focus:bg-white/[0.07] focus:shadow-[0_16px_30px_-16px_rgb(45_212_191/0.6)] motion-reduce:focus:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400";
const labelClass = "block text-sm text-zinc-300";
const cardClass =
  "rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 shadow-[0_30px_60px_-30px_rgb(0_0_0/0.9)] md:p-8";

// Valeur qui rejoint sa cible avec un ressort. Animations réduites : elle y
// saute directement.
function useSpringTo(target: number) {
  const reduceMotion = useReducedMotion();
  const spring = useSpring(target, { stiffness: 120, damping: 20 });

  useEffect(() => {
    if (reduceMotion) spring.jump(target);
    else spring.set(target);
  }, [target, reduceMotion, spring]);

  return spring;
}

// Position de la souris dans une zone, de 0 à 1 sur chaque axe et lissée par
// un ressort : elle oriente les objets 3D. Souris uniquement ; au doigt ou en
// animations réduites, les objets gardent leur pose de repos.
function usePointerTilt() {
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const springX = useSpring(x, { stiffness: 150, damping: 18 });
  const springY = useSpring(y, { stiffness: 150, damping: 18 });

  function onPointerMove(event: React.PointerEvent<HTMLElement>) {
    if (reduceMotion || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - rect.left) / rect.width);
    y.set((event.clientY - rect.top) / rect.height);
  }

  function onPointerLeave() {
    x.set(0.5);
    y.set(0.5);
  }

  return { x: springX, y: springY, handlers: { onPointerMove, onPointerLeave } };
}

// Jauge du gain : un anneau couché en perspective, tissé comme une toile, qui
// se remplit avec le curseur et se penche vers la souris. Décorative : la
// valeur est déjà donnée par le curseur et le pourcentage affiché à côté.
function GainGauge({
  fraction,
  pointerX,
  pointerY,
}: {
  fraction: number; // part de l'anneau remplie, de 0 à 1
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
}) {
  const fill = useSpringTo(fraction);
  const beadAngle = useTransform(fill, (value) => value * 360);
  // Souris en haut : l'anneau se couche ; à droite : il penche à droite.
  const rotateX = useTransform(pointerY, [0, 1], [66, 46]);
  const rotate = useTransform(pointerX, [0, 1], [-12, 12]);

  return (
    <div
      aria-hidden="true"
      className="relative mx-auto mt-6 h-24 w-32 shrink-0 [perspective:520px] sm:mt-0"
    >
      {/* Les calques sont étagés en profondeur (translateZ) : c'est leur
          décalage, quand l'anneau s'incline, qui donne le relief. */}
      <motion.div
        style={{ rotate, rotateX, transformStyle: "preserve-3d" }}
        className="absolute left-1/2 top-1/2 -ml-14 -mt-14 h-28 w-28"
      >
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(closest-side,rgb(45_212_191/0.32),transparent)] [transform:translateZ(-18px)_scale(1.3)]" />

        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          <g fill="none" stroke="rgb(153 246 228 / 0.22)" strokeWidth="0.6">
            {gaugeSpokes.map((spoke) => (
              <line key={spoke.id} x1="50" y1="50" x2={spoke.x} y2={spoke.y} />
            ))}
            <circle cx="50" cy="50" r="13" />
            <circle cx="50" cy="50" r="26" />
          </g>
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="rgb(255 255 255 / 0.1)"
            strokeWidth="6"
          />
        </svg>

        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full [transform:translateZ(14px)]"
        >
          <defs>
            <linearGradient id="calc-gauge-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#34d399" />
              <stop offset="1" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          {/* Le remplissage part du haut de l'anneau, comme une horloge. */}
          <g transform="rotate(-90 50 50)">
            <motion.circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="url(#calc-gauge-gradient)"
              strokeWidth="6"
              strokeLinecap="round"
              style={{ pathLength: fill }}
            />
          </g>
        </svg>

        {/* Perle au bout du fil : elle tourne avec le remplissage. */}
        <motion.div style={{ z: 14, rotate: beadAngle }} className="absolute inset-0">
          <span className="absolute left-1/2 top-1 -ml-[5px] h-2.5 w-2.5 rounded-full bg-cyan-100 shadow-[0_0_10px_3px_rgb(34_211_238/0.8)]" />
        </motion.div>

        <div className="absolute inset-[34%] rounded-full border border-cyan-200/50 bg-teal-300/10 [transform:translateZ(30px)]" />
      </motion.div>
    </div>
  );
}

// Rayons de la toile dessinée dans la jauge (coordonnées arrondies : le rendu
// serveur et le rendu navigateur doivent produire exactement le même texte).
const gaugeSpokes = Array.from({ length: 8 }, (_, index) => {
  const angle = (index / 8) * Math.PI * 2;
  return {
    id: index,
    x: Math.round((50 + Math.cos(angle) * 42) * 100) / 100,
    y: Math.round((50 + Math.sin(angle) * 42) * 100) / 100,
  };
});

// Tour de blocs translucides : un bloc par tâche, dont la hauteur suit la part
// de cette tâche dans le temps gagné. Dimensions en pixels.
const TOWER = { width: 44, height: 88, depth: 44 };
// Une teinte par tâche (émeraude, teal, cyan), reprise au-delà de trois tâches.
const towerColors = ["52 211 153", "45 212 191", "34 211 238"];

function towerColor(index: number) {
  return towerColors[index % towerColors.length];
}

// Un bloc = trois faces visibles (avant, côté droit, dessus). Seules des
// transformations sont animées : aucune mise en page n'est recalculée.
function TowerBlock({
  share,
  offset,
  color,
}: {
  share: number; // hauteur du bloc, en part de la tour (0 à 1)
  offset: number; // part de la tour située sous le bloc
  color: string;
}) {
  const size = useSpringTo(share);
  const base = useSpringTo(offset);
  const lift = useTransform(base, (value) => -value * TOWER.height);
  const capLift = useTransform(
    [base, size],
    ([bottom, height]: number[]) => -(bottom + height) * TOWER.height
  );
  // Un bloc vide ne laisse pas son couvercle flotter dans la tour.
  const capOpacity = useTransform(size, [0, 0.02], [0, 1]);

  return (
    <>
      <motion.div
        style={{
          y: lift,
          z: TOWER.depth / 2,
          scaleY: size,
          originY: 1,
          borderColor: `rgb(${color} / 0.7)`,
          backgroundImage: `linear-gradient(to top, rgb(${color} / 0.5), rgb(${color} / 0.26))`,
        }}
        className="absolute inset-0 border-x"
      />
      <motion.div
        style={{
          y: lift,
          scaleY: size,
          rotateY: 90,
          originY: 1,
          left: TOWER.width - TOWER.depth / 2,
          width: TOWER.depth,
          borderColor: `rgb(${color} / 0.5)`,
          backgroundColor: `rgb(${color} / 0.2)`,
        }}
        className="absolute inset-y-0 border-x"
      />
      <motion.div
        style={{
          y: capLift,
          rotateX: 90,
          opacity: capOpacity,
          top: TOWER.height - TOWER.depth / 2,
          height: TOWER.depth,
          borderColor: `rgb(${color} / 0.8)`,
          backgroundColor: `rgb(${color} / 0.5)`,
        }}
        className="absolute inset-x-0 border"
      />
    </>
  );
}

function TaskTower({
  shares,
  pointerX,
  pointerY,
}: {
  shares: number[]; // part de chaque tâche, dans l'ordre du tableau "tasks"
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
}) {
  // La tour pivote vers la souris, en montrant toujours trois de ses faces.
  const rotateY = useTransform(pointerX, [0, 1], [-52, -20]);
  const rotateX = useTransform(pointerY, [0, 1], [-28, -14]);

  return (
    <div
      aria-hidden="true"
      className="relative h-32 w-28 shrink-0 [perspective:700px]"
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          width: TOWER.width,
          height: TOWER.height,
          marginLeft: -TOWER.width / 2,
          marginTop: -TOWER.height / 2,
        }}
        className="absolute left-1/2 top-1/2"
      >
        {/* Socle lumineux, posé à plat sous la tour. */}
        <div
          style={{
            top: TOWER.height - TOWER.depth / 2 - 10,
            height: TOWER.depth + 20,
          }}
          className="absolute -inset-x-2.5 rounded-md border border-teal-300/25 bg-[radial-gradient(closest-side,rgb(45_212_191/0.35),transparent)] [transform:rotateX(90deg)]"
        />
        {/* Gabarit de la tour pleine : visible quand aucun temps n'est saisi. */}
        <div
          style={{ transform: `translateZ(${TOWER.depth / 2}px)` }}
          className="absolute inset-0 border border-white/10"
        />
        <div
          style={{
            left: TOWER.width - TOWER.depth / 2,
            width: TOWER.depth,
          }}
          className="absolute inset-y-0 border border-white/10 [transform:rotateY(90deg)]"
        />

        {/* La première tâche est en haut de la tour, comme dans la légende. */}
        {shares.map((share, index) => (
          <TowerBlock
            key={tasks[index].id}
            share={share}
            offset={shares
              .slice(index + 1)
              .reduce((total, value) => total + value, 0)}
            color={towerColor(index)}
          />
        ))}
      </motion.div>
    </div>
  );
}

export default function TimeCalculator() {
  const [values, setValues] = useState<Values>(initialValues);
  const [gainPercent, setGainPercent] = useState(gain.initial);
  const formTilt = usePointerTilt();
  const resultTilt = usePointerTilt();

  function update(id: string, field: Field, value: string) {
    setValues((current) => ({
      ...current,
      [id]: { ...current[id], [field]: value },
    }));
  }

  const minutesPerWeek = tasks.reduce(
    (total, task) =>
      total +
      toNumber(values[task.id].count) *
        toNumber(values[task.id].minutes) *
        (gainPercent / 100),
    0
  );
  const hoursPerMonth = round1((minutesPerWeek * WEEKS_PER_MONTH) / 60);
  const hoursPerYear = round1((minutesPerWeek * WEEKS_PER_YEAR) / 60);
  const daysPerYear = Math.round(
    (minutesPerWeek * WEEKS_PER_YEAR) / 60 / HOURS_PER_WORKDAY
  );

  // Part de chaque tâche dans le temps gagné (le gain, commun à toutes, se
  // simplifie). Sert uniquement à la tour 3D et à sa légende.
  const taskMinutes = tasks.map(
    (task) => toNumber(values[task.id].count) * toNumber(values[task.id].minutes)
  );
  const totalMinutes = taskMinutes.reduce((total, value) => total + value, 0);
  const shares = taskMinutes.map((value) =>
    totalMinutes > 0 ? value / totalMinutes : 0
  );

  return (
    <section id="calculateur" className="scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          index="02"
          title="Calculez le temps que vous pouvez gagner avec l'IA"
          subtitle="Indiquez vos tâches répétitives de la semaine : le résultat se met à jour tout seul."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <Reveal variant="left" className="min-w-0">
            <form
              className={cardClass}
              onSubmit={(event) => event.preventDefault()}
              {...formTilt.handlers}
            >
              {tasks.map((task) => (
                <fieldset
                  key={task.id}
                  className="mb-6 border-b border-white/10 pb-6"
                >
                  <legend className="font-display text-base font-semibold text-zinc-50">
                    {task.label}
                  </legend>
                  <div className="mt-3 grid grid-cols-2 items-end gap-4">
                    {(
                      [
                        ["count", "Nombre par semaine"],
                        ["minutes", "Minutes par tâche"],
                      ] as const
                    ).map(([field, label]) => (
                      <div key={field}>
                        <label
                          htmlFor={`calc-${task.id}-${field}`}
                          className={labelClass}
                        >
                          {label}
                        </label>
                        <input
                          id={`calc-${task.id}-${field}`}
                          type="number"
                          inputMode="decimal"
                          min={0}
                          max={MAX_VALUE}
                          value={values[task.id][field]}
                          onChange={(event) =>
                            update(task.id, field, event.target.value)
                          }
                          onBlur={(event) =>
                            update(
                              task.id,
                              field,
                              String(toNumber(event.target.value))
                            )
                          }
                          className={fieldClass}
                        />
                      </div>
                    ))}
                  </div>
                </fieldset>
              ))}

              {/* Curseur et jauge côte à côte ; empilés sur petit écran. */}
              <div className="sm:flex sm:items-center sm:gap-8">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-4">
                    <label
                      htmlFor="calc-gain"
                      className="font-display text-base font-semibold text-zinc-50"
                    >
                      Temps économisé grâce à l&apos;IA
                    </label>
                    <span className="font-mono text-lg font-semibold text-emerald-300">
                      {gainPercent}&nbsp;%
                    </span>
                  </div>
                  <input
                    id="calc-gain"
                    type="range"
                    min={gain.min}
                    max={gain.max}
                    step={gain.step}
                    value={gainPercent}
                    onChange={(event) =>
                      setGainPercent(Number(event.target.value))
                    }
                    aria-valuetext={`${gainPercent} %`}
                    className="mt-4 h-11 w-full cursor-pointer accent-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
                  />
                  <div
                    aria-hidden="true"
                    className="flex justify-between font-mono text-xs text-zinc-400"
                  >
                    <span>{gain.min}&nbsp;%</span>
                    <span>{gain.max}&nbsp;%</span>
                  </div>
                </div>

                <GainGauge
                  fraction={gainPercent / 100}
                  pointerX={formTilt.x}
                  pointerY={formTilt.y}
                />
              </div>
            </form>
          </Reveal>

          {/* La carte reste collée (lg:sticky) à l'intérieur de ce bloc, que la
              grille étire à la hauteur de la colonne du formulaire. La carte
              elle-même ne porte aucune transformation ; celle du Reveal, sur
              son parent, ne gêne pas "sticky" (seul un overflow le ferait). */}
          <Reveal variant="right" delay={0.1} className="min-w-0">
            <div
              className={`${cardClass} lg:sticky lg:top-24`}
              {...resultTilt.handlers}
            >
              <p className="font-mono text-xs uppercase tracking-widest text-teal-300">
                Temps récupéré
              </p>

              {/* Les nombres animés sont masqués aux lecteurs d'écran : seule
                  la valeur finale est annoncée (voir AnimatedNumber). */}
              <div aria-live="polite" aria-atomic="true">
                <p className="mt-6">
                  <AnimatedNumber
                    value={hoursPerMonth}
                    format={hoursFormat}
                    className="text-gradient block break-words font-display text-5xl font-bold sm:text-6xl"
                  />
                  <span className="mt-1 block text-lg text-zinc-200">
                    {plural(hoursPerMonth, "heure")} par mois
                  </span>
                </p>
                <p className="mt-6 border-t border-white/10 pt-6">
                  <AnimatedNumber
                    value={hoursPerYear}
                    format={hoursFormat}
                    className="text-gradient block break-words font-display text-5xl font-bold sm:text-6xl"
                  />
                  <span className="mt-1 block text-lg text-zinc-200">
                    {plural(hoursPerYear, "heure")} par an
                  </span>
                </p>
                <p className="mt-6 leading-relaxed text-zinc-300">
                  Soit environ{" "}
                  <strong className="font-semibold text-zinc-50">
                    <AnimatedNumber value={daysPerYear} format={daysFormat} />{" "}
                    {plural(daysPerYear, "jour")} de travail
                  </strong>{" "}
                  {daysPerYear >= 2 ? "récupérés" : "récupéré"} par
                  an.
                </p>
              </div>

              <p className="mt-3 text-sm text-zinc-400">
                Estimation indicative, basée sur les hypothèses ci-dessus.
              </p>

              {/* Répartition du temps gagné : la tour est décorative, la
                  légende donne les mêmes parts en texte. */}
              <div className="mt-6 border-t border-white/10 pt-6">
                <p className="font-mono text-xs uppercase tracking-widest text-teal-300">
                  Répartition par tâche
                </p>
                <div className="mt-3 flex flex-col items-center gap-3 sm:flex-row sm:gap-5">
                  <TaskTower
                    shares={shares}
                    pointerX={resultTilt.x}
                    pointerY={resultTilt.y}
                  />
                  <ul className="w-full min-w-0 flex-1 space-y-2">
                    {tasks.map((task, index) => (
                      <li
                        key={task.id}
                        className="flex items-baseline gap-2.5 text-sm text-zinc-300"
                      >
                        <span
                          aria-hidden="true"
                          style={{ backgroundColor: `rgb(${towerColor(index)})` }}
                          className="mt-1.5 h-2 w-2 shrink-0 self-start rounded-full"
                        />
                        <span className="min-w-0 flex-1">{task.label}</span>
                        <span className="font-mono tabular-nums text-zinc-100">
                          {Math.round(shares[index] * 100)}&nbsp;%
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* L'aimant porte la marge et la largeur : le lien le remplit. */}
              <Magnetic className="mt-8 w-full align-top sm:w-auto">
                <a
                  href="#contact"
                  className="btn-gradient inline-flex min-h-11 w-full items-center justify-center rounded-xl px-6 py-3.5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 sm:w-auto"
                >
                  <span className="relative z-10">
                    Discuter de mon projet <span aria-hidden="true">→</span>
                  </span>
                </a>
              </Magnetic>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
