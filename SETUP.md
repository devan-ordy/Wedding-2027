# Setup — Wedding 2027 Dashboard

Follow these in order. Total time: ~15 minutes.

You'll do three things:
1. Create a Firebase project (free) — for live sync + photo uploads
2. Create a GitHub repo and upload these files
3. Turn on GitHub Pages (free)

Then: open the URL on your phone, enter PIN `1397`, done.

---

## Part 1 — Firebase (~7 min)

Firebase is Google's free backend. You'll use it so you and Devan see the same data live.

### 1.1 Create the project

1. Go to **https://console.firebase.google.com/**
2. Sign in with a Google account (any — personal is fine)
3. Click **"Add project"**
4. Name it `wedding-2027` (or anything) → **Continue**
5. Google Analytics: **turn it off** → **Create project**
6. Wait ~30 seconds for it to provision, click **Continue**

### 1.2 Add a "web app" inside the project

1. On the project home, click the **`</>`** icon (web app)
2. Nickname: `wedding-2027` → click **Register app**
3. You'll see a block of code with keys. **Copy the whole `firebaseConfig = { ... }` block.** You'll paste this into `firebase-config.js` in a moment.
4. Ignore the rest of the page. Click **Continue to console**.

### 1.3 Turn on Firestore (the database)

1. Left sidebar → **Build → Firestore Database**
2. Click **Create database**
3. Location: **us-central** (or closest to you) → **Next**
4. **Start in production mode** → **Create**
5. Once it loads, click the **Rules** tab
6. Replace the entire text with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

7. Click **Publish**

> Quick note: this makes the database world-readable/writable *if someone has the URL*. The PIN in the app is your gate. That's acceptable for a wedding planning doc where no highly sensitive data lives. If you'd rather lock it down tighter later, we can add real auth — ask Claude.

### 1.4 Turn on Storage (for photo uploads)

1. Left sidebar → **Build → Storage**
2. Click **Get started** → **Next** → **Done**
3. Click the **Rules** tab
4. Replace the rules with:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

5. Click **Publish**

### 1.5 Paste the config into the app

1. Open `firebase-config.js` in any text editor
2. Replace all the `"PASTE_YOUR_..."` values with the matching values from the block you copied in step 1.2
3. It should end up looking like:

```js
export const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "wedding-2027.firebaseapp.com",
  projectId: "wedding-2027",
  storageBucket: "wedding-2027.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123:web:abc"
};
```

4. Save the file.

**Firebase done.** ✅

---

## Part 2 — GitHub (~5 min)

### 2.1 Create the repo

1. Go to **https://github.com/new**
2. Repository name: `wedding-2027`
3. **Public** is fine (nothing in the code is sensitive; the PIN protects the data)
4. **Don't** add a README, .gitignore, or license (we already have a README)
5. Click **Create repository**

### 2.2 Upload the files

Easiest path — no command line:

1. On the new empty repo page, click **"uploading an existing file"** (blue link)
2. Drag the entire contents of the `wedding-2027` folder into the upload area (all files + the `icons/` folder)
3. Scroll down, click **Commit changes**

⏳ Wait ~10 seconds for it to process.

---

## Part 3 — GitHub Pages (~2 min)

1. In the repo, click **Settings** (top right of the repo, not your account)
2. Left sidebar → **Pages**
3. Under **"Build and deployment"** → **Source**: pick **"Deploy from a branch"**
4. Branch: **main**, folder: **/ (root)** → **Save**
5. Wait ~1 minute. Refresh the page. You'll see: *"Your site is live at https://devan-ordy.github.io/wedding-2027/"*

---

## Part 4 — Use it

1. Open that URL on your phone
2. Enter PIN `1397`
3. On iPhone: tap the Share button (square with arrow) → **Add to Home Screen**
4. On Android (Chrome): tap the three-dot menu → **Add to Home screen**
5. Devan does the same. Share the URL.

The app now lives on your home screen like a real app. Everything you tick/add/change syncs to Devan's copy instantly.

---

## Updating content later

**Small content tweaks** (renaming a line item, adding a venue note, ticking checklists): just do them in the app.

**Bigger structural changes** (new budget category, extra checklist group, new section): ask Claude to edit `seeds.js` and push to GitHub. Or edit yourself: on GitHub, click the file → pencil icon → edit → Commit.

**Any code changes take effect within ~1 minute** of committing. On your phone, pull down to refresh.

---

## Troubleshooting

**"Not quite" PIN error** — you're typing the wrong PIN. It's `1397`.

**Sync dot is orange (offline)** — either your phone has no internet, or Firebase isn't reachable. Check Part 1.

**Sync dot is gray (local)** — `firebase-config.js` still has the `PASTE_...` placeholders. Revisit Part 1.5.

**Photo upload fails** — you skipped Part 1.4. Revisit Storage setup.

**Nothing happens when you click Save** — open your phone browser's DevTools or desktop Chrome's console (F12) and check for errors. Screenshot and send to Claude.

---

## One more thing

Everything in this app reads/writes to a single Firestore document. That means if you screw something up (accidentally delete a venue), **Settings → Export JSON** lets you make backups, and **Import JSON** restores them. Export after big changes.
