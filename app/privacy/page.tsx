export const runtime = 'edge';
export const metadata = { title: 'Privacy Policy — PremiumSportsAi' };

export default function Privacy() {
  return (
    <article className="prose prose-invert max-w-3xl space-y-4">
      <h1 className="text-3xl font-black">Privacy Policy</h1>
      <p className="text-sm text-zinc-400">Effective: May 23, 2026 · Last updated: May 23, 2026</p>
      <p>This explains what data PremiumSportsAi collects, how we use it, and your rights.</p>

      <h2 className="font-bold">1. Data we collect</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li><strong>Account:</strong> email, hashed password (or OAuth ID), handle, favorite teams, tier — to authenticate and personalize</li>
        <li><strong>Payment:</strong> last 4 of card, billing ZIP, Stripe customer ID — <em>we never see or store full card numbers</em></li>
        <li><strong>Behavioral:</strong> pages visited, picks viewed, takes posted, contest entries, affiliate clicks — to improve product, calculate clout, measure conversions</li>
        <li><strong>Device:</strong> IP, user agent, approximate geo (country/state) — for security and state-by-state sportsbook eligibility</li>
        <li><strong>Communications:</strong> email open/click events, push tokens — to deliver requested communications</li>
        <li><strong>AI prompts:</strong> chat messages and pick history — to generate responses (de-identified for model improvement)</li>
      </ul>
      <p>We do <strong>not</strong> collect: SSN, government ID, full card data, exact GPS, browsing history outside our site, contacts, microphone, camera.</p>

      <h2 className="font-bold">2. How we use it</h2>
      <p>Provide and improve the Service · Process payments and pay out pool winners · Personalize predictions and recaps · Send transactional and (with consent) marketing emails · Detect fraud and abuse · Comply with legal obligations (tax reporting for pool winnings).</p>

      <h2 className="font-bold">3. Who we share it with</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li><strong>Stripe</strong> — payment processing</li>
        <li><strong>Resend</strong> — transactional and marketing email</li>
        <li><strong>Anthropic</strong> — chat / prompt content for inference (not used for model training under our agreement)</li>
        <li><strong>Cloudflare</strong> — hosting, security, DNS, CDN</li>
        <li><strong>The Odds API, SportsDataIO</strong> — receive only the queries; no user data</li>
        <li><strong>Sportsbook affiliates</strong> — receive your IP + referral ID when you click out; their privacy policy applies after that</li>
        <li><strong>Legal authorities</strong> — when compelled by valid legal process</li>
      </ul>
      <p>We do <strong>not</strong> sell your personal information. We do <strong>not</strong> share data with advertisers for targeted advertising.</p>

      <h2 className="font-bold">4. Cookies and tracking</h2>
      <p>First-party cookies for session, preference, and A/B testing. Cloudflare privacy-respecting analytics (no cross-site tracking). No Google Analytics, no Facebook Pixel, no third-party ad cookies.</p>

      <h2 className="font-bold">5. Push notifications</h2>
      <p>Web Push tokens tied to your account; revocable any time in browser settings or in-app. We send pre-game briefings, injury alerts, take-grade updates, contest results. Never marketing without separate consent.</p>

      <h2 className="font-bold">6. Data retention</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Account data: deleted within 30 days of account deletion (some records retained for tax, fraud, legal)</li>
        <li>Payment records: 7 years (US tax law)</li>
        <li>Affiliate click logs: 24 months</li>
        <li>AI chat history: 90 days then purged</li>
        <li>Backups: rotated out within 30 days</li>
      </ul>

      <h2 className="font-bold">7. Your rights</h2>
      <p>Regardless of where you live: <strong>access, correct, delete, export</strong> your data, <strong>opt out</strong> of marketing emails, <strong>revoke</strong> push notifications.</p>
      <p><strong>California (CCPA/CPRA):</strong> right to know, delete, correct, opt out of &ldquo;sharing&rdquo; (we don&rsquo;t), non-discrimination.</p>
      <p><strong>EU/UK (GDPR):</strong> legal bases — (a) contract for account/payment, (b) legitimate interest for security/improvement, (c) consent for marketing/push. Right to complain to your supervisory authority.</p>
      <p><strong>Account deletion:</strong> Account → Delete Account triggers immediate purge of profile, takes, picks, chat, push tokens. Payment ledger retained per Section 6.</p>

      <h2 className="font-bold">8. Children</h2>
      <p>Service not directed to anyone under 21. We do not knowingly collect data from minors.</p>

      <h2 className="font-bold">9. Security</h2>
      <p>TLS 1.3 in transit; encrypted at rest (Cloudflare D1, R2). Passwords hashed with bcrypt/Argon2. Stripe handles all card data. Breach notification within 72 hours per applicable law.</p>

      <h2 className="font-bold">10. International transfers</h2>
      <p>Cloudflare global edge. EU/UK transfers rely on Standard Contractual Clauses with our subprocessors.</p>

      <h2 className="font-bold">11. Changes</h2>
      <p>Material changes announced via email and site banner 14 days before effective date.</p>

      <h2 className="font-bold">12. Contact</h2>
      <p>Privacy questions, data requests, exercise rights: <a href="mailto:heitkampnick23@gmail.com?subject=Privacy" className="underline">heitkampnick23@gmail.com</a></p>

      <hr className="border-edge" />
      <p className="text-sm text-zinc-400">See also <a href="/terms" className="underline">Terms of Service</a> and <a href="/responsible-gambling" className="underline">Responsible Gambling</a>.</p>
    </article>
  );
}
