import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { openMovieFolder, resolveMovieFolder } from '../desktop/services/local-files.js';

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
