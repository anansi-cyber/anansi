"use client";

import { MotionConfig } from "framer-motion";

// reducedMotion="user" : les animations de transformation sont désactivées
// pour les visiteurs qui ont activé « réduire les animations ».
export default function MotionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
