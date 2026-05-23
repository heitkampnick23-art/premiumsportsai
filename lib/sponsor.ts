import { exec, q } from './db';

export type SponsoredTake = {
  id: string;
  sponsor_name: string;
  sponsor_link: string;
  tier: 'bronze' | 'silver' | 'gold';
  text: string;
  starts_at: number;
  ends_at: number;
  created_at: number;
};

export async function getActiveSponsoredTake(): Promise<SponsoredTake | null> {
  const now = Date.now();
  const r = await q<SponsoredTake>(
    'SELECT * FROM sponsored_takes WHERE starts_at <= ? AND ends_at >= ? ORDER BY created_at DESC LIMIT 1',
    [now, now],
  );
  return r.results[0] ?? null;
}

export async function createSponsoredTake(input: Omit<SponsoredTake, 'id' | 'created_at'>) {
  const id = crypto.randomUUID();
  await exec(
    'INSERT INTO sponsored_takes (id, sponsor_name, sponsor_link, tier, text, starts_at, ends_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, input.sponsor_name, input.sponsor_link, input.tier, input.text, input.starts_at, input.ends_at, Date.now()],
  );
  return id;
}

export async function listSponsoredTakes(): Promise<SponsoredTake[]> {
  const r = await q<SponsoredTake>('SELECT * FROM sponsored_takes ORDER BY created_at DESC LIMIT 50', []);
  return r.results;
}
