import { env } from './env';

export type Book = 'dk' | 'fd' | 'betmgm' | 'caesars';

export const BOOK_NAMES: Record<Book, string> = {
  dk: 'DraftKings',
  fd: 'FanDuel',
  betmgm: 'BetMGM',
  caesars: 'Caesars',
};

const FALLBACK: Record<Book, string> = {
  dk: 'https://sportsbook.draftkings.com',
  fd: 'https://sportsbook.fanduel.com',
  betmgm: 'https://sports.betmgm.com',
  caesars: 'https://www.caesars.com/sportsbook-and-casino',
};

export function affiliateUrl(book: Book): string {
  const e = env();
  switch (book) {
    case 'dk': return e.AFFILIATE_DK_URL || FALLBACK.dk;
    case 'fd': return e.AFFILIATE_FD_URL || FALLBACK.fd;
    case 'betmgm': return e.AFFILIATE_BETMGM_URL || FALLBACK.betmgm;
    case 'caesars': return e.AFFILIATE_CAESARS_URL || FALLBACK.caesars;
  }
}

export function isValidBook(b: string): b is Book {
  return b === 'dk' || b === 'fd' || b === 'betmgm' || b === 'caesars';
}
