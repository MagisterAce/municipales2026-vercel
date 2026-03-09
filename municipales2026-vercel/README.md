# Municipales 2026 · Projet Vercel

## Déploiement

1. Créer un dépôt GitHub et y envoyer tout le contenu de ce dossier.
2. Importer le dépôt dans Vercel.
3. Ajouter la variable d'environnement `ANTHROPIC_API_KEY`.
4. Déployer.

## Fonctionnement

- `src/App.jsx` : application React.
- `exportExcel()` : export Excel côté navigateur via SheetJS CDN.
- `/api/generate-pdf` : fonction Vercel qui appelle l'API Anthropic puis génère un PDF.

## Variable d'environnement requise

- `ANTHROPIC_API_KEY`

## Développement local

```bash
npm install
npm run dev
```
