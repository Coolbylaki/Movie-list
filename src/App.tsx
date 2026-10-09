import { useEffect, useState } from "react";
import "./App.css";

import type { Movie, MovieDetails } from '../shared/movies';
import { movieApi } from './movieApi';
import DesktopSettings from './DesktopSettings';

function App() {
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [movies, setMovies] = useState<Movie[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [selectedMovie, setSelectedMovie] = useState<MovieDetails | null>(null);
	const [detailsLoading, setDetailsLoading] = useState(false);
	const [search, setSearch] = useState("");
	const [sortBy, setSortBy] = useState<"title" | "year" | "rating">("title");

	async function openMovie(movie: Movie) {
		if (!movie.tmdbId) {
			return;
		}

		try {
			setDetailsLoading(true);

			const data = await movieApi.loadDetails(movie.tmdbId);

			setSelectedMovie(data);
		} catch (error) {
			console.error(error);
		} finally {
			setDetailsLoading(false);
		}
	}

	async function refreshLibrary() {
		setLoading(true);
		setError("");

		try {
			const data = await movieApi.loadMovies();

			setMovies(data);
		} catch (error) {
			setError(error instanceof Error ? error.message : "Could not refresh library");
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		async function loadMovies() {
			try {
				const data = await movieApi.loadMovies();
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
		return <div className="app"><p role="alert">{error}</p>{window.desktop && <DesktopSettings onSaved={() => { setSettingsOpen(false); void refreshLibrary(); }} />}<button className="refresh-button" onClick={refreshLibrary}>Retry</button></div>;
	}

	const filteredMovies = movies
		.filter((movie) => {
			const query = search.toLowerCase().trim();

			if (!query) {
				return true;
			}

			return (
				movie.title.toLowerCase().includes(query) ||
				movie.year?.toString().includes(query)
			);
		})
		.sort((a, b) => {
			if (sortBy === "year") {
				return (b.year ?? 0) - (a.year ?? 0);
			}

			if (sortBy === "rating") {
				return (b.rating ?? 0) - (a.rating ?? 0);
			}

			return a.title.localeCompare(b.title);
		});

	return (
		<div className="app">
			<header className="header">
				<div>
					<h1>My Movie Library</h1>
					<p>
						{filteredMovies.length} of {movies.length} movies
					</p>
				</div>

				<div className="header-actions">
 {window.desktop && <button className="refresh-button" onClick={() => setSettingsOpen(true)}>Settings</button>}
					<input
						className="search-input"
						type="text"
						placeholder="Search movies..."
						value={search}
						onChange={(event) => setSearch(event.target.value)}
					/>

					<select
						className="sort-select"
						value={sortBy}
						onChange={(event) =>
							setSortBy(event.target.value as "title" | "year" | "rating")
						}>
						<option value="title">Title</option>
						<option value="year">Newest</option>
						<option value="rating">Rating</option>
					</select>

					<button className="refresh-button" onClick={refreshLibrary}>
						Refresh Library
					</button>
				</div>
			</header>

			{settingsOpen && <DesktopSettings onSaved={() => { setSettingsOpen(false); void refreshLibrary(); }} onClose={() => setSettingsOpen(false)} />}
 <main className="movie-grid">
				{filteredMovies.map((movie) => (
					<article
						className="movie-card"
						key={movie.folderName}
						onClick={() => openMovie(movie)}>
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

			{detailsLoading && (
				<div className="modal-backdrop">
					<div className="modal">
						<p>Loading...</p>
					</div>
				</div>
			)}

			{selectedMovie && !detailsLoading && (
				<div className="modal-backdrop" onClick={() => setSelectedMovie(null)}>
					<div className="modal" onClick={(event) => event.stopPropagation()}>
						<button className="close-button" onClick={() => setSelectedMovie(null)}>
							×
						</button>

						{selectedMovie.backdropPath && (
							<img
								className="modal-backdrop-image"
								src={`https://image.tmdb.org/t/p/w1280${selectedMovie.backdropPath}`}
								alt=""
							/>
						)}

						<div className="modal-content">
							{selectedMovie.posterPath && (
								<img
									className="modal-poster"
									src={`https://image.tmdb.org/t/p/w500${selectedMovie.posterPath}`}
									alt={selectedMovie.title}
								/>
							)}

							<div className="modal-info">
								<h2>
									{selectedMovie.title}
									{selectedMovie.year && ` (${selectedMovie.year})`}
								</h2>

								<div className="details-meta">
									<span>⭐ {selectedMovie.rating.toFixed(1)}</span>

									{selectedMovie.runtime && <span>{selectedMovie.runtime} min</span>}
								</div>

								<div className="genres">
									{selectedMovie.genres.map((genre) => (
										<span key={genre}>{genre}</span>
									))}
								</div>

								<p className="full-overview">
									{selectedMovie.overview || "No description available."}
								</p>

								{selectedMovie.imdbId && (
									<a
										className="imdb-button"
										href={`https://www.imdb.com/title/${selectedMovie.imdbId}/`}
										target="_blank"
										rel="noreferrer">
										Open IMDb
									</a>
								)}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default App;
