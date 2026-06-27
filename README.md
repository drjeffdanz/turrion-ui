# Turrion UI — witness console

Next.js console that **watches a cross-system causal chain reconstruct and the agent
conflict surface**. Ships with a bundled reconstruction of the $2.1M freight scenario, so
it lights up on Vercel with **zero backend**. Point it at a running Turrion to go live.

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
```

## Demo vs live

- **Demo (default):** no env vars needed — renders the bundled freight reconstruction.
- **Live:** set `NEXT_PUBLIC_TURRION_API` to your Turrion API base URL (e.g. the FastAPI
  service from `../turrion`). The console then loads the most recent run's chain and Ask
  Martus calls the real `/ask` endpoint.

```bash
# .env.local
NEXT_PUBLIC_TURRION_API=http://localhost:8088
```

## Deploy on Vercel (same as the marketing site)

1. Push this folder to a Git repo (or a subdirectory).
2. Import into Vercel → Framework preset **Next.js** (auto-detected), build is automatic.
3. (Optional) add `NEXT_PUBLIC_TURRION_API` in Project → Settings → Environment Variables
   to connect a live backend; leave it unset to ship the self-contained demo.

## What it shows

- **Animated causal graph** — decisions as nodes on SAP / Salesforce / ServiceNow lanes;
  edges colored by reconstruction basis (trace, entity, temporal, inferred); the
  conflicting-writes edge in red. "Replay" re-runs the light-up.
- **Divergence banner** — the standard-vs-air conflict and the $24,800 it caused.
- **Decision log** — every witnessed decision with actor, rationale, confidence.
- **Ask Martus** — ask a question; citations are clickable and highlight their decision.

Stack: Next.js (App Router, plain JS) + plain CSS. No other dependencies.
