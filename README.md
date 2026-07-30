# Modern Hymns Book PWA

[![Netlify Status](https://api.netlify.com/api/v1/badges/74dc9fff-7af3-461a-bba9-d106d1f806c4/deploy-status)](https://app.netlify.com/sites/edeno-aidai/deploys)

Simple, offline-capable Lithuanian hymnal for the Seventh-day Adventist Church,
based on the _Edeno Aidai_ hymn book.

Built with Vue 3, Vite, Dexie, and Workbox.

## Local development

Use Node.js 24 and npm 12:

```sh
npm ci
npm run dev
```

The app expects these public build-time environment variables:

- `VITE_DB_URL` — hymn JSON endpoint
- `VITE_DB2_URL` — audio-track metadata endpoint
- `VITE_CACHE_VERSION` — optional data/cache version

The previous `VUE_APP_DB_URL`, `VUE_APP_DB2_URL`, `VUE_APP_CACHE_VERSION`, and
`CACHE_VERSION` names remain supported for the existing Netlify configuration.

## Validation and deployment

```sh
npm run lint
npm run build
npm audit
```

Netlify builds the site with Node 24 and publishes `dist`.
