import { useEffect, useId, useState } from 'react';
import Dialog from './Dialog';
import Icon from './Icon';
import tmdbLogo from '../../resources/tmdb-logo.svg';

export default function LibrarySettings({ onSaved, onClose }: { onSaved: () => void; onClose: () => void }) {
  const titleId = useId();
  const [movieFolder, setMovieFolder] = useState('');
  const [tmdbToken, setTmdbToken] = useState('');
  const [hasToken, setHasToken] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    window.desktop?.getSettings().then(settings => {
      if (active) { setMovieFolder(settings.movieFolder); setHasToken(settings.hasToken); }
    }).catch(() => { if (active) setError('Could not read settings.'); })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  return <Dialog titleId={titleId} onClose={onClose} className="settings-modal">
    <section className="settings-panel">
      <p className="eyebrow">Make yourself at home</p>
      <h2 id={titleId}>Library settings</h2>
      <p className="settings-description">Your movie folder and token are saved on this PC for future launches.</p>
      <form onSubmit={async event => {
        event.preventDefault(); setSaving(true); setError('');
        try { await window.desktop!.saveSettings({ movieFolder, tmdbToken }); onSaved(); }
        catch { setError('Could not save settings. Check the folder exists and a TMDB API read access token is provided.'); }
        finally { setSaving(false); }
      }}>
        <div className="form-field">
          <label htmlFor="movie-folder">Movie folder</label>
          <p className="field-hint" id="folder-hint">Choose the folder containing your individual movie folders.</p>
          <div className="settings-folder">
            <input id="movie-folder" className="text-input" required value={movieFolder} aria-describedby="folder-hint" disabled={!ready || saving} onChange={event => setMovieFolder(event.target.value)} />
            <button type="button" className="button" disabled={!ready || saving} onClick={async () => {
              try { const folder = await window.desktop!.chooseFolder(); if (folder) setMovieFolder(folder); }
              catch { setError('Could not open the folder picker.'); }
            }}>Browse…</button>
          </div>
        </div>
        <div className="form-field">
          <div className="field-label-row"><label htmlFor="tmdb-token">TMDB read access token</label>{hasToken && <span className="saved-indicator">Token saved</span>}</div>
          <p className="field-hint" id="token-hint">Used to find movie details and posters.{hasToken ? ' Leave blank to keep your saved token.' : ''}</p>
          <input id="tmdb-token" className="text-input" type="password" required={!hasToken} value={tmdbToken} aria-describedby="token-hint" disabled={!ready || saving}
            placeholder={hasToken ? 'Your token is securely saved' : 'Paste your TMDB API read access token'}
            onChange={event => setTmdbToken(event.target.value)} autoComplete="off" />
        </div>
        {error && <p className="notice notice-error" role="alert">{error}</p>}
        <div className="settings-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button>
          <button className="button button-primary" disabled={!ready || saving}>{saving && <Icon name="refresh" className="spinning" />}{saving ? 'Saving…' : 'Save settings'}</button>
        </div>
      </form>
      <section className="app-credits" aria-label="Credits">
        <h3>Credits</h3>
        <img src={tmdbLogo} alt="TMDB" />
        <p>Movie information and posters provided by TMDB.</p>
        <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
      </section>
    </section>
  </Dialog>;
}
