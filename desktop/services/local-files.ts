import fs from 'node:fs/promises';
import path from 'node:path';
import type { MovieVideo } from '../../shared/desktop.js';

const videoExtensions = new Set(['.mkv', '.mp4', '.avi', '.mov', '.m4v', '.webm', '.wmv', '.mpg', '.mpeg', '.ts', '.m2ts', '.flv', '.ogv', '.vob']);

function inside(root: string, target: string) {
  const relative = path.relative(root, target);
  return Boolean(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

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

export async function listMovieVideos(movieRoot: string, folderName: unknown): Promise<MovieVideo[]> {
  const folder = await resolveMovieFolder(movieRoot, folderName);
  const videos: MovieVideo[] = [];
  const visited = new Set([folder.toLowerCase()]);
  async function scan(directory: string) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const candidate = path.join(directory, entry.name);
      // Resolve each entry so directory junctions cannot lead outside this movie folder.
      const resolved = await fs.realpath(candidate);
      if (!inside(folder, resolved) || entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        if (visited.has(resolved.toLowerCase())) continue;
        visited.add(resolved.toLowerCase());
        await scan(candidate);
      }
      else if (entry.isFile() && videoExtensions.has(path.extname(entry.name).toLowerCase())) {
        videos.push({ relativePath: path.relative(folder, candidate), size: (await fs.stat(resolved)).size });
      }
    }
  }
  await scan(folder);
  return videos.sort((a, b) => b.size - a.size || a.relativePath.localeCompare(b.relativePath));
}

export async function playMovieVideo(movieRoot: string, folderName: unknown, relativePath: unknown, openPath: (file: string) => Promise<string>): Promise<void> {
  if (typeof relativePath !== 'string' || !relativePath || /[:\0]/.test(relativePath) || path.isAbsolute(relativePath) || relativePath.split(/[\\/]/).some(part => part === '..' || part === '.' || !part)) {
    throw new Error('Invalid video file.');
  }
  const folder = await resolveMovieFolder(movieRoot, folderName);
  let file: string;
  try {
    file = await fs.realpath(path.join(folder, relativePath));
    if (!inside(folder, file) || !videoExtensions.has(path.extname(file).toLowerCase()) || !(await fs.stat(file)).isFile()) {
      throw new Error('Not a video inside this movie folder.');
    }
  } catch (error) {
    throw new Error('This video could not be found in the movie folder. Close the details and try again.', { cause: error });
  }
  const error = await openPath(file);
  if (error) throw new Error('Windows could not play this video. Set VLC or another video player as the default app for this file type, then try again.');
}
