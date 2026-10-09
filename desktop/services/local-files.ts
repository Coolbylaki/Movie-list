import fs from 'node:fs/promises';
import path from 'node:path';

export async function resolveMovieFolder(movieRoot: string, folderName: unknown): Promise<string> {
  if (!movieRoot) throw new Error('Choose your movie library in Settings first.');
  if (typeof folderName !== 'string' || !folderName.trim() || folderName === '.' || folderName === '..' || /[\\/:\0]/.test(folderName)) {
    throw new Error('Invalid movie folder.');
  }
  try {
    const root = await fs.realpath(movieRoot);
    const folder = await fs.realpath(path.join(root, folderName));
    const relative = path.relative(root, folder);
    if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      throw new Error('The movie folder is outside your library.');
    }
    if (!(await fs.stat(folder)).isDirectory()) throw new Error('The movie folder is not a directory.');
    return folder;
  } catch (error) {
    throw new Error('Could not find this movie folder in your library. It may have been moved or removed. Refresh the library and try again.', { cause: error });
  }
}

export async function openMovieFolder(movieRoot: string, folderName: unknown, openPath: (folder: string) => Promise<string>): Promise<void> {
  const folder = await resolveMovieFolder(movieRoot, folderName);
  const error = await openPath(folder);
  if (error) throw new Error('Windows could not open this movie folder. Please try again.');
}
