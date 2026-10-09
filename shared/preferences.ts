export type BrowsingPreferences = {
  sortBy: 'title' | 'year' | 'rating';
  genre: string;
  year: string;
  minimumRating: string;
};

export const defaultBrowsingPreferences: BrowsingPreferences = { sortBy: 'title', genre: '', year: '', minimumRating: '' };

export function normalizeBrowsingPreferences(value: unknown): BrowsingPreferences {
  const input = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const validYear = typeof input.year === 'string' && (input.year === '__unknown__' || (/^\d{4}$/.test(input.year) && Number(input.year) >= 1888 && Number(input.year) <= 2100));
  return {
    sortBy: input.sortBy === 'year' || input.sortBy === 'rating' ? input.sortBy : 'title',
    genre: typeof input.genre === 'string' && input.genre.length <= 100 ? input.genre.trim() : '',
    year: validYear ? input.year as string : '',
    minimumRating: typeof input.minimumRating === 'string' && ['5', '6', '7', '8', '9'].includes(input.minimumRating) ? input.minimumRating : '',
  };
}
