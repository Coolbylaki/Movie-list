import express from "express";
import fs from "node:fs/promises";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const app = express();
const PORT = 3001;

const MOVIE_FOLDER = process.env.MOVIE_FOLDER;

const TMDB_TOKEN = process.env.TMDB_TOKEN;

if (!TMDB_TOKEN) {
	throw new Error("TMDB_TOKEN is missing from .env.local");
}

if (!MOVIE_FOLDER) {
	throw new Error("MOVIE_FOLDER is missing from .env.local");
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

app.get("/api/movies", async (_req, res) => {
	try {
		const entries = await fs.readdir(MOVIE_FOLDER, {
			withFileTypes: true,
		});

		const parsedMovies = entries
			.filter((entry) => entry.isDirectory())
			.map((entry) => parseMovieName(entry.name));

		const movies = await Promise.all(
			parsedMovies.map(async (movie) => {
				const params = new URLSearchParams({
					query: movie.title,
				});

				if (movie.year) {
					params.set("year", movie.year.toString());
				}

				const response = await fetch(
					`https://api.themoviedb.org/3/search/movie?${params.toString()}`,
					{
						headers: {
							Authorization: `Bearer ${TMDB_TOKEN}`,
							Accept: "application/json",
						},
					},
				);

				if (!response.ok) {
					return {
						...movie,
						matched: false,
					};
				}

				const data = await response.json();
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
			}),
		);

		movies.sort((a, b) => a.title.localeCompare(b.title));

		res.json(movies);
	} catch (error) {
		console.error(error);

		res.status(500).json({
			error: "Could not load movies",
		});
	}
});

app.get("/api/test-tmdb", async (_req, res) => {
	try {
		const response = await fetch(
			"https://api.themoviedb.org/3/search/movie?query=The%20Matrix&year=1999",
			{
				headers: {
					Authorization: `Bearer ${TMDB_TOKEN}`,
					Accept: "application/json",
				},
			},
		);

		if (!response.ok) {
			throw new Error(`TMDB returned ${response.status}`);
		}

		const data = await response.json();

		res.json(data);
	} catch (error) {
		console.error(error);

		res.status(500).json({
			error: "Could not connect to TMDB",
		});
	}
});

app.listen(PORT, () => {
	console.log(`Movie server running at http://localhost:${PORT}`);
});
