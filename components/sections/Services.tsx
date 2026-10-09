"use client";

import {
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import {
  Bot,
  Code,
  ShieldAlert,
  ShieldCheck,
  X,
  type LucideIcon,
} from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import TiltCard, { TiltLayer } from "@/components/ui/TiltCard";

// Une partie du déroulé : soit des étapes numérotées (steps), soit une
// simple phrase (text). "title" sert quand un service a plusieurs déroulés.
type Stage = {
  title?: string;
  steps?: string[];
  text?: string;
};

type Service = {
  title: string;
  description: string; // phrase courte affichée sur la carte
  icon: LucideIcon;
  concretely: string;
  stages: Stage[];
  deliverables: string[];
  delays: string[];
  // Dernier bloc de la fiche, facultatif (ex. "Ce dont nous avons besoin").
  extra?: { title: string; items: string[] };
};

// Pour ajouter un service : ajouter un bloc à ce tableau.
// TODO : les délais sont des estimations, à valider avant la mise en ligne.
const services: Service[] = [
  {
    title: "Développement",
    description: "Applications web, plateformes et sites sur mesure.",
    icon: Code,
    concretely:
      "Nous créons votre site ou votre application, nous le mettons en ligne sur votre domaine et nous vous laissons la main.",
    stages: [
      {
        steps: [
          "Un échange d'une heure pour comprendre votre besoin : objectif, cible, pages, budget.",
          "Une maquette ou une page d'accueil, que vous validez.",
          "Le développement des pages, puis le formulaire de contact et le SEO de base.",
          "Votre relecture, puis la mise en ligne.",
        ],
      },
    ],
    deliverables: [
      "Le site en ligne",
      "L'accès à votre hébergement et à votre domaine",
      "Une formation de 30 minutes",
      "Un mode d'emploi simple",
    ],
    delays: [
      "Site vitrine : 2 à 3 semaines, avec vos textes et vos photos",
      "Application : 1 à 3 mois selon la complexité",
    ],
    extra: {
      title: "Ce dont nous avons besoin",
      items: [
        "Votre logo",
        "Vos textes et vos photos",
        "L'accès à votre ancien site ou à votre nom de domaine",
      ],
    },
  },
  {
    title: "Sécurité & Pentest",
    description: "Tests d'intrusion, audit OWASP, rapport professionnel.",
    icon: ShieldAlert,
    concretely:
      "Nous cherchons les failles de votre application ou de votre site, comme un attaquant le ferait, mais avec votre accord. Nous rédigeons ensuite un rapport pour vous permettre de corriger.",
    stages: [
      {
        steps: [
          "La signature d'un accord écrit, qui définit le périmètre (adresses, applications) et les dates.",
          "Une phase de collecte d'informations, puis des tests manuels selon l'OWASP Top 10.",
          "Un rapport : un résumé pour le dirigeant (3 pages environ), puis le détail de chaque faille (gravité, preuve, correction conseillée).",
          "Une réunion d'une heure pour vous expliquer les résultats.",
          "Un re-test après correction, en option.",
        ],
      },
    ],
    deliverables: [
      "Le rapport au format PDF",
      "La liste des failles, classées par gravité",
      "Les étapes pour les corriger",
    ],
    delays: [
      "Audit flash d'un site : 3 à 5 jours",
      "Pentest applicatif complet : 1 à 3 semaines",
    ],
    extra: {
      title: "Ce dont nous avons besoin",
      items: [
        "L'accord écrit signé",
        "Des identifiants de test, si l'application est derrière un compte",
        "Une fenêtre de tests validée",
      ],
    },
  },
  {
    title: "Intelligence Artificielle",
    description: "Agents autonomes, LLM, automatisation intelligente.",
    icon: Bot,
    concretely:
      "Nous mettons un modèle de langage (comme ceux d'Anthropic ou d'OpenAI) au service d'un besoin précis : répondre aux clients, trier des demandes, rédiger des devis, résumer des documents.",
    stages: [
      {
        steps: [
          "Un diagnostic de 2 heures : nous listons vos tâches répétitives et choisissons les 3 plus rentables.",
          "Un prototype sur une seule tâche, testé avec de vraies données.",
          "La mise en production, avec une règle claire : l'IA propose, un humain valide pour les actions sensibles.",
          "Une formation et un guide d'utilisation.",
        ],
      },
    ],
    deliverables: [
      "Un outil opérationnel : chatbot, automatisation ou assistant",
      "La documentation",
      "Une estimation du temps gagné par mois",
    ],
    delays: ["Diagnostic : 1 semaine", "Chatbot simple : 2 à 4 semaines"],
    extra: {
      title: "À savoir",
      items: [
        "Les coûts d'API restent à votre charge : souvent quelques dizaines d'euros par mois pour une PME.",
        "Aucune donnée personnelle ou confidentielle n'est envoyée sans avoir vérifié le contrat du fournisseur.",
      ],
    },
  },
  {
    title: "Renforcement & Audit",
    description: "Durcissement système, audit de code, mise en conformité.",
    icon: ShieldCheck,
    concretely:
      "Nous rendons un serveur ou un poste plus sûr, nous relisons le code d'une application, ou nous vous aidons à vous mettre en conformité avec le RGPD.",
    stages: [
      {
        title: "Durcissement",
        steps: [
          "Un état des lieux : quels services tournent, qui a accès, quelles mises à jour manquent.",
          "L'application des bonnes pratiques : comptes nominatifs, clés SSH au lieu des mots de passe, pare-feu, sauvegardes testées, journalisation.",
          "Un compte rendu, avec la liste des actions faites et de celles à faire.",
        ],
      },
      {
        title: "Audit de code",
        text: "Nous lisons votre dépôt de code, nous repérons les failles (injections, mots de passe en clair, dépendances obsolètes) et nous classons les problèmes par priorité.",
      },
      {
        title: "RGPD",
        text: "Nous établissons le registre des traitements, nous rédigeons la politique de confidentialité et nous listons les actions à mener.",
      },
    ],
    deliverables: ["Un rapport écrit", "Une liste d'actions priorisées"],
    delays: [
      "Durcissement d'un serveur : 2 à 3 jours",
      "Audit de code : 1 à 2 semaines",
      "RGPD : 2 à 4 semaines",
    ],
  },
];

type ExtraService = {
  title: string;
  description: string;
};

// Services complémentaires, affichés en plus petit sous la grille.
const extraServices: ExtraService[] = [
  {
    title: "Maintenance mensuelle",
    description:
      "Mises à jour, sauvegardes, surveillance du site et petites modifications, chaque mois.",
  },
  {
    title: "Formation cyber pour PME",
    description:
      "Une demi-journée sur le phishing, les mots de passe et les bons réflexes, avec des exemples réels d'emails frauduleux.",
  },
  {
    title: "SEO",
    description:
      "Mots-clés, balises, fiche Google Business Profile et suivi mensuel.",
  },
];

// Épaisseur du jeton d'icône : des faces empilées vers l'arrière, tous les 2 px.
const TOKEN_SLICES = [1, 2, 3, 4, 5, 6, 7];

// Rang d'un bloc de la fiche : il fixe son retard d'apparition (globals.css).
const stagger = (rank: number) => ({ "--i": rank }) as CSSProperties;

const blockTitleClass =
  "font-mono text-xs uppercase tracking-[0.2em] text-emerald-300/80";

const dotClass =
  "h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500";

// Icône en volume : une petite dalle arrondie dont on voit la tranche. Son
// orientation suit les variables --tilt-px / --tilt-py posées par TiltCard
// (classe token3d, globals.css) ; hors d'une carte, elle garde sa pose de repos.
function IconToken({
  icon: Icon,
  size,
  className,
}: {
  icon: LucideIcon;
  size: number;
  className: string;
}) {
  return (
    <span className={`token3d relative block shrink-0 ${className}`}>
      {TOKEN_SLICES.map((slice) => (
        <span
          key={slice}
          aria-hidden="true"
          style={{ transform: `translateZ(${-slice * 2}px)` }}
          className="absolute inset-0 rounded-xl border border-teal-300/30 bg-[#0d3134]"
        />
      ))}
      <span className="absolute inset-0 flex items-center justify-center rounded-xl border border-white/15 bg-gradient-to-br from-[#14403f] to-[#0a1f22] text-teal-200 shadow-[inset_0_1px_0_rgb(255_255_255/0.25)] [transform-style:preserve-3d]">
        <Icon
          size={size}
          aria-hidden="true"
          className="[transform:translateZ(6px)]"
        />
      </span>
    </span>
  );
}

function ServiceCard({
  service,
  onOpen,
}: {
  service: Service;
  onOpen: (service: Service) => void;
}) {
  return (
    <TiltCard className="flex flex-col p-6">
      {/* Trois hauteurs : le jeton flotte le plus haut, le titre à mi-hauteur,
          le texte reste posé sur la surface de la carte. */}
      <article className="flex h-full flex-col [transform-style:preserve-3d]">
        <div className="relative w-fit [transform-style:preserve-3d]">
          {/* Ombre du jeton sur la carte : elle glisse à l'opposé de la lumière. */}
          <span
            aria-hidden="true"
            className="token-shadow absolute inset-0 rounded-xl bg-black/60 blur-md"
          />
          <TiltLayer depth={44}>
            <IconToken icon={service.icon} size={24} className="h-12 w-12" />
          </TiltLayer>
        </div>
        <TiltLayer depth={20} className="mt-5">
          <h3 className="font-display text-lg font-semibold text-zinc-50">
            {service.title}
          </h3>
        </TiltLayer>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-400">
          {service.description}
        </p>

        {/* Délais repris tels quels : les raccourcir en changerait le sens. */}
        <ul
          aria-label="Délais indicatifs"
          className="mt-5 space-y-2 border-t border-white/10 pt-4 text-xs leading-relaxed text-zinc-300"
        >
          {service.delays.map((delay) => (
            <li key={delay} className="flex items-start gap-2">
              <span aria-hidden="true" className={`${dotClass} mt-1.5`} />
              {delay}
            </li>
          ))}
        </ul>

        <TiltLayer depth={12} className="mt-4 w-fit">
          <button
            type="button"
            onClick={() => onOpen(service)}
            aria-haspopup="dialog"
            aria-label={`Voir le détail : ${service.title}`}
            className="group/link inline-flex min-h-11 w-fit cursor-pointer items-center gap-2 text-sm font-medium text-teal-200 transition-colors duration-300 hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
          >
            Voir le détail
            <span
              aria-hidden="true"
              className="transition-transform duration-300 group-hover/link:translate-x-1"
            >
              →
            </span>
          </button>
        </TiltLayer>
      </article>
    </TiltCard>
  );
}

export default function Services() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<Service>(services[0]);

  function openDetails(service: Service) {
    setSelected(service);
    dialogRef.current?.showModal();
  }

  function closeDetails() {
    dialogRef.current?.close();
  }

  // Un clic en dehors de la fiche (sur le fond assombri) la referme.
  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    const dialog = dialogRef.current;
    if (!dialog || event.target !== dialog) return;
    // Le fond assombri appartient au <dialog> : on ne ferme que si le clic
    // tombe réellement en dehors du cadre de la fiche.
    const rect = dialog.getBoundingClientRect();
    const outside =
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom;
    if (outside) closeDetails();
  }

  return (
    <section id="services" className="scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          index="01"
          title="Nos services"
          subtitle="Ouvrez une carte pour voir le détail : déroulé, livrables et délais."
        />

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {services.map((service, index) => (
            <Reveal
              key={service.title}
              variant="flip"
              delay={(index % 2) * 0.1}
              className="h-full"
            >
              <ServiceCard service={service} onOpen={openDetails} />
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1} className="mt-14">
          <h3 className="font-display text-xl font-semibold text-zinc-50">
            Services complémentaires
          </h3>
          <ul className="mt-8 grid gap-8 sm:grid-cols-3">
            {extraServices.map((item) => (
              <li
                key={item.title}
                className="relative border-t border-white/10 pt-5"
              >
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-[-1px] h-px w-12 bg-gradient-to-r from-teal-400 to-cyan-500"
                />
                <h4 className="font-display text-base font-semibold text-zinc-50">
                  {item.title}
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {item.description}
                </p>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      {/* Fiche détail : <dialog> natif, Échap et piège de focus gérés par le navigateur. */}
      <dialog
        ref={dialogRef}
        onClick={handleBackdropClick}
        aria-labelledby="service-dialog-title"
        className="service-dialog m-auto max-h-[88vh] w-[min(calc(100%-2rem),46rem)] overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-[#071214] p-5 text-zinc-300 shadow-[0_40px_120px_-20px_rgb(0_0_0/0.9)] sm:p-8"
      >
        {/* En-tête collé en haut : le bouton Fermer reste visible en défilant. */}
        <div className="sticky top-0 z-10 -mx-5 -mt-5 flex items-start justify-between gap-4 bg-[#071214] px-5 pb-4 pt-5 sm:-mx-8 sm:-mt-8 sm:px-8 sm:pt-8">
          <div className="flex min-w-0 items-center gap-4">
            <IconToken icon={selected.icon} size={22} className="h-11 w-11" />
            <h3
              id="service-dialog-title"
              className="font-display text-xl font-bold tracking-tight text-zinc-50 sm:text-2xl"
            >
              {selected.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={closeDetails}
            aria-label="Fermer"
            className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 transition-colors duration-300 hover:border-emerald-400/60 hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Les blocs "dialog-item" arrivent l'un après l'autre, dans l'ordre de
            leur rang, à chaque ouverture de la fiche. */}
        <p
          style={stagger(0)}
          className="dialog-item mt-6 text-base leading-relaxed text-zinc-300"
        >
          {selected.concretely}
        </p>

        <h4 style={stagger(1)} className={`dialog-item mt-8 ${blockTitleClass}`}>
          Comment ça se passe
        </h4>
        {selected.stages.map((stage, stageIndex) => (
          <div
            key={stage.title ?? stageIndex}
            style={stagger(1 + stageIndex)}
            className="dialog-item mt-4"
          >
            {stage.title && (
              <h5 className="font-display text-base font-semibold text-zinc-50">
                {stage.title}
              </h5>
            )}
            {stage.steps && (
              <ol className="mt-3 space-y-3">
                {stage.steps.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-400/10 font-mono text-xs font-medium text-teal-200"
                    >
                      {index + 1}
                    </span>
                    <span className="text-sm leading-relaxed text-zinc-400">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            )}
            {stage.text && (
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {stage.text}
              </p>
            )}
          </div>
        ))}

        <div
          style={stagger(selected.stages.length + 1)}
          className="dialog-item mt-8 grid gap-8 border-t border-white/10 pt-6 sm:grid-cols-2"
        >
          <div>
            <h4 className={blockTitleClass}>Vous recevez</h4>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-400">
              {selected.deliverables.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span aria-hidden="true" className={`${dotClass} mt-2`} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className={blockTitleClass}>Délais indicatifs</h4>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-400">
              {selected.delays.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span aria-hidden="true" className={`${dotClass} mt-2`} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {selected.extra && (
          <div
            style={stagger(selected.stages.length + 2)}
            className="dialog-item mt-8 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-5"
          >
            <h4 className={blockTitleClass}>{selected.extra.title}</h4>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-400">
              {selected.extra.items.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span aria-hidden="true" className={`${dotClass} mt-2`} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Enveloppe à part : btn-gradient a déjà sa propre animation, que
            celle d'apparition remplacerait. */}
        <div
          style={stagger(selected.stages.length + 3)}
          className="dialog-item mt-8"
        >
          <a
            href="#contact"
            onClick={closeDetails}
            className="btn-gradient inline-flex min-h-11 items-center rounded-xl px-6 py-3.5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
          >
            <span className="relative z-10">
              Parler de ce projet <span aria-hidden="true">→</span>
            </span>
          </a>
        </div>
      </dialog>
    </section>
  );
}
