"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { LifeBuoy, MessageCircle } from "lucide-react";
import Magnetic from "@/components/ui/Magnetic";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";

const WEB3FORMS_URL = "https://api.web3forms.com/submit";
const WEB3FORMS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_KEY ?? "";

// Pour ajouter un type de besoin : ajouter une ligne à ce tableau.
const needs = [
  "Développement",
  "Sécurité & Pentest",
  "IA",
  "Renforcement & Audit",
  "Autre",
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MESSAGE_MIN_LENGTH = 10;

type Status = "idle" | "sending" | "success" | "error";
type Errors = Partial<
  Record<"name" | "email" | "message" | "consent", string>
>;

// Pas de coordonnées directes pour l'instant : on décrit le déroulé d'un échange.
const steps = [
  {
    label: "Premier échange",
    value: "On écoute votre besoin, gratuitement.",
    icon: MessageCircle,
  },
  {
    label: "Suivi",
    value: "Un accompagnement après la livraison.",
    icon: LifeBuoy,
  },
];

// Profondeur au focus, en CSS seul : le champ actif se soulève légèrement et
// une lueur teal apparaît dessous. "translate" ne déplace pas ses voisins.
const fieldClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 transition-[translate,box-shadow,border-color,background-color] duration-300 focus:-translate-y-0.5 focus:border-teal-400/60 focus:bg-white/[0.07] focus:shadow-[0_16px_30px_-16px_rgb(45_212_191/0.6)] motion-reduce:focus:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400";
const labelClass = "block text-sm text-zinc-300";
const errorClass = "mt-1.5 text-sm text-red-300";

export default function Contact() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [need, setNeed] = useState(needs[0]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    // Honeypot : un humain ne voit pas ce champ, seul un robot le remplit.
    if (data.get("website")) return;

    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const consent = data.get("consent") === "on";

    const newErrors: Errors = {};
    if (!name) newErrors.name = "Merci d'indiquer votre nom.";
    if (!email) newErrors.email = "Merci d'indiquer votre email.";
    else if (!EMAIL_PATTERN.test(email))
      newErrors.email = "Cette adresse email ne semble pas valide.";
    if (message.length < MESSAGE_MIN_LENGTH)
      newErrors.message = `Votre message doit contenir au moins ${MESSAGE_MIN_LENGTH} caractères.`;
    if (!consent)
      newErrors.consent = "Merci de cocher cette case pour envoyer le formulaire.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setStatus("idle");
      return;
    }

    if (!WEB3FORMS_KEY) {
      setStatus("error");
      setErrorMessage(
        "Le formulaire n'est pas encore configuré (clé Web3Forms manquante)."
      );
      return;
    }

    setStatus("sending");
    try {
      const response = await fetch(WEB3FORMS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: `Nouveau message ANANSI : ${need}`,
          from_name: "Site ANANSI",
          name,
          email,
          phone,
          need,
          message,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error("Web3Forms a refusé l'envoi");
      }
      setStatus("success");
      form.reset();
      // Le type de besoin est piloté par React : on le remet aussi à zéro.
      setNeed(needs[0]);
    } catch {
      setStatus("error");
      setErrorMessage(
        "L'envoi a échoué. Merci de réessayer dans quelques instants."
      );
    }
  }

  return (
    <section id="contact" className="scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          index="04"
          title="Contact"
          subtitle="Un projet, un besoin de sécurité ou simplement une question ? Écrivez-nous."
        />

        <div className="mt-12 grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <Reveal delay={0.1} className="lg:sticky lg:top-28">
            <p className="font-display text-2xl font-semibold leading-snug text-zinc-50">
              Réponse sous 24h.
            </p>

            <ul className="mt-8">
              {steps.map((step) => (
                <li
                  key={step.label}
                  className="flex items-center gap-4 border-t border-white/10 py-4"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-teal-200 [&>svg]:h-5 [&>svg]:w-5"
                  >
                    <step.icon />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-zinc-500">{step.label}</p>
                    <p className="mt-0.5 text-sm font-medium text-zinc-100">
                      {step.value}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal variant="flip" delay={0.2}>
            <form
              onSubmit={handleSubmit}
              noValidate
              className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 shadow-[0_30px_60px_-30px_rgb(0_0_0/0.9)] md:p-8"
            >
              <h3 className="font-display text-lg font-semibold text-zinc-50">
                Écrivez-nous
              </h3>

              <fieldset className="mt-6">
                <legend className="text-sm text-zinc-300">Type de besoin</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {needs.map((item) => {
                    const active = need === item;

                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setNeed(item)}
                        aria-pressed={active}
                        className={`min-h-11 rounded-full border px-4 text-sm font-medium transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${
                          active
                            ? "border-teal-400/60 bg-teal-400/15 text-zinc-50"
                            : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/25 hover:text-zinc-100"
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-name" className={labelClass}>
                    Nom <span className="text-teal-300">*</span>
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={
                      errors.name ? "contact-name-error" : undefined
                    }
                    className={fieldClass}
                  />
                  {errors.name && (
                    <p id="contact-name-error" className={errorClass}>
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="contact-email" className={labelClass}>
                    Email <span className="text-teal-300">*</span>
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={
                      errors.email ? "contact-email-error" : undefined
                    }
                    className={fieldClass}
                  />
                  {errors.email && (
                    <p id="contact-email-error" className={errorClass}>
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5">
                <label htmlFor="contact-phone" className={labelClass}>
                  Téléphone <span className="text-zinc-500">(facultatif)</span>
                </label>
                <input
                  id="contact-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  className={fieldClass}
                />
              </div>

              <div className="mt-5">
                <label htmlFor="contact-message" className={labelClass}>
                  Message <span className="text-teal-300">*</span>
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={5}
                  required
                  minLength={MESSAGE_MIN_LENGTH}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={
                    errors.message ? "contact-message-error" : undefined
                  }
                  className={`${fieldClass} resize-y`}
                />
                {errors.message && (
                  <p id="contact-message-error" className={errorClass}>
                    {errors.message}
                  </p>
                )}
              </div>

              {/* Honeypot anti-spam : invisible pour les visiteurs. */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="contact-website">Ne pas remplir ce champ</label>
                <input
                  id="contact-website"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <div className="mt-5">
                <label className="flex min-h-11 items-start gap-3 text-sm leading-relaxed text-zinc-400">
                  <input
                    name="consent"
                    type="checkbox"
                    required
                    aria-invalid={Boolean(errors.consent)}
                    aria-describedby={
                      errors.consent ? "contact-consent-error" : undefined
                    }
                    className="mt-0.5 h-5 w-5 shrink-0 accent-emerald-500 [color-scheme:dark]focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
                  />
                  <span>
                    J&apos;accepte que mes données soient utilisées pour me
                    recontacter.{" "}
                    <Link
                      href="/confidentialite"
                      className="text-teal-300 underline decoration-teal-300/40 underline-offset-4 transition-colors duration-300 hover:text-teal-200 hover:decoration-teal-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
                    >
                      Voir la politique de confidentialité.
                    </Link>
                  </span>
                </label>
                {errors.consent && (
                  <p id="contact-consent-error" className={errorClass}>
                    {errors.consent}
                  </p>
                )}
              </div>

              {/* L'aimant porte la marge et la largeur : le bouton le remplit. */}
              <Magnetic className="mt-6 w-full align-top sm:w-auto">
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="btn-gradient inline-flex min-h-11 w-full items-center justify-center rounded-xl px-6 py-3.5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 sm:w-auto"
                >
                  <span className="relative z-10">
                    {status === "sending" ? "Envoi…" : "Envoyer"}
                  </span>
                </button>
              </Magnetic>

              {status === "success" && (
                <p
                  role="status"
                  className="mt-4 text-sm font-medium leading-relaxed text-emerald-300"
                >
                  Merci ! Votre message a bien été envoyé. Nous vous répondons
                  sous 24h.
                </p>
              )}
              {status === "error" && (
                <p
                  role="alert"
                  className="mt-4 text-sm font-medium leading-relaxed text-red-300"
                >
                  {errorMessage}
                </p>
              )}
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
