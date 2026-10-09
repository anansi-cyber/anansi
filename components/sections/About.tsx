import Image from "next/image";
import AboutTerminal from "@/components/ui/AboutTerminal";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import TiltCard, { TiltLayer } from "@/components/ui/TiltCard";

type Founder = {
  name: string;
  role: string;
  bio: string;
  photo: string;
  linkedin: string;
};

// TODO : remplacer les placeholders ci-dessous avant la mise en ligne.
//  - role     : le rôle réel de chacun (ex. "Développeur web", "Pentester")
//  - bio      : le parcours en une ou deux phrases (spécialité, formation,
//               projets réalisés, certifications), à la place du texte
//               entre [crochets]
//  - photo    : remplacer les fichiers public/images/fondateur-1.jpg et
//               fondateur-2.jpg par de vraies photos (carrées, 400 px minimum)
//  - linkedin : l'adresse complète du profil (https://www.linkedin.com/in/...)
const founders: Founder[] = [
  {
    name: "Romuald Mbe Signe",
    role: "Cofondateur",
    bio: "[Rôle ou spécialité : à compléter]",
    photo: "/images/fondateur-1.jpg",
    linkedin: "#",
  },
  {
    name: "Marc Sylvinho Tsafack",
    role: "Cofondateur",
    bio: "[Rôle ou spécialité : à compléter]",
    photo: "/images/fondateur-2.jpg",
    linkedin: "#",
  },
];

const workingPrinciples = [
  "Un échange clair au départ, pour bien comprendre votre besoin.",
  "Un devis détaillé, sans frais cachés.",
  "Des points d'étape réguliers pendant la réalisation.",
  "Un accompagnement après la livraison.",
];

export default function About() {
  return (
    <section id="apropos" className="scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading index="04" title="À propos" />

        <div className="mt-10 grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <Reveal delay={0.1}>
            <p className="font-display text-2xl font-semibold leading-snug text-zinc-50 md:text-3xl">
              ANANSI est une micro-entreprise fondée par Marc Sylvinho Tsafack
              et Romuald Mbe Signe. Nous accompagnons les entreprises, des TPE
              aux PME, de l&apos;idée à la mise en ligne.
            </p>
            <div className="mt-6 max-w-[62ch] space-y-4 text-base leading-relaxed text-zinc-300">
              <p>
                Chez ANANSI, nous réunissons trois métiers qui vont rarement
                ensemble : le développement web, la cybersécurité et
                l&apos;intelligence artificielle. Cette combinaison nous permet
                de créer des outils qui fonctionnent bien, et qui sont protégés
                dès le départ, plutôt que de corriger les failles après coup.
              </p>
            </div>
            <div className="mt-8 max-w-[62ch] border-t border-white/10 pt-6">
              <h3 className="font-display text-lg font-semibold text-zinc-50">
                Ce qui nous motive
              </h3>
              <p className="mt-3 text-base leading-relaxed text-zinc-300">
                Nous pensons que la sécurité ne doit pas être réservée aux
                grands groupes. Une petite entreprise a les mêmes risques
                qu&apos;une grande, avec moins de moyens pour y faire face.
                Notre rôle est de rendre ces protections accessibles, claires
                et compréhensibles.
              </p>
            </div>
          </Reveal>

          <Reveal variant="flip" delay={0.2} className="lg:sticky lg:top-24">
            <AboutTerminal />
          </Reveal>
        </div>

        <Reveal delay={0.1} className="mt-14">
          <h3 className="font-display text-lg font-semibold text-zinc-50">
            Notre façon de travailler
          </h3>
          <ul className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {workingPrinciples.map((principle) => (
              <li key={principle} className="relative border-t border-white/10 pt-5">
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-[-1px] h-px w-12 bg-gradient-to-r from-teal-400 to-cyan-500"
                />
                <p className="text-sm leading-relaxed text-zinc-300">
                  {principle}
                </p>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.1} className="mt-16">
          <h3 className="font-display text-lg font-semibold text-zinc-50">
            Nos parcours
          </h3>
        </Reveal>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {founders.map((founder, index) => (
            <Reveal key={founder.name} variant="flip" delay={0.1 + index * 0.1}>
              <TiltCard className="p-6 sm:p-8">
                {/* Le portrait flotte au-dessus de la carte, le nom à
                    mi-hauteur ; preserve-3d transmet la profondeur aux étages. */}
                <article className="flex h-full flex-col items-start gap-5 [transform-style:preserve-3d] sm:flex-row sm:items-center sm:gap-6">
                  <TiltLayer depth={36} className="shrink-0">
                    <Image
                      src={founder.photo}
                      alt={`Photo de ${founder.name}`}
                      width={400}
                      height={400}
                      className="h-24 w-24 rounded-full object-cover ring-2 ring-white/15 sm:h-28 sm:w-28"
                    />
                  </TiltLayer>
                  <div className="flex flex-col items-start [transform-style:preserve-3d]">
                    <TiltLayer depth={16}>
                      <h4 className="font-display text-lg font-semibold text-zinc-50">
                        {founder.name}
                      </h4>
                    </TiltLayer>
                    <p className="mt-1 font-mono text-xs uppercase tracking-wider text-emerald-300">
                      {founder.role}
                    </p>
                    {/* Le parcours et le lien LinkedIn ne s'affichent qu'une fois
                        renseignés : un placeholder ne doit pas être visible en ligne. */}
                    {!founder.bio.startsWith("[") && (
                      <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                        {founder.bio}
                      </p>
                    )}
                    {founder.linkedin.startsWith("http") && (
                      <a
                        href={founder.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Profil LinkedIn de ${founder.name}`}
                        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 text-sm font-semibold text-zinc-100 transition-colors duration-300 hover:border-emerald-400/60 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
                      >
                        <span aria-hidden="true">↗</span>
                        LinkedIn
                      </a>
                    )}
                  </div>
                </article>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
