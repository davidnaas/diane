var electron = require('electron');
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;
var ipcMain = electron.ipcMain;
var parent = require('./ipc')(process);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow;
var actionQueue = [];

function createWindow() {
  mainWindow = new BrowserWindow({width: 800, height: 600});
  // mainWindow = new BrowserWindow({width: 0, height: 0});
  mainWindow.loadURL('file://' + __dirname + '/index.html');
  mainWindow.webContents.openDevTools();

  mainWindow.webContents.on('did-finish-load', () => {
    actionQueue.forEach((action) => {
      mainWindow.webContents.send('action', action);
    });
  })
  app.dock.hide();
}

app.on('ready', createWindow);

// Incoming action from main process
parent.on('action', function(action) {
  actionQueue.push(action)
});

ipcMain.on('rendererResponse', function(event, msg) {
  parent.emit('response', msg);
})
