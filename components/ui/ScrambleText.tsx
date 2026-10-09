"use client";

import { useEffect, useRef, useState } from "react";

const glyphs = "abcdefghijklmnopqrstuvwxyz01#$%&";

// Texte « déchiffré » au chargement : les lettres défilent puis se fixent une à
// une. Le vrai texte reste dans la page (invisible) pour réserver la place et
// pour les lecteurs d'écran ; seule la copie animée est affichée.
// Au survol de la souris, le déchiffrage se rejoue.
export default function ScrambleText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const [display, setDisplay] = useState(text);
  const [run, setRun] = useState(0);
  const playing = useRef(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    playing.current = true;
    const timer = window.setInterval(() => {
      frame += 1;
      const resolved = Math.floor(frame / 2);
      setDisplay(
        text
          .split("")
          .map((char, index) =>
            index < resolved || char === " "
              ? char
              : glyphs[Math.floor(Math.random() * glyphs.length)],
          )
          .join(""),
      );
      if (resolved >= text.length) {
        window.clearInterval(timer);
        playing.current = false;
      }
    }, 45);

    return () => {
      window.clearInterval(timer);
      playing.current = false;
    };
  }, [text, run]);

  // Souris uniquement, et jamais pendant qu'une animation est déjà en cours.
  function handlePointerEnter(event: React.PointerEvent<HTMLSpanElement>) {
    if (event.pointerType !== "mouse" || playing.current) return;
    setRun((count) => count + 1);
  }

  return (
    <span className="inline-grid" onPointerEnter={handlePointerEnter}>
      <span className="col-start-1 row-start-1 opacity-0">{text}</span>
      <span aria-hidden="true" className={`col-start-1 row-start-1 ${className}`}>
        {display}
      </span>
    </span>
  );
}
