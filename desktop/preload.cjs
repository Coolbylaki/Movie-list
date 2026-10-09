const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktop', {
  loadMovies: () => ipcRenderer.invoke('library:movies'),
  loadDetails: (id) => ipcRenderer.invoke('library:details', id),
  openMovieFolder: (folderName) => ipcRenderer.invoke('library:open-folder', folderName),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  chooseFolder: () => ipcRenderer.invoke('settings:folder'),
});
