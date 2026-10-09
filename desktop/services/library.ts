import fs from 'node:fs/promises';
import type { Movie, MovieDetails } from '../../shared/movies.js';
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
        await fs.writeFile(options.cacheFile, JSON.stringify(movies, null, 2), "utf-8");
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
        const movies = await Promise.all(parsedMovies.map(async (movie) => {
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
        }));
        movies.sort((a, b) => a.title.localeCompare(b.title));
        await writeCache(movies);
        return movies;
    }
    async function loadDetails(id: number): Promise<MovieDetails> {
        if (!Number.isSafeInteger(id) || id <= 0)
            throw new Error('Invalid movie ID');
        const response = await fetch(`https://api.themoviedb.org/3/movie/${id}?append_to_response=external_ids`, {
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
    return { loadMovies, loadDetails };
}
