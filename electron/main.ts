import { app, BrowserWindow, dialog, ipcMain, Menu } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { createBackend } from '../backend/src/app';

let mainWindow: BrowserWindow | null = null;
let backend: ReturnType<typeof createBackend> | null = null;
let apiBase = '';

const getPort = async (): Promise<number> => new Promise((resolve, reject) => {
  const net = require('node:net');
  const server = net.createServer();
  server.on('error', reject);
  server.listen(0, '127.0.0.1', () => {
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    server.close(() => resolve(port));
  });
});

const createWindow = async () => {
  const port = await getPort();
  const userData = app.getPath('userData');
  const migrationsPath = app.isPackaged
    ? path.join(process.resourcesPath, 'migrations')
    : path.join(app.getAppPath(), 'database', 'migrations');
  backend = createBackend({
    databasePath: path.join(userData, 'database', 'pneu-pro.db'),
    migrationsPath,
    backupDir: path.join(userData, 'backups'),
  });
  backend.backups.autoBackupIfNeeded();
  await new Promise<void>((resolve) => backend!.app.listen(port, '127.0.0.1', () => resolve()));
  apiBase = `http://127.0.0.1:${port}/api`;
  mainWindow = new BrowserWindow({
    width: 1360, height: 850, minWidth: 1080, minHeight: 680,
    title: 'Pneu Pro Gestão',
    backgroundColor: '#f4f7f7',
    webPreferences: { contextIsolation: true, nodeIntegration: false, preload: path.join(__dirname, 'preload.cjs') },
  });
  const query = { api: apiBase };
  if (!app.isPackaged) await mainWindow.loadURL(`http://127.0.0.1:5173?api=${encodeURIComponent(apiBase)}`);
  else await mainWindow.loadFile(path.join(__dirname, '../frontend/index.html'), { query });
  mainWindow.on('closed', () => { mainWindow = null; });
};

app.whenReady().then(async () => {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Arquivo', submenu: [{ role: 'reload', label: 'Atualizar tela' }, { type: 'separator' }, { role: 'quit', label: 'Sair' }] },
    { label: 'Editar', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
  ]));
  await createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) void createWindow(); });
});

ipcMain.handle('report:save-pdf', async (_event, html: string) => {
  const target = await dialog.showSaveDialog({ title: 'Salvar relatório em PDF', defaultPath: `relatorio-pneu-pro-${new Date().toISOString().slice(0, 10)}.pdf`, filters: [{ name: 'PDF', extensions: ['pdf'] }] });
  if (target.canceled || !target.filePath) return { canceled: true };
  const printWindow = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
  await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  const pdf = await printWindow.webContents.printToPDF({ printBackground: true, pageSize: 'A4' });
  fs.writeFileSync(target.filePath, pdf);
  printWindow.close();
  return { canceled: false, path: target.filePath };
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', () => backend?.database.close());
