# academic-grade-analyzer

Dashboard académique React pour **L1 Informatique** (interface 100% française) permettant de :
- calculer les moyennes pondérées (module, bloc, année sur 60 crédits),
- analyser les conditions de validation,
- estimer les notes minimales nécessaires sur les évaluations restantes,
- persister les données dans IndexedDB.

## Scripts

- `npm run dev` : lancer l’application en local
- `npm run lint` : vérifier le code avec ESLint
- `npm run test` : exécuter les tests Vitest
- `npm run build` : construire la version production

## Déploiement GitHub Pages

- Le projet est configuré pour être servi depuis `https://<owner>.github.io/academic-grade-analyzer/`.
- Le workflow GitHub Actions `.github/workflows/deploy-pages.yml` déploie automatiquement sur GitHub Pages à chaque push sur `main`.
- Dans les paramètres GitHub du dépôt, configurer **Pages** avec la source **GitHub Actions**.
