import fs from 'node:fs/promises';
import { normalizeBrowsingPreferences } from '../../shared/preferences.js';

export function createPreferencesStore(file: string) {
  let pending: Promise<unknown> = Promise.resolve();
  let pendingCount = 0;
  async function load() {
    await pending;
    try {
      const text = await fs.readFile(file, 'utf8');
      try { return normalizeBrowsingPreferences(JSON.parse(text)); }
      catch { return normalizeBrowsingPreferences(null); }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return normalizeBrowsingPreferences(null);
      throw new Error('Could not read saved browsing preferences.', { cause: error });
    }
  }
  function save(input: unknown) {
    const preferences = normalizeBrowsingPreferences(input);
    pendingCount++;
    const operation = pending.then(async () => {
      await fs.writeFile(`${file}.tmp`, JSON.stringify(preferences, null, 2), 'utf8');
      await fs.rename(`${file}.tmp`, file);
    }).finally(() => { pendingCount--; });
    pending = operation.catch(() => {});
    return operation;
  }
  return { load, save, hasPendingSaves: () => pendingCount > 0, flush: () => pending };
}
