'use strict';

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');

require('@electron/remote/main').initialize();

const createWindow = () => {
    const win = new BrowserWindow({
        title: 'Stormcaster',
        icon: './public/icon.png',
        frame: true,
        minWidth: 400,
        minHeight: 300,
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
            nodeIntegrationInSubFrames: true,
            enableRemoteModule: true,
            contextIsolation: false,
        }
    })
    win.setMenuBarVisibility(false);
    win.setAspectRatio(4/3);
    win.loadFile('index.html');
    win.webContents.openDevTools();
    require('@electron/remote/main').enable(win.webContents);

    ipcMain.handle('dark-mode:toggle', () => {
        if (nativeTheme.shouldUseDarkColors) {
          nativeTheme.themeSource = 'light'
        } else {
          nativeTheme.themeSource = 'dark'
        }
        return nativeTheme.shouldUseDarkColors
    });
    
    ipcMain.handle('dark-mode:system', () => {
        nativeTheme.themeSource = 'system'
    });

    win.setAlwaysOnTop(true);
    app.focus();
    win.setAlwaysOnTop(false);
};

app.whenReady().then(() => {
    createWindow();
//
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    };
});