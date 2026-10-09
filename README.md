# Movie Library

Browse your local movie collection in a Windows desktop app, with posters, descriptions, ratings, and movie details from TMDB. Movie Library reads your folders without moving or changing your movies.

## Install and launch

Use **Movie Library Setup 0.1.0.exe** from the built `release` folder to install the app. The installer creates desktop and Start menu shortcuts and provides a Windows uninstaller. The app includes everything it needs; you do not need Node.js, a browser, or a separate server.

If someone shares the app with you, ask for the installer. Build files are not currently published as GitHub release downloads. The app is unsigned, so Windows may show a publisher warning.

You can also run **Movie Library.exe** from `release/win-unpacked`. Keep that entire folder together. This is useful while testing updates; the current development desktop shortcut launches this copy. Installing provides a normal installation location, but the features are the same.

## First-time setup

1. Open **Movie Library** and go to **Library settings**.
2. Choose the folder containing your movie folders. Each movie should have its own immediate subfolder; names such as `The Matrix (1999)` help matching. Nested collections and loose video files in the library root are not scanned.
3. Enter your own TMDB **API read access token**, available in your TMDB account's API settings.
4. Select **Save and load library**.

Your folder and token are remembered between launches. Anyone you share the app with needs to choose their own library and enter their own token. Your personal settings are not included in the installer.

## Browse your movies

- Search by title or year, and sort by title, newest year, or highest rating.
- Combine genre, year, and minimum-rating filters to narrow your collection. **Clear filters** resets the filters while keeping your search. Unknown genre/year options let you find movies with missing metadata.
- Select a movie to see its description, runtime, genres, and rating when available.
- Select **Open movie folder** in the details window to open its local folder in Windows File Explorer. This also works for unmatched movies.
- Select **Play movie** to open a video in your Windows default player, such as VLC. If multiple videos are found, choose a file and select **Play selected video**. Video files in subfolders are included; subtitles and other non-video files are ignored.
- Select **Open IMDb** when a link is available.
- Use **Refresh** after adding or removing movie folders. Cached matches are reused.
- Use **Library settings** to change the library folder or replace the token.

Closing the window exits the app. It runs locally on your PC; the PC needs to be on to use it. Internet access is needed for TMDB lookups and online poster images.

Manual match correction and remembered browsing preferences are planned and are not available yet.

The first launch after adding genre filters fills in genre information for existing matches. These genres are cached for future launches. If a lookup fails, the movie remains available under **All genres** or **Unknown genre**; refresh to retry.

## Settings and troubleshooting

Settings and metadata caches are stored in `%APPDATA%\Movie Library`. The TMDB token is encrypted using Windows-backed Electron secure storage. Rebuilding the app or switching from the unpacked version to an installation on the same Windows account preserves these settings.

If a movie is missing, check that it has its own subfolder directly inside the selected library, then refresh. If a folder cannot be opened, check that the drive is connected and the folder still exists. If metadata cannot load, check your internet connection and TMDB token. A wrong movie match cannot currently be corrected in the interface.

Updates are manual: install a newly built installer or replace the complete unpacked app folder. There is no automatic updater.

If playback opens a different player, set VLC as the default Windows app for the relevant video file type. Movie Library follows your Windows file associations; it does not change them. Supported extensions: MKV, MP4, AVI, MOV, M4V, WEBM, WMV, MPG, MPEG, TS, M2TS, FLV, OGV, and VOB.

## Development

The app uses Electron, React, and TypeScript. Source code is maintained on `main`.

- `npm install`: install dependencies.
- `npm run dev`: build and launch Electron.
- `npm start`: launch the existing build.
- `npm run build`: check TypeScript and build the interface and desktop code.
- `npm run package`: build the Windows installer.
- `npm run package:dir`: build the unpacked Windows app.
- `npm test`: check scanning, caching, matching, and local folder access.
- `npm run lint`: check source code.
- `npm run verify:desktop`: run a hidden check using saved settings; results go to `release/checks`.
- `npm run build:icon`: rebuild the Windows icon from the approved PNG.

```text
desktop/       Electron window, settings, local folder access, and TMDB services
src/           React interface, components, and styles
shared/        Movie and desktop API types
resources/     App icon assets
scripts/       Build utilities
tests/         Service regression tests
docs/          Agreed feature roadmap
```

The renderer is sandboxed, with context isolation and no direct Node.js access. Desktop actions use a restricted preload API; tokens stay in the main process.

`dist`, `dist-desktop`, `release`, and `node_modules` are generated and excluded from Git. The ignored `.local-backup` contains legacy browser-version data retained only on the development PC; it is not used or packaged. Build cleanup preserves packaged apps and saved user settings.
