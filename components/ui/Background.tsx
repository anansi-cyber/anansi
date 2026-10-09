import Scene3D from "./Scene3D";

// Fond fixe : halos bleu et violet qui dérivent lentement + grille discrète,
// puis le champ de soie en 3D par-dessus (donc juste sous le contenu).
// Uniquement des dégradés, des transformations et un canvas, sans filtre de flou.
export default function Background() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#040b0c]"
    >
      <div className="absolute -left-[20%] -top-[25%] h-[70vmax] w-[70vmax] animate-drift-a bg-[radial-gradient(closest-side,rgb(5_150_105/0.28),transparent)]" />
      <div className="absolute -right-[25%] top-[20%] h-[75vmax] w-[75vmax] animate-drift-b bg-[radial-gradient(closest-side,rgb(8_145_178/0.24),transparent)]" />
      <div className="absolute -bottom-[35%] left-[15%] h-[60vmax] w-[60vmax] animate-drift-a bg-[radial-gradient(closest-side,rgb(20_184_166/0.14),transparent)]" />
      <div className="bg-grid absolute inset-0" />
      <Scene3D />
    </div>
  );
}
