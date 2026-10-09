import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createLibrary } from '../desktop/services/library.js';

test('match search validates input, supports an optional year, and reports TMDB failures', async () => {
  const originalFetch = globalThis.fetch;
  const requests: URL[] = [];
  let fail = false;
  globalThis.fetch = async input => {
    requests.push(new URL(String(input)));
    return fail ? new Response('', { status: 401 }) : new Response(JSON.stringify({ results: [
      { id: 1091, title: 'The Thing', release_date: '1982-06-25', overview: 'Horror', poster_path: '/thing.jpg' },
      { id: 0, title: 'Invalid result' },
    ] }));
  };
  const library = createLibrary({ movieFolder: '', tmdbToken: 'test', cacheFile: '' });
  try {
    assert.deepEqual(await library.searchMatches(' The Thing ', 1982), [{ id: 1091, title: 'The Thing', year: 1982, overview: 'Horror', posterPath: '/thing.jpg' }]);
    assert.equal(requests[0].searchParams.get('query'), 'The Thing');
    assert.equal(requests[0].searchParams.get('year'), '1982');
    await library.searchMatches('The Thing');
    assert.equal(requests[1].searchParams.has('year'), false);
    for (const query of ['', '  ', 'x'.repeat(201)]) await assert.rejects(() => library.searchMatches(query), /movie title/);
    for (const year of [1887, 2101, 2001.5, NaN]) await assert.rejects(() => library.searchMatches('Thing', year), /year between/);
    assert.equal(requests.length, 2, 'invalid input never makes a request');
    fail = true;
    await assert.rejects(() => library.searchMatches('Thing'), /Could not search TMDB/);
  } finally { globalThis.fetch = originalFetch; }
});

test('correcting matched and unmatched folders updates metadata, persists across fresh scans, and preserves files', async () => {
  const fixtureRoot = path.resolve('release/test-fixtures');
  await fs.mkdir(fixtureRoot, { recursive: true });
  const root = await fs.mkdtemp(path.join(fixtureRoot, 'correction-'));
  const moviesRoot = path.join(root, 'movies');
  const cacheFile = path.join(root, 'cache.json');
  for (const folder of ['The Thing', 'Unknown', 'Other']) await fs.mkdir(path.join(moviesRoot, folder), { recursive: true });
  await fs.writeFile(path.join(moviesRoot, 'The Thing', 'original.mkv'), 'original movie content');
  const other = { folderName: 'Other', title: 'Other', year: 2000, tmdbId: 5, genres: ['Drama'], matched: true };
  await fs.writeFile(cacheFile, JSON.stringify([
    { folderName: 'The Thing', title: 'Wrong version', year: 2011, tmdbId: 60935, genres: ['Mystery'], matched: true },
    { folderName: 'Unknown', title: 'Unknown', year: null, matched: false }, other,
  ]));
  const originalFetch = globalThis.fetch;
  let fail = false;
  let requests = 0;
  globalThis.fetch = async input => {
    assert.match(String(input), /\/movie\/1091\?/);
    requests++;
    return fail ? new Response('', { status: 503 }) : new Response(JSON.stringify({ id: 1091, title: 'The Thing', release_date: '1982-06-25', overview: 'Correct description', vote_average: 8.1, poster_path: '/correct.jpg', backdrop_path: '/backdrop.jpg', runtime: 109, genres: [{ name: 'Horror' }], external_ids: { imdb_id: 'tt0084787' } }));
  };
  const options = { movieFolder: moviesRoot, tmdbToken: 'test', cacheFile };
  try {
    const result = await createLibrary(options).correctMatch('The Thing', 1091);
    assert.equal(result.movie.folderName, 'The Thing');
    assert.equal(result.movie.tmdbId, 1091);
    assert.equal(result.movie.year, 1982);
    assert.equal(result.movie.posterPath, '/correct.jpg');
    assert.deepEqual(result.movie.genres, ['Horror']);
    assert.equal(result.details.imdbId, 'tt0084787');
    await createLibrary(options).correctMatch('Unknown', 1091);
    const scan = await createLibrary(options).loadMovies();
    assert.equal(scan.find(movie => movie.folderName === 'Unknown')?.matched, true);
    assert.deepEqual(scan.find(movie => movie.folderName === 'The Thing'), result.movie);
    assert.deepEqual(scan.find(movie => movie.folderName === 'Other'), other);
    assert.equal(requests, 2, 'fresh service instances reuse saved corrections');
    assert.equal(await fs.readFile(path.join(moviesRoot, 'The Thing', 'original.mkv'), 'utf8'), 'original movie content');
    const beforeFailure = await fs.readFile(cacheFile, 'utf8');
    fail = true;
    await assert.rejects(() => createLibrary(options).correctMatch('The Thing', 1091), /TMDB returned/);
    assert.equal(await fs.readFile(cacheFile, 'utf8'), beforeFailure, 'failed corrections keep the previous saved match');
    await assert.rejects(() => createLibrary(options).correctMatch('../Other', 1091), /Invalid movie folder/);
    await assert.rejects(() => createLibrary(options).correctMatch('The Thing', -1), /Invalid movie ID/);
    assert.equal(await fs.readFile(cacheFile, 'utf8'), beforeFailure);
  } finally {
    globalThis.fetch = originalFetch;
    assert.equal(path.dirname(root), fixtureRoot);
    await fs.rm(root, { recursive: true, force: true });
  }
});
