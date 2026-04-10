const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getToken: () => ipcRenderer.invoke('get-token'),
  getPort: () => ipcRenderer.invoke('get-port'),
  getBasePath: () => ipcRenderer.invoke('get-base-path'),
})
