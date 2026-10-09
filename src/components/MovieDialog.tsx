import { useId } from 'react';
import type { Movie, MovieDetails } from '../../shared/movies';
import Dialog from './Dialog';
import Icon from './Icon';

export default function MovieDialog({ movie, details, loading, error, onClose }: { movie: Movie; details: MovieDetails | null; loading: boolean; error: string; onClose: () => void }) {
  const titleId = useId();
  const data = details ?? movie;
  return <Dialog titleId={titleId} onClose={onClose} className="movie-dialog">
    {details?.backdropPath && <div className="detail-hero"><img className="modal-backdrop-image" src={`https://image.tmdb.org/t/p/w1280${details.backdropPath}`} alt="" /></div>}
    <div className={`modal-content ${details?.backdropPath ? 'has-backdrop' : ''}`}>
      {data.posterPath && <img className="modal-poster" src={`https://image.tmdb.org/t/p/w500${data.posterPath}`} alt="" />}
      <div className="modal-info"><p className="eyebrow">Movie details</p><h2 id={titleId}>{data.title}</h2>
        <div className="details-meta">
          {data.year && <span>{data.year}</span>}
          {data.rating !== undefined && <span className="rating"><Icon name="star" />{data.rating.toFixed(1)}<span className="rating-scale">/ 10</span></span>}
          {details?.runtime ? <span>{details.runtime} min</span> : null}
        </div>
        {details && <div className="genres">{details.genres.map(genre => <span key={genre}>{genre}</span>)}</div>}
        <p className="full-overview">{data.overview || 'No description available.'}</p>
        {!movie.matched && <p className="not-found">This folder has not been matched to a movie yet.</p>}
        {loading && <p className="details-status" role="status"><Icon name="refresh" className="spinning" />Loading additional details…</p>}
        {error && <p className="notice notice-error" role="alert">{error}</p>}
        {details?.imdbId && <a className="button imdb-button" href={`https://www.imdb.com/title/${details.imdbId}/`} target="_blank" rel="noreferrer">Open IMDb<Icon name="arrow" /></a>}
      </div>
    </div>
  </Dialog>;
}
