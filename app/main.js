'use strict';

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');

require('@electron/remote/main').initialize();

const DEBUG = true;

const createWindow = () => {
    const win = new BrowserWindow({
        title: 'Stormcaster',
        icon: './public/icon.png',
        frame: true,
        minWidth: 1600,
        minHeight: 900,
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
            nodeIntegrationInSubFrames: true,
            enableRemoteModule: true,
            contextIsolation: false,
        }
    })
    win.setMenuBarVisibility(false);
    win.setAspectRatio(16/9);
    win.maximize();
    win.loadFile('index.html');
    if(DEBUG) win.webContents.openDevTools();
    require('@electron/remote/main').enable(win.webContents);

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