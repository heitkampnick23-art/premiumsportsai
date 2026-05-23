export const runtime = 'edge';
export const metadata = { title: 'Responsible Gambling — PremiumSportsAi' };

export default function ResponsibleGambling() {
  return (
    <article className="prose prose-invert max-w-3xl space-y-4">
      <h1 className="text-3xl font-black">Responsible Gambling</h1>
      <p>We want PremiumSportsAi to be fun, informative, and <strong>never harmful</strong>. Gambling is entertainment, not income. Bet only with money you can afford to lose.</p>

      <h2 className="font-bold">Warning signs</h2>
      <p>If any of these describe you or someone you know, please get help today:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Betting more than planned, or chasing losses</li>
        <li>Borrowing money to bet, or using money meant for bills</li>
        <li>Lying about how much or how often you bet</li>
        <li>Feeling anxious, depressed, or irritable when not betting</li>
        <li>Trying to quit and failing</li>
        <li>Betting interfering with work, sleep, school, or relationships</li>
      </ul>

      <h2 className="font-bold">Get help now (US)</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li><strong>National Problem Gambling Helpline</strong> — call/text <strong>1-800-GAMBLER</strong> (1-800-426-2537), 24/7, free, confidential</li>
        <li><strong><a href="https://www.ncpgambling.org/" className="underline" target="_blank" rel="noopener noreferrer">NCPGambling.org</a></strong> — resources, treatment locator, chat</li>
        <li><strong><a href="https://www.gamblersanonymous.org/" className="underline" target="_blank" rel="noopener noreferrer">Gamblers Anonymous</a></strong> — peer support meetings</li>
        <li><strong><a href="https://gamtalk.org/" className="underline" target="_blank" rel="noopener noreferrer">GamTalk</a></strong> — anonymous online community</li>
        <li><strong>SAMHSA Helpline</strong> — 1-800-662-HELP — substance abuse / co-occurring mental health</li>
      </ul>
      <p>Outside the US: <a href="https://www.begambleaware.org/" className="underline" target="_blank" rel="noopener noreferrer">BeGambleAware</a> (UK) or your country&rsquo;s national problem-gambling helpline.</p>

      <h2 className="font-bold">Self-exclusion at the sportsbook level</h2>
      <p>If you&rsquo;re struggling, <strong>self-exclude at the sportsbook</strong>. State self-exclusion lists prevent licensed sportsbooks (DraftKings, FanDuel, BetMGM, Caesars, ESPN BET, etc.) from accepting wagers or sending promotions. Search &ldquo;[your state] gambling self-exclusion.&rdquo;</p>

      <h2 className="font-bold">Limits we enforce on our side</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>21+ age gate before any pool entry or premium feature</li>
        <li>Geo-detection blocks pool entries where not legal</li>
        <li>Hard caps on consecutive pool entries per 24 hours</li>
        <li>Reality-check banners after 30 minutes of continuous active session</li>
        <li>No targeting of minors</li>
        <li>No deceptive marketing — published win rates are auditable</li>
        <li>Self-exclusion: email us, account disabled within 24 hours</li>
      </ul>

      <h2 className="font-bold">Our content philosophy</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Confidence ratings are probabilistic, not guarantees</li>
        <li>&ldquo;Locks of the Day&rdquo; is a brand term, not a promise</li>
        <li>We disclose all sportsbook affiliate relationships</li>
        <li>We never sell or rent your data to gambling advertisers</li>
        <li>We do not amplify &ldquo;guaranteed system&rdquo; claims, parlay bait, or martingale strategies</li>
      </ul>

      <h2 className="font-bold">Set your own limits</h2>
      <p>Before you bet, set: a <strong>weekly bankroll</strong> you can afford to lose; a <strong>maximum bet size</strong> as a percentage of bankroll (most pros use 1–3%); a <strong>stop-loss trigger</strong>; a <strong>time limit</strong>. The Bet Lab reports Kelly stake sizing — treat it as a <strong>maximum</strong>, not a target.</p>

      <h2 className="font-bold">Self-exclude from PremiumSportsAi</h2>
      <p>Email <a href="mailto:heitkampnick23@gmail.com?subject=Self-Exclude" className="underline">heitkampnick23@gmail.com</a> with subject <strong>&ldquo;Self-Exclude&rdquo;</strong> and your account email. Within 24 hours we will: cancel your subscription, refund any unstarted pool entry, permanently disable account creation from that email. This cannot be reversed for at least 6 months.</p>

      <hr className="border-edge" />
      <p className="text-sm text-zinc-400">If you are in crisis, call <strong>988</strong> (US Suicide &amp; Crisis Lifeline) or <strong>1-800-GAMBLER</strong> right now. You&rsquo;re not alone. · See also <a href="/terms" className="underline">Terms</a> and <a href="/privacy" className="underline">Privacy</a>.</p>
    </article>
  );
}
