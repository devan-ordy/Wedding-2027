# Ordy & Devan — Wedding 2027

Our Saint Lucia wedding planning hub. Phone-friendly, tropical, live-synced across devices.

## What's in here

- **index.html** — the app
- **app.js** — main logic
- **store.js** — data layer (Firebase or local)
- **styles.css** — the St. Lucia look
- **seeds.js** — initial content (itinerary, venues, checklists, etc.)
- **firebase-config.js** — your Firebase credentials go here
- **sw.js** — makes it work offline
- **manifest.json** + **icons/** — Add-to-Home-Screen support
- **SETUP.md** — how to deploy

## Quick start

1. Follow **SETUP.md** step-by-step (takes ~15 minutes total).
2. When live, open the URL on your phone, enter PIN `1397`.
3. On iPhone: Share → Add to Home Screen. Works like a real app.

## Editing content later

Open the app, tap anything — most things are editable in-place. For deeper changes (new venue, new budget category, new checklist group), edit `seeds.js` and click **Settings → Reset to defaults** (⚠️ wipes your data). Or ask Claude to push changes for you.
