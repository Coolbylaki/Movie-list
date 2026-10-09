import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createLibrary } from '../desktop/services/library.js';

test('scan preserves cached matches, ignores files, parses names, and refreshes removed folders', async () => {
  const fixtureRoot = path.resolve('release/test-fixtures');
  await fs.mkdir(fixtureRoot, { recursive: true });
  const root = await fs.mkdtemp(path.join(fixtureRoot, 'library-'));
  const movies = path.join(root, 'movies');
  const cacheFile = path.join(root, 'cache.json');
  await fs.mkdir(movies);
  await fs.mkdir(path.join(movies, 'The Matrix (1999)'));
  await fs.mkdir(path.join(movies, 'Unknown movie'));
  await fs.writeFile(path.join(movies, 'ignore.mp4'), '');
  await fs.writeFile(cacheFile, JSON.stringify([
    { folderName: 'The Matrix (1999)', title: 'The Matrix', year: 1999, matched: true, tmdbId: 603, genres: ['Science Fiction'] },
    { folderName: 'Removed (2000)', title: 'Removed', year: 2000, matched: true },
  ]));
  const requests: string[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async input => {
    requests.push(String(input));
    return new Response(JSON.stringify({ results: [] }), { headers: { 'content-type': 'application/json' } });
  };
  try {
    const library = createLibrary({ movieFolder: movies, tmdbToken: 'test', cacheFile });
    const result = await library.loadMovies();
    assert.equal(result.length, 2);
    assert.equal(result[0].tmdbId, 603);
    assert.deepEqual(result[1], { folderName: 'Unknown movie', title: 'Unknown movie', year: null, matched: false });
    assert.equal(requests.length, 1);
    assert.equal(new URL(requests[0]).searchParams.get('query'), 'Unknown movie');
    assert.deepEqual(JSON.parse(await fs.readFile(cacheFile, 'utf8')), result);
    await library.loadMovies();
    assert.equal(requests.length, 1, 'second scan reuses the cache');
    await assert.rejects(() => library.loadDetails(-1), /Invalid movie ID/);
  } finally {
    globalThis.fetch = originalFetch;
    assert.equal(path.dirname(root), fixtureRoot);
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('TMDB title/year lookup and detailed metadata remain compatible', async () => {
  const fixtureRoot = path.resolve('release/test-fixtures');
  await fs.mkdir(fixtureRoot, { recursive: true });
  const root = await fs.mkdtemp(path.join(fixtureRoot, 'matching-'));
  await fs.mkdir(path.join(root, 'Alien (1979)'));
  const originalFetch = globalThis.fetch;
  const requests: URL[] = [];
  const movie = { id: 348, title: 'Alien', release_date: '1979-05-25', overview: 'Space horror', vote_average: 8.2,
    poster_path: '/poster.jpg', backdrop_path: '/backdrop.jpg', runtime: 117, genres: [{ name: 'Horror' }], external_ids: { imdb_id: 'tt0078748' } };
  globalThis.fetch = async input => {
    const url = new URL(String(input)); requests.push(url);
    return new Response(JSON.stringify(url.pathname.endsWith('/search/movie') ? { results: [movie] } : movie));
  };
  try {
    const library = createLibrary({ movieFolder: root, tmdbToken: 'test', cacheFile: path.join(root, 'cache.json') });
    const result = await library.loadMovies();
    assert.equal(requests[0].searchParams.get('query'), 'Alien');
    assert.equal(requests[0].searchParams.get('year'), '1979');
    assert.equal(result[0].tmdbId, 348);
    assert.deepEqual(result[0].genres, ['Horror']);
    const details = await library.loadDetails(348);
    assert.equal(details.runtime, 117);
    assert.deepEqual(details.genres, ['Horror']);
    assert.equal(details.imdbId, 'tt0078748');
  } finally {
    globalThis.fetch = originalFetch;
    assert.equal(path.dirname(root), fixtureRoot);
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('adds genres to old caches without rematching, retries failures, and reuses saved genres', async () => {
  const fixtureRoot = path.resolve('release/test-fixtures');
  await fs.mkdir(fixtureRoot, { recursive: true });
  const root = await fs.mkdtemp(path.join(fixtureRoot, 'genres-'));
  await fs.mkdir(path.join(root, 'Local title (2000)'));
  const cacheFile = path.join(root, 'cache.json');
  const saved = { folderName: 'Local title (2000)', title: 'Chosen match', year: 2001, tmdbId: 123, rating: 7.5, matched: true };
  await fs.writeFile(cacheFile, JSON.stringify([saved]));
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async input => {
    assert.match(String(input), /\/movie\/123\?/);
    requests++;
    return requests === 1 ? new Response('', { status: 503 }) : new Response(JSON.stringify({ id: 123, genres: [{ name: 'Drama' }, { name: 'Mystery' }] }));
  };
  try {
    const library = createLibrary({ movieFolder: root, tmdbToken: 'test', cacheFile });
    assert.deepEqual(await library.loadMovies(), [saved], 'a temporary genre failure preserves the existing match');
    assert.deepEqual(await library.loadMovies(), [{ ...saved, genres: ['Drama', 'Mystery'] }]);
    await library.loadMovies();
    assert.equal(requests, 2, 'genres are cached after a successful retry');
    assert.deepEqual(JSON.parse(await fs.readFile(cacheFile, 'utf8')), [{ ...saved, genres: ['Drama', 'Mystery'] }]);
  } finally {
    globalThis.fetch = originalFetch;
    assert.equal(path.dirname(root), fixtureRoot);
    await fs.rm(root, { recursive: true, force: true });
  }
});
