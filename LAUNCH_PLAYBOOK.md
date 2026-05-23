# PremiumSportsAi — Launch Playbook
*Goal: 0 → 1,000 weekly active users in 30 days, 100 paying ($14.99+) in 60 days, $5k MRR by day 90.*

---

## North Star

One metric: **Paid signups per affiliate click out**.
If you can get 1 paid Pro for every 30 sportsbook click-outs, the model works. Track this weekly. Everything below is optimizing for it.

## Funnel math (the only spreadsheet that matters)

| Stage | Conversion | Where it happens |
|---|---|---|
| Social impression → site visit | 1.5% | TikTok/X hook → bio link |
| Visit → email capture | 25% | Homepage "Get today's free lock" |
| Email → free signup | 40% | Drip email day 0 |
| Free → Pro $14.99 | 4% | Drip day 2 + Locks paywall |
| Pro → Sharp $29.99 | 10% | Sharp Lock previews + Discord tease |
| Sportsbook click → CPA payout | 8% | Bet Lab + Locks contextual CTAs |

**$5k MRR = 280 Pro subscribers OR 100 Pro + 130 Sharp.** That's reachable from ~7,000 site visits if you hit the conversions above.

---

## Week 1: Get reps in

**Content cadence (non-negotiable):**
- TikTok: 3 posts/day (morning preview, mid-day take, evening lock)
- X/Twitter: 5 posts/day + reply to 20 high-follower NFL accounts
- 1 blog post/day (programmatic team pages already generate 32 — backfill with custom analysis)

**Five hook formulas that work in sports content:**
1. *"My AI has been [running NFL slates / on a 7-game heater]. Tonight it likes…"* — authority + tease
2. *"Sportsbooks DON'T want you to see this line movement…"* — curiosity + tribe
3. *"The sharps are pounding [X]. Here's why my model agrees / disagrees…"* — counter-narrative
4. *"Updated injury report just dropped. Three games this changes everything for…"* — newsjack + utility
5. *"You think you can beat my AI? Free contest, winner gets a free month…"* — interactive + viral

Always end with: **"Free pick at premiumsportsai.com"** or a bio link.

**Hashtag stack:** #NFL #SportsBetting #DFS #NFLDFS #BettingTips #AIPicks #SportsBettingTips — rotate, don't stack >5 per post.

---

## Week 2: SEO + email moat

- **Programmatic SEO already live**: 32 team pages at `/teams/[slug]`. Submit `sitemap.xml` to Google Search Console + Bing Webmaster Tools day 1.
- **Build 50 long-tail articles** in week 2: "Chiefs vs Bills betting trends 2026," "Best DraftKings DFS stacks Week N," etc. Use Claude to draft, you edit for voice. Target keywords with KD <30.
- **Email list is your moat.** Free pick goes out daily 9am ET. Subject lines that work:
  - *"Today's free lock: [Team] [-X]"*
  - *"3 sharps pounded this line — here's the angle"*
  - *"Your AI agent says fade [Team] tonight"*

---

## Week 3: Viral loops

- **Hot Takes Arena** is your viral primitive — push it. Tweet the most fire daily take with link to the user's `/u/[handle]` page → user reshares because it's their brag page. Build virality in.
- **Referral push**: every Pro user emailed personally with their referral link + a tracked goal ("invite 3 friends, you get 90 days free + a badge"). 30-day Pro extension already wired.
- **"Beat the AI" weekly contest** (already at `/contest`): post the slate Sunday morning, leaderboard mid-game on X, winner gets a free Pro month + shoutout. Recurring weekly content.

---

## Week 4: Affiliate revenue kicks in

By now: 5 sportsbooks approved (DK/FD/BetMGM/Caesars/ESPN Bet).
- **Geo-target your affiliate CTAs**: every Bet Lab page should detect user state and surface the highest-CPA legal book for that state. NJ/PA/MI/AZ default to FanDuel ($500 CPA tier); CO/IL default to DraftKings; KY/TN to BetMGM. Adjust per your accepted rates.
- **Hard-pivot Locks of the Day** to be book-specific: "BUF -2.5 → Best line at FanDuel ($0.05 better than market). Tap to claim $200 bonus."
- **Track click-to-deposit** in `affiliate_clicks` + manual reconciliation against sportsbook payout reports.

---

## Tier upgrade triggers (built into the product)

| Trigger | Upsell |
|---|---|
| Free user views 3rd Locks page in 7 days | Modal: "You've seen our top picks 3x — go Pro for $14.99" |
| Pro user wins 3 Sharp Lock previews | Email: "Sharp users went 12-4 last month. Upgrade $15/mo more" |
| Pro user enters 3 contests | Push: "Contest winners get Sharp tier free for 30 days" |
| Streak hits 14 days | In-app: "You're consistent — unlock unlimited chat with Pro" |
| Referrer hits 5 invites | Auto-grant Pro free for 1 month (already wired) |

---

## Content moats (do these in month 2)

1. **YouTube long-form**: weekly "AI vs Vegas" recap, 8-12 min, embed your model picks. SEO-juicy.
2. **Discord (Sharp-only)** — gated by Sharp tier. Real-time line alerts, model debates, sweat threads. Stickiness 10x.
3. **Free Telegram channel** for free users — pre-game alerts only. Funnel back to site.
4. **"Sharp Report" weekly email** — beat the closing line analysis. Free to all subscribers, drives Pro signups.

---

## Anti-patterns (do NOT do these)

- ❌ Don't claim 60%+ win rates ever. FTC/affiliate compliance + credibility.
- ❌ Don't take bets, ever. You're insights — sportsbooks pay you for clicks, not bets.
- ❌ Don't paywall the free pick. It's the funnel.
- ❌ Don't post picks publicly before 9am — sharps will fade you for content.
- ❌ Don't run paid ads until organic conversion hits 4% on free→Pro. Otherwise you're lighting money on fire.

---

## Day-1 checklist

- [ ] All 7 API keys set as Pages secrets (see SETUP.md)
- [ ] Stripe webhook tested with a live $0.50 charge → refund cycle
- [ ] Google Search Console verified + sitemap submitted
- [ ] Bing Webmaster verified
- [ ] TikTok + X + IG accounts created with handle `@premiumsportsai`
- [ ] First 3 TikToks scheduled (free lock, hot take, "beat my AI" call-to-action)
- [ ] DK/FD/BetMGM/Caesars/ESPN Bet affiliate applications submitted
- [ ] Discord server created (Sharp-only later)
- [ ] First daily email blast scheduled for 9am ET tomorrow
- [ ] Responsible-gambling disclaimer on every Bet Lab page (already wired)

---

## What to watch in your `/admin` dashboard

Daily:
- New signups
- Email subscriber count
- Affiliate clicks per book
- MRR delta

Weekly:
- Free → Pro conversion %
- Push opt-in rate
- Top 10 takes (find your power-users, DM them)
- A/B test winner

Monthly:
- LTV per tier (target: Pro $90, Sharp $200)
- Churn % (target: <8% Pro, <5% Sharp)
- CPA per book

---

*Operator note: the boring stuff (daily email, fresh content, fast picks) compounds. The exciting stuff (paid ads, influencer deals, big partnerships) doesn't until you have proof the boring stuff works. Spend month 1 on the boring stuff.*
