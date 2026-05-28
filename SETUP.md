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

When you ship the revenue/retention layer, run migrations again to pick up `0002_revenue_retention.sql`.

## 3. Secrets (LIVE keys only)

Set with `wrangler pages secret put <NAME> --project-name=premiumsportsai`:

### Core
| Secret | Where to get it | Required for |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys | All AI features (falls back to deterministic stubs if absent) |
| `STRIPE_SECRET_KEY` | dashboard.stripe.com → Developers → API keys (LIVE `sk_live_…`) | Subscriptions, tips, pay-per-pick |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks → endpoint `https://premiumsportsai.pages.dev/api/stripe/webhook` listening for `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` | Webhook verification |
| `STRIPE_PRICE_PRO` (or legacy `STRIPE_PRICE_PREMIUM`) | Stripe → Products → "Pro" recurring **$14.99/mo** → copy `price_…` | Pro subscribe button |
| `STRIPE_PRICE_SHARP` | Stripe → Products → "Sharp" recurring **$29.99/mo** → copy `price_…` | Sharp subscribe button |
| `STRIPE_PRICE_PICK_UNLOCK` | Stripe → Products → "Single pick unlock" one-time **$2.99** → copy `price_…` (optional; checkout falls back to inline `price_data`) | Pay-per-pick unlock |
| `ODDS_API_KEY` | the-odds-api.com (paid plan recommended) | Real odds vs. fixtures |
| `SPORTSDATAIO_KEY` | sportsdata.io NFL (free tier OK for v1) | Scores/injuries enrichment |
| `RESEND_API_KEY` | resend.com → API Keys (verify `premiumsportsai.com` sender domain) | Agent email + daily blast |
| `RESEND_FROM` | optional — defaults to `PremiumSportsAi <agent@premiumsportsai.com>` | Sender override |
| `SESSION_SECRET` | `openssl rand -hex 32` | Cookie signing + cron auth fallback |
| `CRON_SECRET` | `openssl rand -hex 32` | Cron worker shared secret (preferred over SESSION_SECRET) |

### Affiliate URLs
Each defaults to the sportsbook public landing page if unset. Most sportsbook affiliate programs append a query param (`?affid=…`, `?bttoken=…`, `?wm=…`) — paste the full tracked URL.

| Secret | Default fallback |
| --- | --- |
| `AFFILIATE_DK_URL` | https://sportsbook.draftkings.com |
| `AFFILIATE_FD_URL` | https://sportsbook.fanduel.com |
| `AFFILIATE_BETMGM_URL` | https://sports.betmgm.com |
| `AFFILIATE_CAESARS_URL` | https://www.caesars.com/sportsbook-and-casino |

Affiliate clicks land at `/go/[book]` (e.g. `/go/dk`), log to D1 `affiliate_clicks`, then 302 to the tracked URL. Use these everywhere instead of raw sportsbook links.

### Web push (VAPID)
1. Hit `GET /api/push/admin/gen?key=$SESSION_SECRET` once on the deployed site. It returns a freshly-generated keypair.
2. Set `VAPID_PUBLIC_KEY` (base64url public, used by the browser) and `VAPID_PRIVATE_KEY` (full JWK JSON string).
3. Optional `VAPID_SUBJECT` — defaults to `mailto:agent@premiumsportsai.com`.

## 4. Deploy

```bash
npm run pages:deploy          # builds with @cloudflare/next-on-pages, deploys to *.pages.dev
npm run cron:deploy           # deploys the cron Worker (every 5 min — calls /api/cron/refresh)
```

First deploy will create the Pages project. Visit `https://premiumsportsai.pages.dev`.

## 5. Custom domain

Add `premiumsportsai.com` in Cloudflare Pages → Custom domains. DNS already on Cloudflare per workspace memory.

## Feature surface (what to click after deploy)

- `/` — hero, today's free lock, email capture, 3-tier pricing, top takes, responsible-gambling footer
- `/locks` — daily AI locks (1 free + 3 Pro + Sharp Lock); pay-per-pick unlock for free users
- `/pricing` — 3-tier checkout (Free / Pro $14.99 / Sharp $29.99)
- `/dfs` — Pro+ DFS lineup optimizer (DK or FD, 3 lineups)
- `/contest` — free weekly "AI vs You" (top score wins a free Pro month)
- `/chat` — Claude Haiku team-focused chat (5/day free, unlimited Pro)
- `/leaderboard` — clout / streak / referrer rankings, indexed in sitemap
- `/u/[handle]` — public profile with dynamic OG image
- `/r/[code]` — referral landing → 30 days Pro for both on first paid plan
- `/agent` — favorite teams, tone, push opt-in, referral link, handle editor
- `/go/[book]` — affiliate redirect (`dk`, `fd`, `betmgm`, `caesars`) with click logging
- `/robots.txt`, `/sitemap.xml` — SEO

## Notes

- All API routes use `runtime = 'edge'` so they execute on Cloudflare Pages Functions.
- Anthropic models: `claude-opus-4-7` for locks/Game Pulse/Bet Lab/DFS, `claude-haiku-4-5-20251001` for take grading + chat + news + contest AI picks. Prompt caching is on via `cache_control: { type: 'ephemeral' }` on stable system prompts.
- Web push payloads are sent as "tickles" (no encrypted payload). The service worker shows a default notification — sufficient for the alert UX. Full aes128gcm encryption can be layered in later.
# Pool entry Stripe prices wired: //
