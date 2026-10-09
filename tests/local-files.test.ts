import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { listMovieVideos, openMovieFolder, playMovieVideo, resolveMovieFolder } from '../desktop/services/local-files.js';

test('opens the original local folder and reports missing folders and Windows failures', async () => {
  const fixtureRoot = path.resolve('release/test-fixtures');
  await fs.mkdir(fixtureRoot, { recursive: true });
  const root = await fs.mkdtemp(path.join(fixtureRoot, 'local-files-'));
  const name = 'Amélie (2001)';
  await fs.mkdir(path.join(root, name));
  await fs.writeFile(path.join(root, 'not-a-folder.mp4'), '');
  try {
    const opened: string[] = [];
    await openMovieFolder(root, name, async folder => { opened.push(folder); return ''; });
    assert.deepEqual(opened, [await fs.realpath(path.join(root, name))]);
    await assert.rejects(() => openMovieFolder(root, name, async () => 'Windows error'), /Windows could not open/);
    for (const missing of ['Missing', 'not-a-folder.mp4']) {
      await assert.rejects(() => resolveMovieFolder(root, missing), /moved or removed/);
    }
    for (const invalid of ['', '.', '..', '../other', '..\\other', 'C:\\Movies', '/Movies', 'file:stream', null, 123]) {
      await assert.rejects(() => resolveMovieFolder(root, invalid), /Invalid movie folder/);
    }
    await assert.rejects(() => resolveMovieFolder('', name), /Settings first/);
    assert.equal(opened.length, 1);
  } finally {
    assert.equal(path.dirname(root), fixtureRoot);
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('rejects a directory junction that points outside the selected library', async () => {
  const fixtureRoot = path.resolve('release/test-fixtures');
  await fs.mkdir(fixtureRoot, { recursive: true });
  const root = await fs.mkdtemp(path.join(fixtureRoot, 'boundary-'));
  const library = path.join(root, 'movies');
  const outside = path.join(root, 'movies-other');
  await fs.mkdir(library);
  await fs.mkdir(outside);
  try {
    await fs.symlink(outside, path.join(library, 'External'), 'junction');
    await assert.rejects(() => resolveMovieFolder(library, 'External'), /Could not find/);
  } finally {
    assert.equal(path.dirname(root), fixtureRoot);
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('finds videos in subfolders and plays only validated video files through the default opener', async () => {
  const fixtureRoot = path.resolve('release/test-fixtures');
  await fs.mkdir(fixtureRoot, { recursive: true });
  const root = await fs.mkdtemp(path.join(fixtureRoot, 'playback-'));
  const folder = path.join(root, 'Amélie (2001)');
  await fs.mkdir(path.join(folder, 'Extras'), { recursive: true });
  await fs.writeFile(path.join(folder, 'movie.MKV'), 'a'.repeat(100));
  await fs.writeFile(path.join(folder, 'Extras', 'trailer.mp4'), 'short');
  await fs.writeFile(path.join(folder, 'subtitles.srt'), 'subtitles');
  await fs.writeFile(path.join(folder, 'unsafe.exe'), 'executable');
  await fs.mkdir(path.join(folder, 'fake.avi'));
  await fs.mkdir(path.join(root, 'Empty'));
  const opened: string[] = [];
  const opener = async (file: string) => { opened.push(file); return ''; };
  try {
    assert.deepEqual(await listMovieVideos(root, 'Amélie (2001)'), [
      { relativePath: 'movie.MKV', size: 100 },
      { relativePath: path.join('Extras', 'trailer.mp4'), size: 5 },
    ]);
    assert.deepEqual(await listMovieVideos(root, 'Empty'), []);
    await playMovieVideo(root, 'Amélie (2001)', path.join('Extras', 'trailer.mp4'), opener);
    assert.deepEqual(opened, [await fs.realpath(path.join(folder, 'Extras', 'trailer.mp4'))]);
    for (const invalid of ['../other.mp4', '..\\other.mp4', 'C:\\video.mp4', '/video.mp4', 'movie.MKV:stream', '', null, 1]) {
      await assert.rejects(() => playMovieVideo(root, 'Amélie (2001)', invalid, opener), /Invalid video/);
    }
    for (const missing of ['unsafe.exe', 'subtitles.srt', 'fake.avi', 'removed.mp4']) {
      await assert.rejects(() => playMovieVideo(root, 'Amélie (2001)', missing, opener), /could not be found/);
    }
    await assert.rejects(() => playMovieVideo(root, 'Amélie (2001)', 'movie.MKV', async () => 'No player'), /default app/);
    assert.equal(opened.length, 1, 'invalid selections never reach the Windows opener');
  } finally {
    assert.equal(path.dirname(root), fixtureRoot);
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('video scanning and playback cannot escape through a directory junction', async () => {
  const fixtureRoot = path.resolve('release/test-fixtures');
  await fs.mkdir(fixtureRoot, { recursive: true });
  const root = await fs.mkdtemp(path.join(fixtureRoot, 'video-boundary-'));
  const folder = path.join(root, 'Movie');
  const outside = path.join(root, 'Outside');
  await fs.mkdir(folder);
  await fs.mkdir(outside);
  await fs.writeFile(path.join(outside, 'video.mp4'), '');
  try {
    await fs.symlink(outside, path.join(folder, 'External'), 'junction');
    assert.deepEqual(await listMovieVideos(root, 'Movie'), []);
    await assert.rejects(() => playMovieVideo(root, 'Movie', path.join('External', 'video.mp4'), async () => { throw new Error('Should never open'); }), /could not be found/);
  } finally {
    assert.equal(path.dirname(root), fixtureRoot);
    await fs.rm(root, { recursive: true, force: true });
  }
});
