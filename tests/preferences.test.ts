import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createPreferencesStore } from '../desktop/services/preferences.js';
import { defaultBrowsingPreferences, normalizeBrowsingPreferences } from '../shared/preferences.js';

test('invalid saved preferences fall back safely while preserving valid choices', () => {
  assert.deepEqual(normalizeBrowsingPreferences(null), defaultBrowsingPreferences);
  assert.deepEqual(normalizeBrowsingPreferences({ sortBy: 'invalid', genre: [], year: '../file', minimumRating: 'NaN' }), defaultBrowsingPreferences);
  assert.deepEqual(normalizeBrowsingPreferences({ sortBy: 'rating', genre: ' Horror ', year: '1979', minimumRating: '8', token: 'ignored' }), { sortBy: 'rating', genre: 'Horror', year: '1979', minimumRating: '8' });
  assert.deepEqual(normalizeBrowsingPreferences({ year: '__unknown__', genre: '__unknown__' }), { ...defaultBrowsingPreferences, year: '__unknown__', genre: '__unknown__' });
});

test('preferences survive new store instances, rapid changes, clearing filters, and corrupt files', async () => {
  const fixtureRoot = path.resolve('release/test-fixtures');
  await fs.mkdir(fixtureRoot, { recursive: true });
  const root = await fs.mkdtemp(path.join(fixtureRoot, 'preferences-'));
  const file = path.join(root, 'browsing-preferences.json');
  try {
    const store = createPreferencesStore(file);
    assert.deepEqual(await store.load(), defaultBrowsingPreferences);
    const saved = { sortBy: 'rating' as const, genre: 'Horror', year: '1979', minimumRating: '8' };
    const first = store.save({ ...saved, sortBy: 'year' });
    const last = store.save(saved);
    assert.equal(store.hasPendingSaves(), true);
    await store.flush();
    await Promise.all([first, last]);
    assert.equal(store.hasPendingSaves(), false);
    assert.deepEqual(await createPreferencesStore(file).load(), saved);
    await store.save({ ...defaultBrowsingPreferences, sortBy: 'rating' });
    assert.deepEqual(await createPreferencesStore(file).load(), { ...defaultBrowsingPreferences, sortBy: 'rating' });
    await fs.writeFile(file, 'broken JSON');
    assert.deepEqual(await createPreferencesStore(file).load(), defaultBrowsingPreferences);
    await store.save(saved);
    assert.deepEqual(JSON.parse(await fs.readFile(file, 'utf8')), saved);
  } finally {
    assert.equal(path.dirname(root), fixtureRoot);
    await fs.rm(root, { recursive: true, force: true });
  }
});
