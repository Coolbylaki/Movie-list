import { useState, type FormEvent } from 'react';
import type { Movie, MovieMatch, SavedMovieMatch } from '../../shared/movies';
import { movieApi } from '../lib/movieApi';
import Icon from './Icon';

function message(error: unknown) {
  return error instanceof Error ? error.message.replace(/^Error invoking remote method '[^']+': (?:Error: )?/, '') : 'Something went wrong. Please try again.';
}

export default function MovieMatchEditor({ movie, titleId, onCancel, onSaved }: {
  movie: Movie; titleId: string; onCancel: () => void; onSaved: (result: SavedMovieMatch) => void;
}) {
  const [query, setQuery] = useState(movie.title);
  const [year, setYear] = useState('');
  const [results, setResults] = useState<MovieMatch[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const busy = searching || saving;
  async function search(event: FormEvent) {
    event.preventDefault();
    setSearching(true);
    setError('');
    setSelectedId(null);
    setResults([]);
    setSearched(false);
    try {
      setResults(await movieApi.searchMatches(query, year ? Number(year) : undefined));
      setSearched(true);
    } catch (error) { setError(message(error)); }
    finally { setSearching(false); }
  }
  async function save() {
    if (!selectedId) return;
    setSaving(true);
    setError('');
    try { onSaved(await movieApi.correctMatch(movie.folderName, selectedId)); }
    catch (error) { setError(message(error)); }
    finally { setSaving(false); }
  }
  return <div className="match-editor">
    <p className="eyebrow">Library metadata</p>
    <h2 id={titleId}>Correct movie match</h2>
    <p className="match-description">Find the right movie for <strong>{movie.folderName}</strong>. Your folder and video files stay the same.</p>
    <form className="match-search" onSubmit={event => void search(event)}>
      <div className="form-field"><label htmlFor={`${titleId}-query`}>Movie title</label>
        <input id={`${titleId}-query`} className="text-input" value={query} onChange={event => setQuery(event.target.value)} maxLength={200} required disabled={busy} autoFocus />
      </div>
      <div className="form-field match-year"><label htmlFor={`${titleId}-year`}>Year (optional)</label>
        <input id={`${titleId}-year`} className="text-input" type="number" min={1888} max={2100} step={1} value={year} onChange={event => setYear(event.target.value)} placeholder="Any year" disabled={busy} />
      </div>
      <button className="button" type="submit" disabled={busy || !query.trim()}><Icon name="search" />{searching ? 'Searching…' : 'Search TMDB'}</button>
    </form>
    {error && <p className="notice notice-error" role="alert">{error}</p>}
    {searching && <p className="details-status" role="status">Searching for movies…</p>}
    {searched && <p className="match-result-count" role="status">{results.length ? `${results.length} results. Select the correct movie below.` : 'No matches found. Try a different title or leave the year blank.'}</p>}
    {results.length > 0 && <fieldset className="match-results" disabled={saving}>
      <legend className="sr-only">Choose the correct movie</legend>
      {results.map(result => <label key={result.id} className={`match-result ${selectedId === result.id ? 'is-selected' : ''}`}>
        <input type="radio" name="movie-match" value={result.id} checked={selectedId === result.id} onChange={() => setSelectedId(result.id)} />
        <span className="match-poster">{result.posterPath ? <img src={`https://image.tmdb.org/t/p/w185${result.posterPath}`} alt="" loading="lazy" onError={event => { event.currentTarget.style.visibility = 'hidden'; }} /> : <Icon name="film" />}</span>
        <span className="match-result-info"><span className="match-result-title">{result.title} <span>({result.year ?? 'Unknown year'})</span></span><span className="match-result-overview">{result.overview || 'No description available.'}</span></span>
      </label>)}
    </fieldset>}
    <div className="match-actions">
      <button className="button button-quiet" onClick={onCancel} disabled={saving}>Cancel</button>
      <button className="button button-primary" onClick={() => void save()} disabled={busy || !selectedId}>{saving ? 'Saving…' : 'Save match'}</button>
    </div>
  </div>;
}
