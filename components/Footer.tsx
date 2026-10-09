import Link from "next/link";
import Magnetic from "@/components/ui/Magnetic";

const navigation = [
  { href: "/#accueil", label: "Accueil" },
  { href: "/#services", label: "Services" },
  { href: "/#calculateur", label: "Calculateur" },
  { href: "/#methode", label: "Méthode" },
  { href: "/#apropos", label: "À propos" },
  { href: "/#contact", label: "Contact" },
];

const legal = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/confidentialite", label: "Confidentialité" },
];

const linkClass =
  "inline-flex min-h-9 items-center text-sm text-zinc-400 transition-colors duration-300 hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 px-4 pb-8 pt-14 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-display text-xl font-semibold text-zinc-50">
              ANANSI<span className="text-gradient">.</span>
            </p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-400">
              Développement web, cybersécurité et intelligence artificielle,
              pour les TPE et les PME.
            </p>
            {/* Même aimant que l'appel à l'action de l'en-tête. */}
            <Magnetic strength={0.25} className="mt-5 align-top">
              <Link
                href="/#contact"
                className="inline-flex min-h-11 items-center gap-2.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-1.5 text-sm font-medium text-emerald-200 transition-colors duration-300 hover:border-emerald-400/50 hover:text-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
              >
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-emerald-400" />
                Réponse sous 24h · Devis gratuit
              </Link>
            </Magnetic>
          </div>

          <nav aria-label="Pied de page">
            <p className="text-sm font-medium text-zinc-100">Navigation</p>
            <ul className="mt-3">
              {navigation.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Liens légaux">
            <p className="text-sm font-medium text-zinc-100">
              Informations légales
            </p>
            <ul className="mt-3">
              {legal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-white/10 pt-6 text-sm text-zinc-500">
          <p>© 2026 ANANSI</p>
          <Link href="/#accueil" className={linkClass}>
            Retour en haut
            <span aria-hidden="true" className="ml-2">
              ↑
            </span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
