# ANANSI

Site vitrine d'ANANSI, micro-entreprise de développement web, cybersécurité et intelligence artificielle.

**Site en ligne : https://anansi-five.vercel.app**

## Ce que contient le site

- **Accueil** : présentation, avec une toile d'araignée en 3D que l'on peut faire tourner.
- **Services** : développement, sécurité et pentest, intelligence artificielle, renforcement et audit. Chaque carte ouvre une fiche détaillée (déroulé, livrables).
- **Méthode** : les trois étapes, de l'échange au suivi.
- **À propos** et **Contact** (formulaire envoyé par Web3Forms).

## Technologies

- [Next.js 15](https://nextjs.org) (export statique) et React 19
- TypeScript
- Tailwind CSS 4
- Framer Motion pour les animations

## Lancer le site en local

Il faut [Node.js](https://nodejs.org) 20 ou plus récent.

```bash
npm install
npm run dev
```

Le site s'ouvre sur http://localhost:3000.

Pour que le formulaire de contact fonctionne, créez un fichier `.env.local` à la racine avec une clé gratuite obtenue sur https://web3forms.com :

```
NEXT_PUBLIC_WEB3FORMS_KEY=votre_clé
```

Ce fichier n'est pas envoyé sur GitHub.

## Vérifier et construire

```bash
npm run lint
npm run build
```

`npm run build` génère le site statique dans le dossier `out/`.

## Mise en ligne

Le site est hébergé sur Vercel. Pour publier une nouvelle version :

```bash
vercel --prod
```

## Organisation du code

| Dossier | Contenu |
|---|---|
| `app/` | Pages, mise en page générale et styles globaux |
| `components/sections/` | Les sections de la page d'accueil |
| `components/ui/` | Éléments réutilisables (cartes 3D, animations, fond) |
| `lib/site.ts` | Nom, adresse et email du site |
| `public/` | Images et icônes |
