import type { Movie, MovieDetails } from '../shared/movies';

export type DesktopSettings = { movieFolder: string; hasToken: boolean };
export type DesktopApi = {
  loadMovies(): Promise<Movie[]>;
  loadDetails(id: number): Promise<MovieDetails>;
  getSettings(): Promise<DesktopSettings>;
  saveSettings(settings: { movieFolder: string; tmdbToken: string }): Promise<void>;
  chooseFolder(): Promise<string | null>;
};
declare global { interface Window { desktop?: DesktopApi } }
async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Could not load movies. Check the backend and try again.');
  return response.json();
}
export const movieApi = {
  loadMovies: () => window.desktop ? window.desktop.loadMovies() : getJson<Movie[]>('/api/movies'),
  loadDetails: (id: number) => window.desktop ? window.desktop.loadDetails(id) : getJson<MovieDetails>(`/api/movies/${id}`),
};
