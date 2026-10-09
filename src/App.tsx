import { useEffect, useRef, useState } from 'react';
import type { Movie, MovieDetails, SavedMovieMatch } from '../shared/movies';
import appIcon from '../resources/app.png';
import { movieApi } from './lib/movieApi';
import { emptyFilters, filterMovies, type LibraryFilters } from './lib/libraryFilters';
import LibrarySettings from './components/LibrarySettings';
import MovieCard from './components/MovieCard';
import MovieDialog from './components/MovieDialog';
import Icon from './components/Icon';
import './App.css';

function friendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
  return message.replace(/^Error invoking remote method '[^']+': (?:Error: )?/, '');
}

export default function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'year' | 'rating'>('title');
  const [filters, setFilters] = useState<LibraryFilters>(emptyFilters);
  const detailsRequest = useRef(0);
  const activeDialogFolder = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    movieApi.loadMovies().then(data => { if (active) setMovies(data); })
      .catch(err => { if (active) setError(friendlyError(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function refreshLibrary() {
    setRefreshing(true);
    setError('');
    try { setMovies(await movieApi.loadMovies()); }
    catch (err) { setError(friendlyError(err)); }
    finally { setRefreshing(false); }
  }

  async function openMovie(movie: Movie) {
    activeDialogFolder.current = movie.folderName;
    const request = ++detailsRequest.current;
    setSelectedMovie(movie);
    setDetails(null);
    setDetailsError('');
    setDetailsLoading(Boolean(movie.tmdbId));
    if (!movie.tmdbId) return;
    try {
      const data = await movieApi.loadDetails(movie.tmdbId);
      if (request === detailsRequest.current) setDetails(data);
    } catch {
      if (request === detailsRequest.current) setDetailsError('Could not load additional details. Check your connection and try again.');
    } finally {
      if (request === detailsRequest.current) setDetailsLoading(false);
    }
  }

  function closeMovie() {
    activeDialogFolder.current = null;
    ++detailsRequest.current;
    setSelectedMovie(null);
  }

  function applyMatch(result: SavedMovieMatch) {
    setMovies(movies => movies.map(movie => movie.folderName === result.movie.folderName ? result.movie : movie));
    if (activeDialogFolder.current !== result.movie.folderName) return;
    ++detailsRequest.current;
    setSelectedMovie(result.movie);
    setDetails(result.details);
    setDetailsLoading(false);
    setDetailsError('');
  }

  const query = search.trim().toLowerCase();
  const hasFilters = Object.values(filters).some(Boolean);
  const narrowed = Boolean(query) || hasFilters;
  const genres = [...new Set(movies.flatMap(movie => movie.genres ?? []))].sort((a, b) => a.localeCompare(b));
  const years = [...new Set(movies.flatMap(movie => movie.year === null ? [] : [movie.year]))].sort((a, b) => b - a);
  function clearBrowsing() { setSearch(''); setFilters(emptyFilters); }
  const filteredMovies = filterMovies(movies, search, filters)
    .sort((a, b) => sortBy === 'year' ? (b.year ?? 0) - (a.year ?? 0)
      : sortBy === 'rating' ? (b.rating ?? 0) - (a.rating ?? 0) : a.title.localeCompare(b.title));

  return <div className="app">
    <header className="header">
      <div className="brand">
        <img className="brand-icon" src={appIcon} alt="" />
        <div><h1>Movie Library</h1><p>Your movies, all in one place.</p></div>
      </div>
      <button className="button button-quiet" onClick={() => setSettingsOpen(true)}><Icon name="settings" />Settings</button>
    </header>

    <div className="toolbar" aria-label="Library controls">
      <div className="search-field">
        <Icon name="search" />
        <input className="search-input" type="search" aria-label="Search movies by title or year"
          placeholder="Search by title or year…" value={search} onChange={event => setSearch(event.target.value)} />
        {search && <button className="icon-button search-clear" aria-label="Clear search" onClick={() => setSearch('')}><Icon name="close" /></button>}
      </div>
      <div className="sort-field"><Icon name="sort" />
        <select className="sort-select" aria-label="Sort movies" value={sortBy} onChange={event => setSortBy(event.target.value as typeof sortBy)}>
          <option value="title">Title A–Z</option><option value="year">Newest first</option><option value="rating">Highest rated</option>
        </select>
      </div>
      <button className="button refresh-button" disabled={loading || refreshing} onClick={refreshLibrary}>
        <Icon name="refresh" className={refreshing ? 'spinning' : ''} />{refreshing ? 'Refreshing…' : 'Refresh library'}
      </button>
    </div>

    <div className="filter-bar" role="group" aria-label="Filter movies">
      <div className="filter-field"><label htmlFor="genre-filter">Genre</label>
        <select id="genre-filter" value={filters.genre} onChange={event => setFilters({ ...filters, genre: event.target.value })}>
          <option value="">All genres</option>{genres.map(genre => <option key={genre} value={genre}>{genre}</option>)}
          {filters.genre && filters.genre !== '__unknown__' && !genres.includes(filters.genre) && <option value={filters.genre}>{filters.genre}</option>}
          <option value="__unknown__">Unknown genre</option>
        </select>
      </div>
      <div className="filter-field"><label htmlFor="year-filter">Year</label>
        <select id="year-filter" value={filters.year} onChange={event => setFilters({ ...filters, year: event.target.value })}>
          <option value="">All years</option>{years.map(year => <option key={year} value={year}>{year}</option>)}
          {filters.year && filters.year !== '__unknown__' && !years.includes(Number(filters.year)) && <option value={filters.year}>{filters.year}</option>}
          <option value="__unknown__">Unknown year</option>
        </select>
      </div>
      <div className="filter-field"><label htmlFor="rating-filter">Minimum rating</label>
        <select id="rating-filter" value={filters.minimumRating} onChange={event => setFilters({ ...filters, minimumRating: event.target.value })}>
          <option value="">Any rating</option>{[5, 6, 7, 8, 9].map(rating => <option key={rating} value={rating}>{rating}+ / 10</option>)}
        </select>
      </div>
      <button className="button button-quiet clear-filters" disabled={!hasFilters} onClick={() => setFilters(emptyFilters)}><Icon name="close" />Clear filters</button>
    </div>

    <main id="library" aria-busy={loading || refreshing}>
      <div className="collection-heading"><h2>Your collection</h2>
        {!loading && <span className="collection-count" role="status">{narrowed ? `${filteredMovies.length} of ${movies.length}` : movies.length} {filteredMovies.length === 1 && !narrowed ? 'movie' : 'movies'}</span>}
      </div>
      {error && <div className="notice notice-error" role="alert"><p>{error}</p>
        <button className="button" onClick={() => setSettingsOpen(true)}>Library settings</button>
        <button className="button button-quiet" disabled={refreshing} onClick={refreshLibrary}>Try again</button>
      </div>}
      {loading ? <div className="empty-state" role="status"><span className="loading-ring" /><h3>Loading your library</h3><p>Getting your collection ready…</p></div>
        : filteredMovies.length ? <div className="movie-grid">{filteredMovies.map(movie => <MovieCard key={movie.folderName} movie={movie} onOpen={() => void openMovie(movie)} />)}</div>
        : !error && <div className="empty-state"><div className="empty-icon"><Icon name={narrowed ? 'search' : 'film'} /></div>
          <h3>{narrowed ? 'No movies found' : 'Your collection starts here'}</h3>
          <p>{narrowed ? 'Try another search or adjust your filters.' : 'Choose the folder containing your movie folders in Settings.'}</p>
          <button className="button button-primary" onClick={() => narrowed ? clearBrowsing() : setSettingsOpen(true)}>{narrowed ? 'Clear search and filters' : 'Choose movie folder'}</button>
        </div>}
    </main>

    {settingsOpen && <LibrarySettings onSaved={() => { setSettingsOpen(false); void refreshLibrary(); }} onClose={() => setSettingsOpen(false)} />}
    {selectedMovie && <MovieDialog movie={selectedMovie} details={details} loading={detailsLoading} error={detailsError} onClose={closeMovie} onMatchSaved={applyMatch} />}
  </div>;
}
