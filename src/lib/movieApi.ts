import type { DesktopApi } from '../../shared/desktop';
function desktopApi(): DesktopApi {
  if (!window.desktop) throw new Error('Please open Movie Library from the desktop app.');
  return window.desktop;
}
export const movieApi = {
  loadMovies: async () => desktopApi().loadMovies(),
  loadDetails: async (id: number) => desktopApi().loadDetails(id),
  searchMatches: async (query: string, year?: number) => desktopApi().searchMatches(query, year),
  correctMatch: async (folderName: string, id: number) => desktopApi().correctMatch(folderName, id),
  openMovieFolder: async (folderName: string) => desktopApi().openMovieFolder(folderName),
  listMovieVideos: async (folderName: string) => desktopApi().listMovieVideos(folderName),
  playMovieVideo: async (folderName: string, relativePath: string) => desktopApi().playMovieVideo(folderName, relativePath),
};
