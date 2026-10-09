import fs from 'node:fs/promises';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '..');
// Only remove these two generated folders inside this checkout.
for (const folder of ['dist', 'dist-desktop']) {
  const target = path.resolve(projectRoot, folder);
  if (path.dirname(target) !== projectRoot) throw new Error('Build output is outside the project');
  const info = await fs.lstat(target).catch(error => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  if (info?.isSymbolicLink()) throw new Error('Refusing to clean a linked build directory');
  await fs.rm(target, { recursive: true, force: true });
}
