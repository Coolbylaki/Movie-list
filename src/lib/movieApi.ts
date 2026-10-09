import type { DesktopApi } from '../../shared/desktop';
function desktopApi(): DesktopApi {
  if (!window.desktop) throw new Error('Please open Movie Library from the desktop app.');
  return window.desktop;
}
export const movieApi = {
  loadMovies: async () => desktopApi().loadMovies(),
  loadDetails: async (id: number) => desktopApi().loadDetails(id),
};
