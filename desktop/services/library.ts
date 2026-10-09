import fs from 'node:fs/promises';
import type { Movie, MovieDetails, MovieMatch, SavedMovieMatch } from '../../shared/movies.js';
import { resolveMovieFolder } from './local-files.js';
export type LibraryOptions = {
    movieFolder: string;
    tmdbToken: string;
    cacheFile: string;
};
type TmdbMovie = {
    id: number;
    title: string;
    release_date?: string;
    overview: string;
    vote_average: number;
    poster_path: string | null;
    backdrop_path: string | null;
    runtime: number | null;
    genres?: {
        name: string;
    }[];
    external_ids?: {
        imdb_id?: string;
    };
};
export function createLibrary(options: LibraryOptions) {
    async function readCache(): Promise<Movie[]> {
        try {
            const data = await fs.readFile(options.cacheFile, "utf-8");
            return JSON.parse(data);
        }
        catch {
            return [];
        }
    }
    async function writeCache(movies: Movie[]) {
        await fs.writeFile(`${options.cacheFile}.tmp`, JSON.stringify(movies, null, 2), "utf-8");
        await fs.rename(`${options.cacheFile}.tmp`, options.cacheFile);
    }
    function parseMovieName(folderName: string) {
        const match = folderName.match(/^(.*?)\s*\((\d{4})\)/);
        if (!match) {
            return {
                folderName,
                title: folderName,
                year: null,
            };
        }
        return {
            folderName,
            title: match[1].trim(),
            year: Number(match[2]),
        };
    }
    async function loadMovies(): Promise<Movie[]> {
        const entries = await fs.readdir(options.movieFolder, {
            withFileTypes: true,
        });
        const parsedMovies = entries
            .filter((entry) => entry.isDirectory())
            .map((entry) => parseMovieName(entry.name));
        const cache = await readCache();
        async function matchMovie(movie: (typeof parsedMovies)[number]): Promise<Movie> {
            const cachedMovie = cache.find((item) => item.folderName === movie.folderName);
            if (cachedMovie) {
                return cachedMovie;
            }
            const params = new URLSearchParams({
                query: movie.title,
            });
            if (movie.year) {
                params.set("year", movie.year.toString());
            }
            const response = await fetch(`https://api.themoviedb.org/3/search/movie?${params.toString()}`, {
                signal: AbortSignal.timeout(10000),
                headers: {
                    Authorization: `Bearer ${options.tmdbToken}`,
                    Accept: "application/json",
                },
            });
            if (!response.ok) {
                return {
                    ...movie,
                    matched: false,
                };
            }
            const data = await response.json() as {
                results?: TmdbMovie[];
            };
            const match = data.results?.[0];
            if (!match) {
                return {
                    ...movie,
                    matched: false,
                };
            }
            return {
                folderName: movie.folderName,
                title: match.title,
                year: match.release_date ? Number(match.release_date.slice(0, 4)) : movie.year,
                overview: match.overview,
                rating: match.vote_average,
                posterPath: match.poster_path,
                tmdbId: match.id,
                matched: true,
            };
        }
        const movies: Movie[] = new Array(parsedMovies.length);
        let nextIndex = 0;
        async function worker() {
            while (nextIndex < parsedMovies.length) {
                const index = nextIndex++;
                const movie = await matchMovie(parsedMovies[index]);
                if (movie.matched && movie.tmdbId && !Array.isArray(movie.genres)) {
                    try { movie.genres = (await loadDetails(movie.tmdbId)).genres; }
                    catch { /* Keep the saved match usable; retry missing genres on the next refresh. */ }
                }
                movies[index] = movie;
            }
        }
        await Promise.all(Array.from({ length: Math.min(4, parsedMovies.length) }, () => worker()));
        movies.sort((a, b) => a.title.localeCompare(b.title));
        await writeCache(movies);
        return movies;
    }
    async function loadDetails(id: number): Promise<MovieDetails> {
        if (!Number.isSafeInteger(id) || id <= 0)
            throw new Error('Invalid movie ID');
        const response = await fetch(`https://api.themoviedb.org/3/movie/${id}?append_to_response=external_ids`, {
            signal: AbortSignal.timeout(10000),
            headers: {
                Authorization: `Bearer ${options.tmdbToken}`,
                Accept: "application/json",
            },
        });
        if (!response.ok) {
            throw new Error(`TMDB returned ${response.status}`);
        }
        const data = await response.json() as TmdbMovie;
        return {
            id: data.id,
            title: data.title,
            year: data.release_date ? Number(data.release_date.slice(0, 4)) : null,
            overview: data.overview,
            rating: data.vote_average,
            runtime: data.runtime,
            genres: data.genres?.map((genre: {
                name: string;
            }) => genre.name) ?? [],
            posterPath: data.poster_path,
            backdropPath: data.backdrop_path,
            imdbId: data.external_ids?.imdb_id ?? null,
        };
    }
    async function searchMatches(query: string, year?: number): Promise<MovieMatch[]> {
        if (typeof query !== 'string' || !query.trim() || query.length > 200) throw new Error('Enter a movie title (up to 200 characters).');
        if (year !== undefined && (!Number.isInteger(year) || year < 1888 || year > 2100)) throw new Error('Enter a year between 1888 and 2100, or leave it blank.');
        const params = new URLSearchParams({ query: query.trim() });
        if (year !== undefined) params.set('year', String(year));
        const response = await fetch(`https://api.themoviedb.org/3/search/movie?${params}`, {
            signal: AbortSignal.timeout(10000),
            headers: { Authorization: `Bearer ${options.tmdbToken}`, Accept: 'application/json' },
        });
        if (!response.ok) throw new Error('Could not search TMDB. Check your connection and token, then try again.');
        const data = await response.json() as { results?: TmdbMovie[] };
        return (data.results ?? []).filter(movie => Number.isSafeInteger(movie.id) && movie.id > 0).map(movie => ({
            id: movie.id, title: movie.title, year: movie.release_date ? Number(movie.release_date.slice(0, 4)) : null,
            overview: movie.overview, posterPath: movie.poster_path,
        }));
    }
    async function correctMatch(folderName: string, id: number): Promise<SavedMovieMatch> {
        await resolveMovieFolder(options.movieFolder, folderName);
        const details = await loadDetails(id);
        if (details.id !== id || !details.title) throw new Error('TMDB returned an invalid movie. Try another result.');
        const movies = await readCache();
        const index = movies.findIndex(movie => movie.folderName === folderName);
        if (index === -1) throw new Error('This folder is no longer in the library. Refresh the library and try again.');
        const movie: Movie = {
            folderName, title: details.title, year: details.year, overview: details.overview,
            rating: details.rating, posterPath: details.posterPath, tmdbId: details.id,
            genres: details.genres, matched: true,
        };
        movies[index] = movie;
        movies.sort((a, b) => a.title.localeCompare(b.title));
        await writeCache(movies);
        return { movie, details };
    }
    return { loadMovies, loadDetails, searchMatches, correctMatch };
}
