import express from 'express';
import dotenv from 'dotenv';
import path from 'node:path';
import { createLibrary } from './library.js';

dotenv.config({ path: '.env.local' });
const { MOVIE_FOLDER, TMDB_TOKEN } = process.env;
if (!MOVIE_FOLDER || !TMDB_TOKEN) throw new Error('MOVIE_FOLDER and TMDB_TOKEN are required in .env.local');
const library = createLibrary({ movieFolder: MOVIE_FOLDER, tmdbToken: TMDB_TOKEN, cacheFile: path.resolve('movie-cache.json') });
const app = express();
app.get('/api/movies', async (_req, res) => {
 try { res.json(await library.loadMovies()); }
 catch (error) { console.error(error); res.status(500).json({ error: 'Could not load movies' }); }
});
app.get('/api/movies/:id', async (req, res) => {
 try { res.json(await library.loadDetails(Number(req.params.id))); }
 catch (error) { console.error(error); res.status(500).json({ error: 'Could not load movie details' }); }
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


app.listen(3001, () => console.log('Movie server running at http://localhost:3001'));
