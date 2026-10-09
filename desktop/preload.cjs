const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktop', {
  loadMovies: () => ipcRenderer.invoke('library:movies'),
  loadDetails: (id) => ipcRenderer.invoke('library:details', id),
  searchMatches: (query, year) => ipcRenderer.invoke('library:search-matches', query, year),
  correctMatch: (folderName, id) => ipcRenderer.invoke('library:correct-match', folderName, id),
  openMovieFolder: (folderName) => ipcRenderer.invoke('library:open-folder', folderName),
  listMovieVideos: (folderName) => ipcRenderer.invoke('library:videos', folderName),
  playMovieVideo: (folderName, relativePath) => ipcRenderer.invoke('library:play', folderName, relativePath),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  chooseFolder: () => ipcRenderer.invoke('settings:folder'),
});
