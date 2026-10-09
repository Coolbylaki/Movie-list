import type { Movie, MovieDetails } from './movies.js';

export type LibrarySettings = { movieFolder: string; hasToken: boolean };
export type SettingsInput = { movieFolder: string; tmdbToken: string };
export type MovieVideo = { relativePath: string; size: number };
export type DesktopApi = {
  loadMovies(): Promise<Movie[]>;
  loadDetails(id: number): Promise<MovieDetails>;
  openMovieFolder(folderName: string): Promise<void>;
  listMovieVideos(folderName: string): Promise<MovieVideo[]>;
  playMovieVideo(folderName: string, relativePath: string): Promise<void>;
  getSettings(): Promise<LibrarySettings>;
  saveSettings(settings: SettingsInput): Promise<void>;
  chooseFolder(): Promise<string | null>;
};
