import { useId, useState } from 'react';
import type { Movie, MovieDetails } from '../../shared/movies';
import type { MovieVideo } from '../../shared/desktop';
import Dialog from './Dialog';
import Icon from './Icon';
import { movieApi } from '../lib/movieApi';

export default function MovieDialog({ movie, details, loading, error, onClose }: { movie: Movie; details: MovieDetails | null; loading: boolean; error: string; onClose: () => void }) {
  const titleId = useId();
  const [openingFolder, setOpeningFolder] = useState(false);
  const [folderError, setFolderError] = useState('');
  const [playing, setPlaying] = useState(false);
  const [playError, setPlayError] = useState('');
  const [videos, setVideos] = useState<MovieVideo[] | null>(null);
  const [selectedVideo, setSelectedVideo] = useState('');
  const videoSelectId = useId();
  async function play() {
    setPlaying(true);
    setPlayError('');
    try {
      if (videos && selectedVideo) {
        await movieApi.playMovieVideo(movie.folderName, selectedVideo);
      } else {
        const found = await movieApi.listMovieVideos(movie.folderName);
        if (found.length === 0) throw new Error('No supported video files were found in this movie folder.');
        if (found.length === 1) await movieApi.playMovieVideo(movie.folderName, found[0].relativePath);
        else setVideos(found);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not play this video.';
      setPlayError(message.replace(/^Error invoking remote method '[^']+': Error: /, ''));
    } finally {
      setPlaying(false);
    }
  }
  async function openFolder() {
    setOpeningFolder(true);
    setFolderError('');
    try {
      await movieApi.openMovieFolder(movie.folderName);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not open this movie folder.';
      setFolderError(message.replace(/^Error invoking remote method '[^']+': Error: /, ''));
    } finally {
      setOpeningFolder(false);
    }
  }
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
        {folderError && <p className="notice notice-error" role="alert">{folderError}</p>}
        {playError && <p className="notice notice-error" role="alert">{playError}</p>}
        {videos && <div className="video-picker">
          <label htmlFor={videoSelectId}>Choose a video to play</label>
          <select id={videoSelectId} value={selectedVideo} onChange={event => setSelectedVideo(event.target.value)} disabled={playing}>
            <option value="">Select a video…</option>
            {videos.map(video => <option key={video.relativePath} value={video.relativePath}>{video.relativePath} ({video.size >= 1024 ** 3 ? `${(video.size / 1024 ** 3).toFixed(1)} GB` : `${Math.max(1, Math.round(video.size / 1024 ** 2))} MB`})</option>)}
          </select>
          <p>Opens in your Windows default video player.</p>
        </div>}
        <div className="movie-actions">
          <button className="button" onClick={() => void play()} disabled={playing || Boolean(videos && !selectedVideo)}><Icon name="play" />{playing ? 'Opening…' : videos ? 'Play selected video' : 'Play movie'}</button>
          <button className="button" onClick={() => void openFolder()} disabled={openingFolder}><Icon name="folder" />{openingFolder ? 'Opening…' : 'Open movie folder'}</button>
          {details?.imdbId && <a className="button" href={`https://www.imdb.com/title/${details.imdbId}/`} target="_blank" rel="noreferrer"><Icon name="arrow" />Open IMDb</a>}
        </div>
      </div>
    </div>
  </Dialog>;
}
