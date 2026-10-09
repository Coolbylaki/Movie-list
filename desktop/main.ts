import { app, BrowserWindow, dialog, ipcMain, safeStorage, shell } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { createLibrary } from './services/library.js';
import { listMovieVideos, openMovieFolder, playMovieVideo } from './services/local-files.js';

app.setName('Movie Library');
if (process.platform === 'win32') app.setAppUserModelId('com.coolbylaki.movielibrary');
app.setPath('userData', path.join(app.getPath('appData'), 'Movie Library'));
const verifySettings = process.argv.includes('--verify-settings');
const smoke = verifySettings;
const dataDir = app.getPath('userData');
const settingsFile = path.join(dataDir, 'settings.json');
type Settings = { movieFolder: string; encryptedToken: string };
let settings: Settings = { movieFolder: '', encryptedToken: '' };
let window: BrowserWindow | null = null;
let pendingScan: Promise<unknown> | null = null;
const rendererUrl = pathToFileURL(path.join(app.getAppPath(), 'dist/index.html')).href;

function cacheFile(folder: string) {
  const key = createHash('sha256').update(path.resolve(folder).toLowerCase()).digest('hex').slice(0, 16);
  return path.join(dataDir, `movies-${key}.json`);
}
function token() {
  return settings.encryptedToken ? safeStorage.decryptString(Buffer.from(settings.encryptedToken, 'base64')) : '';
}
function library() {
  const tmdbToken = token();
  if (!settings.movieFolder || !tmdbToken) throw new Error('Open Library settings to choose your movie folder and add your TMDB token.');
  return createLibrary({ movieFolder: settings.movieFolder, tmdbToken, cacheFile: cacheFile(settings.movieFolder) });
}
async function persist(next: Settings) {
  await fs.writeFile(`${settingsFile}.tmp`, JSON.stringify(next, null, 2));
  await fs.rename(`${settingsFile}.tmp`, settingsFile);
  settings = next;
}
async function initializeSettings() {
  await fs.mkdir(dataDir, { recursive: true });
  try { settings = JSON.parse(await fs.readFile(settingsFile, 'utf8')); return; }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw new Error('Could not read saved desktop settings.', { cause: error });
  }
}
function registerHandlers() {
  // Accept requests only from this app's own main frame.
  const handle = (channel: string, fn: (...args: never[]) => unknown) => {
    ipcMain.handle(channel, (event, ...args) => {
      if (!window || event.sender !== window.webContents || event.senderFrame?.url !== rendererUrl) throw new Error('Unauthorized request');
      return fn(...args as never[]);
    });
  };
  handle('library:movies', () => {
    if (!pendingScan) pendingScan = library().loadMovies().finally(() => { pendingScan = null; });
    return pendingScan;
  });
  handle('library:details', (id: number) => library().loadDetails(id));
  handle('library:open-folder', (folderName: string) => openMovieFolder(settings.movieFolder, folderName, folder => shell.openPath(folder)));
  handle('library:videos', (folderName: string) => listMovieVideos(settings.movieFolder, folderName));
  handle('library:play', (folderName: string, relativePath: string) => playMovieVideo(settings.movieFolder, folderName, relativePath, file => shell.openPath(file)));
  handle('settings:get', () => ({ movieFolder: settings.movieFolder, hasToken: Boolean(settings.encryptedToken) }));
  handle('settings:folder', async () => {
    const result = await dialog.showOpenDialog(window!, { title: 'Choose your movie library', properties: ['openDirectory'] });
    return result.canceled ? null : result.filePaths[0];
  });
  handle('settings:save', async (input: { movieFolder: string; tmdbToken: string }) => {
    if (!input || typeof input.movieFolder !== 'string' || typeof input.tmdbToken !== 'string') throw new Error('Invalid settings');
    const movieFolder = input.movieFolder.trim();
    if (!path.isAbsolute(movieFolder) || !(await fs.stat(movieFolder)).isDirectory()) throw new Error('Choose an existing folder');
    if (!safeStorage.isEncryptionAvailable()) throw new Error('Secure token storage is unavailable');
    const encryptedToken = input.tmdbToken.trim() ? safeStorage.encryptString(input.tmdbToken.trim()).toString('base64') : settings.encryptedToken;
    if (!encryptedToken) throw new Error('A TMDB read access token is required');
    await pendingScan;
    await persist({ movieFolder, encryptedToken });
  });
}
async function createWindow() {
  window = new BrowserWindow({
    title: 'Movie Library', width: 1400, height: 950, minWidth: 700, minHeight: 500,
    backgroundColor: '#111111', show: false, autoHideMenuBar: true,
    icon: path.join(app.getAppPath(), 'resources/app.ico'),
    webPreferences: { preload: path.join(app.getAppPath(), 'desktop/preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\/www\.imdb\.com\/title\/tt\d+\/$/.test(url)) void shell.openExternal(url);
    return { action: 'deny' };
  });
  window.webContents.on('will-navigate', (event, url) => { if (url !== rendererUrl) event.preventDefault(); });
  window.once('ready-to-show', () => { if (!smoke) window?.show(); });
  window.on('closed', () => { window = null; });
  await window.loadURL(rendererUrl);
  if (smoke) {
    const result = await window.webContents.executeJavaScript(`(async () => {
      const settings = await window.desktop.getSettings();
      const movies = await window.desktop.loadMovies();
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { bridge: true, hasToken: settings.hasToken, movies: movies.length, cards: document.querySelectorAll('.movie-card').length, title: document.title };
    })()`);
    const checksDir = path.resolve('release/checks');
    await fs.mkdir(checksDir, { recursive: true });
    await fs.writeFile(path.join(checksDir, 'desktop.json'), JSON.stringify({ ...result, settingsDirectory: dataDir }, null, 2));
    await fs.writeFile(path.join(checksDir, 'desktop.png'), (await window.webContents.capturePage()).toPNG());
    app.quit();
  }
}
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (window?.isMinimized()) window.restore(); window?.focus(); });
  app.whenReady().then(async () => {
    await initializeSettings();
    registerHandlers(); await createWindow();
  }).catch(error => {
    if (!smoke) dialog.showErrorBox('Movie Library could not start', error instanceof Error ? error.message : 'Unexpected startup error');
    else console.error(error);
    app.exit(1);
  });
  app.on('activate', () => { if (!window) void createWindow(); });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
}
