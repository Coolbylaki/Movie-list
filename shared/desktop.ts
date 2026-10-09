import type { Movie, MovieDetails } from './movies.js';

export type LibrarySettings = { movieFolder: string; hasToken: boolean };
export type SettingsInput = { movieFolder: string; tmdbToken: string };
export type DesktopApi = {
  loadMovies(): Promise<Movie[]>;
  loadDetails(id: number): Promise<MovieDetails>;
  getSettings(): Promise<LibrarySettings>;
  saveSettings(settings: SettingsInput): Promise<void>;
  chooseFolder(): Promise<string | null>;
};
