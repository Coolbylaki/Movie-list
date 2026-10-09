# Movie Library

A personal Windows movie browser built with React, TypeScript, and Electron. It reads movie folders on your PC and uses TMDB for posters and metadata. It does not move or modify movie files.

## Desktop use

Launch **Movie Library** from your desktop shortcut. No terminal, browser tab, or separately running server is needed. Closing the window closes the app.

Use **Settings** to select the folder containing your movie folders and configure a TMDB **API read access token**. Folder names such as `The Matrix (1999)` produce the best matches. Search, sorting, refresh, movie details, and IMDb links work as in the browser version.

Settings and metadata live in `%APPDATA%\Movie Library`. The token is encrypted using Windows-backed Electron safe storage. Each library folder gets its own cache. Posters and uncached metadata need an internet connection.

A first development launch imports `.env.local` and `movie-cache.json` once. Neither file is included in the installer. An installation on another PC asks for its own folder and token.

The local shortcut can point to `release/win-unpacked/Movie Library.exe`; keep the whole `win-unpacked` folder together. For a regular installation, run `release/Movie Library Setup 0.1.0.exe`. The installer creates desktop and Start menu shortcuts. The app is unsigned.

## Development

- `npm install` — install dependencies.
- `npm run desktop` — build and open the desktop app.
- `npm run dev` — retain the original Vite + Express browser workflow.
- `npm run dist:desktop` — build the Windows installer.
- `npm run pack:desktop` — build the unpacked Windows app.
- `npm test` — verify movie scanning, caching, and TMDB metadata with isolated fixtures.
- `npm run lint` — check source code.

## Structure

- `desktop/main.ts`: Electron window, settings, folder picker, and restricted IPC handlers.
- `desktop/preload.cjs`: narrow desktop API exposed to React.
- `server/library.ts`: shared scanning, TMDB matching, and cache services.
- `server/index.ts`: Express adapter for the existing browser version.
- `shared/movies.ts`: shared movie types.
- `src/`: React interface and desktop settings.

Electron uses a sandboxed renderer with context isolation and no renderer Node access. Only IMDb title links can open externally. Credentials stay in the main process. Concurrent scans share one request to avoid overlapping cache writes.

## Restore the original version

The working browser version is preserved on `main` at commit `8b09fb1`. Electron changes are on `codex/electron-desktop`. After saving any further work, switch to `main` and use the original launcher. Local `.env.local`, the original cache, and movie files are preserved.
