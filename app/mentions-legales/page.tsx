import type { Metadata } from "next";

// TODO : ce texte est un modèle à compléter, pas un conseil juridique.
// Remplacer chaque placeholder entre [crochets], puis faire relire la page
// par une personne compétente (juriste, expert-comptable...) avant la mise en ligne.

export const metadata: Metadata = {
  title: "Mentions légales | ANANSI",
};

export default function MentionsLegales() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-gradient sm:text-4xl">
        Mentions légales
      </h1>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-zinc-50">Éditeur du site</h2>
        <dl className="mt-4 space-y-2 leading-relaxed text-zinc-400">
          <div>
            <dt className="inline font-medium text-zinc-100">
              Raison sociale :{" "}
            </dt>
            <dd className="inline">[Raison sociale]</dd>
          </div>
          <div>
            <dt className="inline font-medium text-zinc-100">Dirigeant : </dt>
            <dd className="inline">[Prénom et nom du dirigeant]</dd>
          </div>
          <div>
            <dt className="inline font-medium text-zinc-100">SIRET : </dt>
            <dd className="inline">[Numéro SIRET]</dd>
          </div>
          <div>
            <dt className="inline font-medium text-zinc-100">Adresse : </dt>
            <dd className="inline">[Adresse postale complète]</dd>
          </div>
          <div>
            <dt className="inline font-medium text-zinc-100">Email : </dt>
            <dd className="inline">[Email de contact]</dd>
          </div>
        </dl>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-zinc-50">Hébergeur</h2>
        <p className="mt-4 leading-relaxed text-zinc-400">
          Ce site est hébergé par Cloudflare Pages, un service de Cloudflare,
          Inc. : [Adresse de l&apos;hébergeur], [Site web ou contact de
          l&apos;hébergeur].
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-zinc-50">Propriété intellectuelle</h2>
        <p className="mt-4 leading-relaxed text-zinc-400">
          L&apos;ensemble des contenus de ce site (textes, images, logo, code)
          appartient à [Raison sociale], sauf mention contraire. Toute
          reproduction ou réutilisation, même partielle, nécessite
          l&apos;accord écrit préalable de [Raison sociale].
        </p>
      </section>
    </main>
  );
}
