"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import Magnetic from "@/components/ui/Magnetic";

// Les liens commencent par "/" pour fonctionner aussi depuis les pages légales.
const links = [
  { href: "/#accueil", label: "Accueil" },
  { href: "/#services", label: "Services" },
  { href: "/#methode", label: "Méthode" },
  { href: "/#apropos", label: "À propos" },
  { href: "/#contact", label: "Contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [section, setSection] = useState<string | null>(null);
  // Lien survolé à la souris, ou atteint au clavier.
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);

  // Section en cours de lecture : celle qui traverse une ligne placée à 40 %
  // de la hauteur de l'écran. Entre deux sections, on garde la dernière.
  useEffect(() => {
    const sections = links
      .map((link) => document.getElementById(link.href.slice(2)))
      .filter((element) => element !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setSection(`/#${entry.target.id}`);
        }
      },
      { rootMargin: "-40% 0px -60% 0px" }
    );
    sections.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [pathname]);

  // Les pages légales n'ont pas ces sections : aucun lien n'y est « courant ».
  const current = pathname === "/" ? section : null;
  const highlighted = hovered ?? focused ?? current;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#040b0c]/60 backdrop-blur-xl backdrop-saturate-150">
      <nav
        aria-label="Navigation principale"
        className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 sm:px-6"
      >
        <Link
          href="/#accueil"
          onClick={() => setOpen(false)}
          className="inline-flex min-h-11 items-center font-display text-lg font-semibold tracking-tight text-zinc-100"
        >
          ANANSI<span className="text-gradient">.</span>
        </Link>

        {/* layoutRoot : l'en-tête reste collé en haut de l'écran, le défilement
            de la page ne doit pas fausser le glissement du halo. */}
        <motion.ul
          layoutRoot
          onPointerLeave={() => setHovered(null)}
          className="hidden items-center gap-1 md:flex"
        >
          {links.map((link) => {
            const isCurrent = current === link.href;

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isCurrent ? "location" : undefined}
                  onPointerEnter={(event) => {
                    if (event.pointerType === "mouse") setHovered(link.href);
                  }}
                  onFocus={(event) => {
                    // Focus clavier uniquement : après un clic, le halo ne doit
                    // pas rester accroché au lien cliqué.
                    if (event.currentTarget.matches(":focus-visible"))
                      setFocused(link.href);
                  }}
                  onBlur={() => setFocused(null)}
                  className={`relative inline-flex min-h-11 items-center rounded-full px-3 text-sm transition-colors duration-300 hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${
                    isCurrent ? "text-zinc-50" : "text-zinc-400"
                  }`}
                >
                  {/* Halo unique partagé par tous les liens (layoutId) : il
                      glisse vers le lien survolé, sinon vers la section lue. */}
                  {highlighted === link.href && (
                    <motion.span
                      layoutId="nav-highlight"
                      aria-hidden="true"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      className="absolute inset-x-0 inset-y-1.5 rounded-full border border-white/10 bg-white/[0.07]"
                    />
                  )}
                  <span className="relative">{link.label}</span>
                  {isCurrent && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-3 bottom-2.5 h-px bg-gradient-to-r from-teal-400 to-cyan-400"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </motion.ul>

        {/* Le conteneur porte le "hidden" : Magnetic impose son propre display. */}
        <div className="hidden lg:block">
          <Magnetic strength={0.25}>
            <Link
              href="/#contact"
              className="inline-flex min-h-11 items-center gap-2.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 text-sm font-medium text-emerald-200 transition-colors duration-300 hover:border-emerald-400/50 hover:text-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
            >
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-emerald-400" />
              Réponse sous 24h
            </Link>
          </Magnetic>
        </div>

        <button
          type="button"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          aria-controls="menu-mobile"
          onClick={() => setOpen((value) => !value)}
          className="rounded-lg border border-white/10 bg-white/5 p-2.5 text-zinc-200 transition-colors hover:bg-white/10 md:hidden"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            {open ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {open && (
        <motion.ul
          id="menu-mobile"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="border-t border-white/10 px-4 py-3 md:hidden"
        >
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={current === link.href ? "location" : undefined}
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-3 py-3 text-sm transition-colors hover:bg-white/10 hover:text-zinc-50 ${
                  current === link.href
                    ? "bg-white/[0.07] text-zinc-50"
                    : "text-zinc-300"
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li className="mt-2 border-t border-white/10 pt-3">
            <Link
              href="/#contact"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-3 text-sm font-medium text-emerald-200 transition-colors hover:bg-white/10"
            >
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-emerald-400" />
              Réponse sous 24h
            </Link>
          </li>
        </motion.ul>
      )}

      {/* La progression de lecture est portée par le fil de soie fixé en haut
          de l'écran (components/ui/ScrollThread.tsx, monté dans le layout). */}
    </header>
  );
}
