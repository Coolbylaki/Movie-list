import { useEffect, useState } from "react";
import "./App.css";

type Movie = {
	folderName: string;
	title: string;
	year: number | null;
	overview?: string;
	rating?: number;
	posterPath?: string | null;
	tmdbId?: number;
	matched: boolean;
};

function App() {
	const [movies, setMovies] = useState<Movie[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		async function loadMovies() {
			try {
				const response = await fetch("/api/movies");

				if (!response.ok) {
					throw new Error("Failed to load movies");
				}

				const data: Movie[] = await response.json();
				setMovies(data);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Something went wrong");
			} finally {
				setLoading(false);
			}
		}

		loadMovies();
	}, []);

	if (loading) {
		return <div className="app">Loading movies...</div>;
	}

	if (error) {
		return <div className="app">Error: {error}</div>;
	}

	return (
		<div className="app">
			<header className="header">
				<div>
					<h1>My Movie Library</h1>
					<p>{movies.length} movies</p>
				</div>
			</header>

			<main className="movie-grid">
				{movies.map((movie) => (
					<article className="movie-card" key={movie.folderName}>
						{movie.posterPath ? (
							<img
								className="poster"
								src={`https://image.tmdb.org/t/p/w500${movie.posterPath}`}
								alt={movie.title}
							/>
						) : (
							<div className="poster-placeholder">
								<span>🎬</span>
							</div>
						)}

						<div className="movie-info">
							<h2>{movie.title}</h2>

							<div className="movie-meta">
								<span>{movie.year ?? "Unknown year"}</span>

								{movie.rating !== undefined && <span>⭐ {movie.rating.toFixed(1)}</span>}
							</div>

							{movie.overview && <p className="overview">{movie.overview}</p>}

							{!movie.matched && <p className="not-found">Movie not found</p>}
						</div>
					</article>
				))}
			</main>
		</div>
	);
}

export default App;
