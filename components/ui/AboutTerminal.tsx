"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useTransform } from "framer-motion";
import { useTilt } from "@/components/ui/TiltCard";

type Command = { cmd: string; output: string[] };
type Entry = Command & { id: number };

const commands: Command[] = [
  {
    cmd: "whoami",
    output: [
      "ANANSI",
      "Micro-entreprise : développement web, cybersécurité, IA",
    ],
  },
  {
    cmd: "ls services/",
    output: ["developpement  pentest  ia  audit", "maintenance  formation  seo"],
  },
  {
    cmd: "cat methode.txt",
    output: [
      "1. Échange      on écoute votre besoin, gratuitement",
      "2. Réalisation  avec des points d'étape réguliers",
      "3. Suivi        livraison, formation, accompagnement",
    ],
  },
  {
    cmd: "cat fondateurs.txt",
    output: ["Romuald Mbe Signe", "Marc Sylvinho Tsafack"],
  },
  {
    cmd: "cat contact.txt",
    output: ["Réponse sous 24h"],
  },
];

// Épaisseur de la dalle : des copies du cadre empilées vers l'arrière, tous
// les 3 px. Vues de biais, leurs bords forment la tranche du verre.
const SLAB_SLICES = [1, 2, 3, 4, 5, 6, 7, 8];

// Le texte est posé sur un plan plus proche du lecteur que le cadre.
const textPlane = "[transform:translateZ(18px)]";

// Terminal interactif : chaque bouton « exécute » une commande et ajoute sa
// sortie à l'historique, comme dans un vrai shell. C'est aussi un objet 3D :
// une dalle de verre qui pivote vers le pointeur (ou avec le défilement sur
// téléphone).
export default function AboutTerminal() {
  const [history, setHistory] = useState<Entry[]>([{ id: 0, ...commands[0] }]);
  const logRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);
  const tilt = useTilt<HTMLDivElement>();

  // Pose de repos légèrement de biais, pour que la tranche se voie sans survol.
  const rotateY = useTransform(tilt.x, [0, 1], [-16, -2]);
  const rotateX = useTransform(tilt.y, [0, 1], [10, 0]);
  // Le reflet traverse la vitre quand l'angle change.
  const sheenX = useTransform(
    [tilt.x, tilt.y],
    ([x, y]: number[]) => `${(x + y - 1) * 40}%`
  );

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [history]);

  function run(command: Command) {
    const id = nextId.current++;
    setHistory((entries) => [...entries, { id, ...command }]);
  }

  return (
    <div
      ref={tilt.ref}
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
      className="[perspective:1100px]"
    >
      {/* Pas d'overflow-hidden ici : il aplatirait les plans en 3D. */}
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative"
      >
        {SLAB_SLICES.map((slice) => (
          <div
            key={slice}
            aria-hidden="true"
            style={{ transform: `translateZ(${-slice * 3}px)` }}
            className={`absolute inset-0 rounded-2xl border border-teal-300/25 bg-[#0a2224] ${
              slice === SLAB_SLICES.length
                ? "shadow-[0_30px_60px_-30px_rgb(0_0_0/0.9)]"
                : ""
            }`}
          />
        ))}
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-2xl border border-white/10 bg-[#071214]/90 shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]"
        />
        {/* Reflet : juste au-dessus du cadre, donc derrière le texte. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl [transform:translateZ(1px)]"
        >
          <motion.div
            style={{ x: sheenX }}
            className="absolute inset-y-0 -inset-x-1/2 bg-[linear-gradient(115deg,transparent_42%,rgb(255_255_255/0.07)_50%,transparent_58%)]"
          />
        </div>

        <div className="relative [transform-style:preserve-3d]">
          <div className="flex items-center justify-between border-b border-white/10 pl-4 pr-2 font-mono text-xs text-zinc-400 [transform-style:preserve-3d]">
            <span className={textPlane}>anansi@studio: ~</span>
            {/* min-h-11 / min-w-11 : cible tactile d'environ 44 px. */}
            <button
              type="button"
              onClick={() => setHistory([])}
              className={`min-h-11 min-w-11 rounded px-2 text-zinc-400 transition-colors hover:text-zinc-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-400 ${textPlane}`}
            >
              clear
            </button>
          </div>

          <div
            ref={logRef}
            role="log"
            aria-live="polite"
            aria-label="Sortie du terminal"
            tabIndex={0}
            className={`h-64 overflow-y-auto px-4 py-4 font-mono text-[13px] leading-relaxed focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-400 ${textPlane}`}
          >
            {history.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="mb-3"
              >
                <p className="text-zinc-100">
                  <span className="text-teal-300">~$</span> {entry.cmd}
                </p>
                {entry.output.map((line) => (
                  <p key={line} className="whitespace-pre-wrap text-zinc-400">
                    {line}
                  </p>
                ))}
              </motion.div>
            ))}
            <p className="text-zinc-100">
              <span className="text-teal-300">~$</span>{" "}
              <span
                aria-hidden="true"
                className="inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-teal-300"
              />
            </p>
          </div>

          <div className="border-t border-white/10 [transform-style:preserve-3d]">
            <div className={`px-4 py-4 ${textPlane}`}>
              <p className="text-xs text-zinc-400">Lancez une commande :</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {commands.map((command) => (
                  <li key={command.cmd}>
                    {/* min-h-11 : cible tactile d'environ 44 px. */}
                    <button
                      type="button"
                      onClick={() => run(command)}
                      className="min-h-11 rounded-md border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-zinc-300 transition-colors duration-300 hover:border-teal-400/50 hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
                    >
                      {command.cmd}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
