# Movie Library

A personal Windows desktop movie browser built with Electron, React, and TypeScript. It reads movie folders on your PC and uses TMDB for posters and metadata. It does not modify or move your movies.

## Using the app

Open **Movie Library** from the desktop shortcut. The app runs in its own window; closing the window closes the app. No browser or separate server is needed.

Choose your movie folder and enter your TMDB **API read access token** once in Settings. Both are saved for future launches. Folder names such as `The Matrix (1999)` produce the best matches. The library supports title/year search, title/year/rating sorting, refresh, details, and IMDb links.

Settings and per-folder metadata caches live in `%APPDATA%\Movie Library`. The token is encrypted using Windows-backed Electron safe storage. Changing or rebuilding the project does not erase these files. Online posters and fresh TMDB metadata require an internet connection.

The desktop shortcut points to `release/win-unpacked/Movie Library.exe`; keep the entire `win-unpacked` folder. Alternatively, use the installer in `release`, which creates desktop and Start menu shortcuts. The app is unsigned.

## Development

- `npm install`: install dependencies.
- `npm run dev`: build and launch Electron.
- `npm start`: open the existing build.
- `npm run build`: clean generated output, check TypeScript, build the interface and desktop code.
- `npm run package`: build the Windows installer.
- `npm run package:dir`: build the unpacked Windows app.
- `npm run verify:desktop`: run a hidden check against saved settings; output goes to `release/checks`.
- `npm test`: check scanning, caching, and TMDB metadata with isolated fixtures.
- `npm run lint`: check source code.
- `npm run build:icon`: rebuild the Windows icon from the approved PNG.

The packaged app is self-contained and does not require Node.js or this source checkout's dependencies.

## Project structure

```text
desktop/
  main.ts                 Window, saved settings, secure desktop handlers
  preload.cjs             Restricted API exposed to React
  services/library.ts     Folder scanning, TMDB metadata, caching
src/
  App.tsx                 Library interface
  components/             Reusable interface components
  lib/                    Calls to the desktop API
  types/                  Desktop API declaration for the interface
  App.css, index.css      Styles
shared/                   Movie and desktop API types
resources/                Approved app icon and generation prompt
scripts/                  Build cleanup and Windows icon conversion
tests/                    Movie-service regression tests
```

Vite builds the React interface; it is not a separate production web server. Electron uses context isolation and a sandboxed renderer with no renderer Node access. Only supported IMDb title links open externally. Tokens stay in the main process. Concurrent scans share one request.

`dist`, `dist-desktop`, `release`, and `node_modules` are generated and excluded from Git. Build cleanup only removes `dist` and `dist-desktop`, not packaged apps or saved user data.

## Original browser version

The original working version remains on `main` at commit `8b09fb1`. Old `.env.local` and `movie-cache.json` are preserved in the ignored `.local-backup` directory. To restore the original workflow, save further work, switch to `main`, restore those two local files to the project root, and install that branch's dependencies. The active Electron settings and cache remain separate in your Windows profile.

## Next improvements

See `docs/next-steps.md` for the CSS review and proposed movie-browsing features.
