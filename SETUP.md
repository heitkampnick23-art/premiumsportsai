# PremiumSportsAi — Setup

Greenfield Next.js 14 (App Router) on **Cloudflare Pages** with D1, KV, R2, and a separate cron Worker.
All external services are **LIVE production mode from day one** per user rule.

## 1. Local dev

```bash
npm install
npm run dev          # http://localhost:3000 (uses in-memory store + fixture games)
```

The app runs end-to-end without any keys (fixtures + in-memory DB) so you can click through every feature locally.

## 2. Cloudflare resources

Run once, then paste the IDs into `wrangler.toml`:

```bash
wrangler d1 create premiumsportsai
wrangler kv namespace create premiumsportsai-cache
wrangler r2 bucket create premiumsportsai-avatars
wrangler d1 migrations apply premiumsportsai --remote
```

## 3. Secrets (LIVE keys only)

Set with `wrangler pages secret put <NAME> --project-name=premiumsportsai`:

| Secret | Where to get it | Required for |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys | All AI features (falls back to deterministic stubs if absent) |
| `STRIPE_SECRET_KEY` | dashboard.stripe.com → Developers → API keys (LIVE) | Subscriptions + tip jar |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks → endpoint `https://premiumsportsai.pages.dev/api/stripe/webhook` listening for `checkout.session.completed` and `customer.subscription.deleted` | Webhook verification |
| `STRIPE_PRICE_PREMIUM` | Stripe → Products → create "Premium" recurring $14.99/mo → copy price id `price_…` | Subscribe button |
| `ODDS_API_KEY` | the-odds-api.com (paid plan recommended) | Real odds vs. fixtures |
| `SPORTSDATAIO_KEY` | sportsdata.io NFL (free tier OK for v1) | Scores/injuries enrichment |
| `RESEND_API_KEY` | resend.com → API Keys (verify `premiumsportsai.com` sender domain) | Agent email delivery (in-app inbox works without it) |
| `SESSION_SECRET` | `openssl rand -hex 32` | Cookie signing |

## 4. Deploy

```bash
npm run pages:deploy          # builds with @cloudflare/next-on-pages, deploys to *.pages.dev
npm run cron:deploy           # deploys the cron Worker
```

First deploy will create the Pages project. Visit `https://premiumsportsai.pages.dev`.

## 5. Custom domain

Add `premiumsportsai.com` in Cloudflare Pages → Custom domains. DNS already on Cloudflare per workspace memory.

## Notes

- All API routes use `runtime = 'edge'` so they execute on Cloudflare Pages Functions.
- Anthropic models: `claude-opus-4-7` for Game Pulse + Bet Lab, `claude-haiku-4-5-20251001` for take grading + news clustering. Prompt caching is on via `cache_control: { type: 'ephemeral' }` on stable system prompts.
- If `STRIPE_SECRET_KEY` is missing, the Subscribe button surfaces a clear setup message instead of silently failing.
- Affiliate links (DraftKings, FanDuel) are placeholders — replace with your tracked affiliate URLs.
