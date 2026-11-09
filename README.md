# tutorlah

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Seed demo tutors

The seed script creates real Firebase Authentication accounts. Supply a strong
local password through `SEED_TUTOR_PASSWORD`; the script has no default and
never prints the value.

```sh
cp .env.seed.example .env.seed
# Replace the placeholder in .env.seed, then load it into this shell.
set -a
. ./.env.seed
set +a
npm run seed:tutors
unset SEED_TUTOR_PASSWORD
```

`.env.seed` is ignored by Git. Only `.env.seed.example`, containing a
placeholder, should be committed. Existing seeded Firebase accounts must have
their passwords rotated or be deleted manually. The previous value also remains
in older Git commits; any history rewrite requires a coordinated team decision.

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

## Deploy to Firebase Hosting (NFR-006)

Live site: https://tutorlah-24204.web.app

Deploy only from an up-to-date `main`, after merging:

```sh
git checkout main
git pull origin main
npm install
npm run build
npx firebase-tools deploy --only hosting
```

The first time, run `npx firebase-tools login` with a Google account that has access to the `tutorlah-24204` Firebase project.

To publish `firestore.rules`, run `npx firebase-tools deploy --only firestore:rules`. This replaces the rules in the Firebase Console, so check that `firestore.rules` on `main` is the latest version first.
