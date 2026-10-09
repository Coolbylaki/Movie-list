import { useState } from 'react';
import type { Movie } from '../../shared/movies';
import Icon from './Icon';

export default function MovieCard({ movie, onOpen }: { movie: Movie; onOpen: () => void }) {
  const [posterFailed, setPosterFailed] = useState(false);
  return <article className="movie-card">
    <button className="card-action" onClick={onOpen} aria-label={`View details for ${movie.title}${movie.year ? ` (${movie.year})` : ''}`}>
      <span className="poster-frame">
        {movie.posterPath && !posterFailed
          ? <img className="poster" src={`https://image.tmdb.org/t/p/w500${movie.posterPath}`} alt="" loading="lazy" decoding="async" onError={() => setPosterFailed(true)} />
          : <span className="poster-placeholder"><Icon name="film" /><span>No poster available</span></span>}
        <span className="card-open">View details<Icon name="arrow" /></span>
      </span>
      <span className="movie-info">
        <span className="movie-title">{movie.title}</span>
        <span className="movie-meta"><span>{movie.year ?? 'Unknown year'}</span>
          {movie.rating !== undefined && <span className="rating"><Icon name="star" />{movie.rating.toFixed(1)}</span>}
        </span>
        {movie.overview && <span className="overview">{movie.overview}</span>}
        {!movie.matched && <span className="not-found">No metadata match</span>}
      </span>
    </button>
  </article>;
}
