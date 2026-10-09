# Interface review and next steps

The current layout works well for a small personal library. This review follows the Electron cleanup and approved icon; the visual redesign and new browsing features have not been applied yet.

## CSS improvements

1. Make the header wrap around 1000 pixels. Its responsive rules currently start at 650 pixels, below the app's 700-pixel minimum width, so the title and toolbar can crowd at practical narrow sizes.
2. Replace the title's dark red end with a readable cyan/teal accent consistent with the approved icon. Use CSS custom properties for text, surfaces, borders, and accent colors.
3. Fix the unmatched status color: `.movie-info p` is more specific than `.not-found`, so the warning color gets overridden. Target `.movie-info .not-found`.
4. Consolidate duplicate `.movie-card` rules and repeated breakpoint blocks. This reduces accidental overrides as the interface grows.
5. Add visible keyboard focus to all controls and keyboard-accessible movie cards. The current clickable articles cannot be reached or activated as buttons through the keyboard.
6. Respect reduced-motion preferences, add long-title wrapping, and consider a dark scrollbar/color scheme for the desktop window.
7. Use a poster-focused compact card view, with descriptions in the details window, if the user prefers to see more movies at once. Keep this as a choice rather than remove useful information.

## Functional improvements, in recommended order

1. **Open movie folder** from the details window, including unmatched movies. This is directly useful for the user's goal of browsing local movies.
2. **Play movie** in the Windows default player. Identify video files inside each movie folder and allow choosing one when there are multiple; do not assume the first file is the movie.
3. **Watched/unwatched and favorites**, saved locally, with filters. This helps pick a movie rather than just inventory the library.
4. **Correct a wrong TMDB match** and retry unmatched movies. The current service always chooses the first search result and retains failed matches in cache.
5. **Better refresh behavior**: keep the existing grid visible while rescanning, show any failure clearly, and keep the user's sort choice between launches.
6. **Offline details/posters**: cache full details and downloaded posters so the existing collection stays pleasant to browse without internet.

Additional reliability work: show details-fetch errors in the interface instead of only the console; support Escape and focus management in the movie popup; limit TMDB request concurrency and use request timeouts for larger libraries. These can be addressed with the corresponding UI or matching feature rather than bundle them into the structure cleanup.
