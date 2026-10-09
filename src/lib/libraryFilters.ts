import type { Movie } from '../../shared/movies';

export type LibraryFilters = { genre: string; year: string; minimumRating: string };
export const emptyFilters: LibraryFilters = { genre: '', year: '', minimumRating: '' };

export function filterMovies(movies: Movie[], search: string, filters: LibraryFilters): Movie[] {
  const query = search.trim().toLowerCase();
  return movies.filter(movie => {
    if (query && !movie.title.toLowerCase().includes(query) && !movie.year?.toString().includes(query)) return false;
    if (filters.genre === '__unknown__' ? Boolean(movie.genres?.length) : filters.genre && !movie.genres?.includes(filters.genre)) return false;
    if (filters.year === '__unknown__' ? movie.year !== null : filters.year && movie.year !== Number(filters.year)) return false;
    if (filters.minimumRating && (movie.rating === undefined || movie.rating < Number(filters.minimumRating))) return false;
    return true;
  });
}
