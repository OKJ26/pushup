# Morning Pushups Challenge

Jeremy vs Grant. Every day. No excuses.

---

## Setup (one-time, ~15 mins)

### 1. Firebase — real-time database

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** > name it `pushup-challenge` > Continue (disable Analytics, not needed)
3. In the left sidebar: **Build > Realtime Database**
4. Click **Create Database** > choose your region (Australia Southeast) > Start in **test mode**
5. In the left sidebar: **Project Settings** (gear icon) > scroll to **Your apps** > click the `</>` web icon
6. Register the app (name it anything) > copy the `firebaseConfig` values
7. **Realtime Database rules**: paste the contents of `firebase-rules.json` into the Rules tab and Publish

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in your Firebase values:
```
cp .env.example .env.local
```
Then open `.env.local` and paste in each value from step 1.

### 3. Push notifications (optional but great)

1. In Firebase Console: **Project Settings > Cloud Messaging**
2. Scroll to **Web Push certificates** > click **Generate key pair**
3. Copy the key and paste it as `REACT_APP_FIREBASE_VAPID_KEY` in `.env.local`

### 4. GitHub

```bash
git init
git add .
git commit -m "Initial pushup challenge app"
```

Then on github.com: New repository > name it `pushup-challenge` > follow the push instructions shown.

### 5. Netlify

1. Go to [netlify.com](https://netlify.com) > **Add new site > Import from GitHub**
2. Select your `pushup-challenge` repo
3. Build command: `npm run build` — Publish directory: `build` (auto-detected)
4. Click **Environment variables** > add each `REACT_APP_*` value from your `.env.local`
5. Click **Deploy site**

Your app will be live at a URL like `pushup-challenge.netlify.app` — share that with Grant.

---

## How it works

- Both of you open the URL, pick your name — it saves locally so you only do this once
- Log your reps each morning — Grant's screen updates live within seconds
- Streaks, totals, and head-to-head are all real-time
- Add to home screen on both phones for the full app experience

### Add to home screen

**Android (Chrome):** tap the three-dot menu > "Add to Home screen"

**iPhone (Safari):** tap the Share icon > "Add to Home Screen"

---

## Local development

```bash
npm install
npm start
```

Runs at `http://localhost:3000` — needs `.env.local` filled in to connect to Firebase.

---

## Updating the app

```bash
git add .
git commit -m "your change"
git push
```

Netlify auto-deploys in ~2 minutes.
