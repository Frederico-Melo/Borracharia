const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  saveReportPdf: (html) => ipcRenderer.invoke('report:save-pdf', html),
});
