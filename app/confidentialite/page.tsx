import type { Metadata } from "next";

// TODO : ce texte est un modèle à compléter, pas un conseil juridique.
// Remplacer chaque placeholder entre [crochets], vérifier que la page décrit
// bien ce que fait réellement le site, puis la faire relire par une personne
// compétente (juriste, DPO...) avant la mise en ligne.

export const metadata: Metadata = {
  title: "Politique de confidentialité | ANANSI",
};

export default function Confidentialite() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-gradient sm:text-4xl">
        Politique de confidentialité
      </h1>
      <p className="mt-4 text-sm text-zinc-400">
        Dernière mise à jour : [Date]
      </p>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-zinc-50">Données collectées</h2>
        <p className="mt-4 leading-relaxed text-zinc-400">
          Lorsque vous utilisez le formulaire de contact, nous collectons les
          informations que vous y saisissez :
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-6 leading-relaxed text-zinc-400">
          <li>votre nom ;</li>
          <li>votre adresse email ;</li>
          <li>votre numéro de téléphone, si vous choisissez de l&apos;indiquer ;</li>
          <li>le type de besoin sélectionné ;</li>
          <li>votre message.</li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-zinc-50">Finalité</h2>
        <p className="mt-4 leading-relaxed text-zinc-400">
          Ces données sont utilisées uniquement pour répondre à votre demande
          et vous recontacter à son sujet.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-zinc-50">Durée de conservation</h2>
        <p className="mt-4 leading-relaxed text-zinc-400">
          Vos données sont conservées 3 ans maximum après notre dernier
          contact, puis supprimées.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-zinc-50">Vos droits</h2>
        <p className="mt-4 leading-relaxed text-zinc-400">
          Conformément au RGPD, vous pouvez demander l&apos;accès à vos
          données, leur rectification ou leur suppression. Pour exercer ces
          droits, écrivez-nous à [Email de contact].
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-zinc-50">Sous-traitants</h2>
        <p className="mt-4 leading-relaxed text-zinc-400">
          Nous faisons appel aux prestataires suivants :
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-6 leading-relaxed text-zinc-400">
          <li>
            Web3Forms, qui transmet le contenu du formulaire de contact à
            notre boîte email ;
          </li>
          <li>Cloudflare, qui héberge ce site (Cloudflare Pages).</li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-zinc-50">Responsable du traitement</h2>
        <p className="mt-4 leading-relaxed text-zinc-400">
          [Raison sociale], [Adresse postale complète], [Email de contact].
        </p>
      </section>
    </main>
  );
}
