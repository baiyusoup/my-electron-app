const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  importScores: () => ipcRenderer.invoke('scores:import'),
  exportScores: (payload) => ipcRenderer.invoke('scores:export', payload)
})
