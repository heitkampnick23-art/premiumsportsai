# PremiumSportsAi

AI-powered NFL insights — four features wired end-to-end:

1. **AI Game Pulse** — win probabilities, key matchups, injury impact, narrative previews, confidence-graded predictions
2. **AI Bet Lab** — model edges vs. consensus lines, EV%, Kelly stake sizing, affiliate-out
3. **Personal Fan Agent** — favorite-team pre-game briefings and post-game recaps, three tones (analyst / hype / salty)
4. **Hot Takes Arena** — post takes, AI grades likelihood live, clout leaderboard

Plus: deduped news firehose, Stripe Premium ($14.99/mo, LIVE mode), Stripe tip jar.

## Stack

- Next.js 14 App Router on **Cloudflare Pages** (`@cloudflare/next-on-pages`, edge runtime)
- D1 (SQLite) for users, takes, predictions, tips, subscriptions
- KV for 60s odds/scores cache
- R2 for avatars
- Cloudflare Worker for cron triggers (every 5m, refreshes KV)
- Anthropic Claude (`claude-opus-4-7` + `claude-haiku-4-5-20251001`) with prompt caching
- Stripe LIVE mode (subs + one-time tips)
- The Odds API + SportsDataIO for live data

See `SETUP.md` for env vars and deploy commands.

## Run

```bash
npm install
npm run dev          # localhost:3000, runs on fixtures with no keys
npm run pages:deploy # deploys to premiumsportsai.pages.dev
```

## Compliance

PremiumSportsAi is NOT a sportsbook and does not accept wagers. Insights only. 21+. 1-800-GAMBLER.
