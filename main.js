// main.js

const { app, BrowserWindow } = require('electron');
const { ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');


function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });
    mainWindow.loadFile('index.html');
}

ipcMain.handle('dialog:openDirectory', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('fs:listDirectory', async (_event, dirPath) => {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    return entries.map(e => ({
      name: e.name,
      isDir: e.isDirectory(),
      path: path.join(dirPath, e.name)
    }));
  } catch (err) {
    console.error('fs:listDirectory error:', err);
    return [];
  }
});

ipcMain.handle('fs:readFile', async (_event, filePath) => {
  const fs = require('fs');
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error('fs:readFile error:', err);
    return '';
  }
});


app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});