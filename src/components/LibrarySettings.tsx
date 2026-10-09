import { useEffect, useState } from 'react';

export default function LibrarySettings({ onSaved, onClose }: { onSaved: () => void; onClose?: () => void }) {
  const [movieFolder, setMovieFolder] = useState('');
  const [tmdbToken, setTmdbToken] = useState('');
  const [hasToken, setHasToken] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    window.desktop?.getSettings().then(settings => {
      setMovieFolder(settings.movieFolder); setHasToken(settings.hasToken);
    }).catch(() => setError('Could not read settings.'));
  }, []);
  return <section className="settings-panel" aria-label="Library settings">
    <h2>Library settings</h2>
    <p>Choose the folder containing your movie folders. TMDB provides posters and movie details.</p>
    <form onSubmit={async event => {
      event.preventDefault(); setSaving(true); setError('');
      try { await window.desktop!.saveSettings({ movieFolder, tmdbToken }); onSaved(); }
      catch { setError('Could not save settings. Check that the folder exists and a TMDB API read access token is provided.'); }
      finally { setSaving(false); }
    }}>
      <label htmlFor="movie-folder">Movie folder</label>
      <div className="settings-folder">
        <input id="movie-folder" className="search-input" required value={movieFolder} onChange={event => setMovieFolder(event.target.value)} />
        <button type="button" className="refresh-button" onClick={async () => {
          try { const folder = await window.desktop!.chooseFolder(); if (folder) setMovieFolder(folder); }
          catch { setError('Could not open the folder picker.'); }
        }}>Browse…</button>
      </div>
      <label htmlFor="tmdb-token">TMDB API read access token</label>
      <input id="tmdb-token" className="search-input" type="password" required={!hasToken} value={tmdbToken}
        placeholder={hasToken ? 'Saved — leave blank to keep it' : 'Paste your TMDB read access token'}
        onChange={event => setTmdbToken(event.target.value)} autoComplete="off" />
      {error && <p role="alert">{error}</p>}
      <div className="header-actions">
        <button className="refresh-button" disabled={saving}>{saving ? 'Saving…' : 'Save and load library'}</button>
        {onClose && <button type="button" className="refresh-button" onClick={onClose}>Cancel</button>}
      </div>
    </form>
  </section>;
}
