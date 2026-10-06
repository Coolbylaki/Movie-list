import express from "express";
import fs from "node:fs/promises";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const app = express();
const PORT = 3001;

const MOVIE_FOLDER = process.env.MOVIE_FOLDER;

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

		const movies = entries
			.filter((entry) => entry.isDirectory())
			.map((entry) => parseMovieName(entry.name))
			.sort((a, b) => a.title.localeCompare(b.title));

		res.json(movies);
	} catch (error) {
		console.error(error);

		res.status(500).json({
			error: "Could not read movie folder",
		});
	}
});

app.listen(PORT, () => {
	console.log(`Movie server running at http://localhost:${PORT}`);
});
