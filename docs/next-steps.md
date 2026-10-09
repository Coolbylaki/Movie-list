# Interface review and next steps

The current layout works well for a small personal library. This review follows the Electron cleanup, approved icon, and interface refresh. New local-playback and library-management features remain future work.

## Interface improvements applied

The Electron interface now uses a consistent dark palette with teal accents, the approved app icon, clearer Segoe UI typography, and a separate responsive toolbar. Movie cards have consistent spacing, clamped descriptions, readable status colors, real keyboard-accessible buttons, and a poster fallback.

Settings and movie details use native modal dialogs with a close button, backdrop dismissal, Escape/cancel behavior, keyboard focus containment, and focus return to the opener. Search has clear and empty-result states. Refresh leaves the current grid visible; errors are shown in the interface. Reduced-motion preferences are respected.

Visual checks covered 720-, 1040-, and 1440-pixel widths, saved-settings display, search results, and movie details. A compact poster-only view remains an optional future choice.

## Functional improvements, in recommended order

1. **Open movie folder** from the details window, including unmatched movies. This is directly useful for the user's goal of browsing local movies.
2. **Play movie** in the Windows default player. Identify video files inside each movie folder and allow choosing one when there are multiple; do not assume the first file is the movie.
3. **Watched/unwatched and favorites**, saved locally, with filters. This helps pick a movie rather than just inventory the library.
4. **Correct a wrong TMDB match** and retry unmatched movies. The current service always chooses the first search result and retains failed matches in cache.
5. **Remember the sort choice between launches**. The interface now keeps the grid visible while refreshing and displays any failure.
6. **Offline details/posters**: cache full details and downloaded posters so the existing collection stays pleasant to browse without internet.

Additional reliability work: limit TMDB request concurrency and use request timeouts for larger libraries. Details-fetch errors, dialog cancellation, and focus management have been addressed in the interface refresh.
