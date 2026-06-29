# EVOlearn AI chat (Gemini) integration

EVOlearn’s tutor chat is **local-first** by default (`assets/js/tutor-engine.js`). You can optionally enable **Gemini-backed chat** via a server-side proxy so **no API keys are exposed in the browser**.

## Architecture (recommended)

- **Client**: sends the student message plus lesson and slide context to `POST /api/chat`
- **Server (Firebase Functions)**: verifies Firebase Auth token, rate limits per user, fetches the student snapshot from Firestore, calls Gemini, returns a short response
- **Fallback**: if AI is unavailable (offline, not deployed, rate limited, misconfigured), EVOlearn falls back to the existing local rule-based tutor engine automatically

## Setup

### 1) Install Firebase CLI and select a project

```bash
npx -y firebase-tools@latest --version
npx -y firebase-tools@latest login
npx -y firebase-tools@latest use YOUR_PROJECT_ID
```

### 2) Install Functions dependencies

```bash
cd functions
npm install
```

### 3) Set the Gemini key (do not commit it)

For production, use a Functions secret:

```bash
npx -y firebase-tools@latest functions:secrets:set GEMINI_API_KEY
```

For local emulation only, you may set `functions/.env`:

```bash
cp functions/.env.example functions/.env
```

Then edit `functions/.env` and set:

- `GEMINI_API_KEY="..."` (keep this file out of git)

### 4) Run locally (optional)

```bash
npx -y firebase-tools@latest emulators:start --only hosting,functions
```

The endpoint will be available at `POST /api/chat` when using the Hosting emulator.

### 5) Deploy

```bash
npx -y firebase-tools@latest deploy --only functions,hosting
```

## Netlify setup

**Production URL:** https://evolearn.evolveone.ai — chat uses same-origin `POST /api/chat` (proxied via `netlify.toml`).

Production is hosted on Netlify. The chat API is **not** bundled with the static deploy — deploy the Firebase function first, then Netlify.

`netlify.toml` proxies same-origin chat requests to the Cloud Function:

- **Browser URL:** `POST /api/chat` (and `OPTIONS` for CORS preflight)
- **Backend:** `https://europe-west2-student-portal-9de85.cloudfunctions.net/chat`

The function handles CORS (including `OPTIONS`). After deploying functions, run `netlify deploy --prod --dir .` so the proxy rule is live. See `scripts/deploy-chat.sh` for the full manual checklist.

## Enabling AI chat per lesson/page

Set `data-chat-mode="ai"` on the page `<body>` element.

Example (PPT lessons already have `data-chat-mode="live"`):

```html
<body class="lesson-body" data-lesson-id="lesson-1" data-module-id="module-1" data-chat-mode="ai">
```

## Request payload (what the client sends)

The browser sends:

- **message**: student message (trimmed)
- **history**: last few turns from the current session (sessionStorage only)
- **context**: lessonId, slide title, slide hint/script snippet, level band and a short tutor persona label

## Safety and production notes

- **No secrets in git**: the Gemini API key is stored as a Functions secret or local `.env`.
- **Auth required**: the proxy requires a valid Firebase ID token. The client includes it automatically when signed in.
- **Snapshot-aware**: the proxy fetches `schools/{schoolId}/students/{uid}` plus recent `signals/*` to tailor responses (level, tutor status, weak areas from recent quizzes, recent topics).
- **Rate limiting**: basic in-memory token bucket per `uid`. This protects against accidental abuse but is not a substitute for persistent quota enforcement.
- **Prompt injection**: the server adds a strict system instruction and treats instruction override attempts as irrelevant.

## Quick test plan

1. Start the emulators (`hosting,functions`).
2. Open a lesson page and set `data-chat-mode="ai"`.
3. Ask a slide-specific question (for example: “What does ‘rule of law’ mean?”).
4. Confirm:
   - You get a Gemini response.
   - Turning off functions or going offline still returns a local tutor response.

