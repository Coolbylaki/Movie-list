import type { Movie, MovieDetails, MovieMatch, SavedMovieMatch } from './movies.js';

export type LibrarySettings = { movieFolder: string; hasToken: boolean };
export type SettingsInput = { movieFolder: string; tmdbToken: string };
export type MovieVideo = { relativePath: string; size: number };
export type DesktopApi = {
  loadMovies(): Promise<Movie[]>;
  loadDetails(id: number): Promise<MovieDetails>;
  searchMatches(query: string, year?: number): Promise<MovieMatch[]>;
  correctMatch(folderName: string, id: number): Promise<SavedMovieMatch>;
  openMovieFolder(folderName: string): Promise<void>;
  listMovieVideos(folderName: string): Promise<MovieVideo[]>;
  playMovieVideo(folderName: string, relativePath: string): Promise<void>;
  getSettings(): Promise<LibrarySettings>;
  saveSettings(settings: SettingsInput): Promise<void>;
  chooseFolder(): Promise<string | null>;
};
