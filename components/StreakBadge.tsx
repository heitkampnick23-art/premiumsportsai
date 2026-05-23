export function StreakBadge({ current, best, badges }: { current: number; best: number; badges: string[] }) {
  const flame = current >= 7 ? '7+' : current >= 3 ? 'on' : null;
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="badge bg-orange-500/20 text-orange-300">
        Streak: <strong className="ml-1">{current}d</strong>
        {flame && <span className="ml-1">·</span>}
      </span>
      <span className="badge bg-zinc-700/40 text-zinc-300">Best: {best}d</span>
      {badges.map(b => (
        <span key={b} className="badge bg-accent2/20 text-accent2">{b.replace('streak-', '')}-day club</span>
      ))}
    </div>
  );
}
