const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;
const parent = require('./ipc')(process);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow;

/*
  Use the intial aciton pattern if a action should be fired at once.
  This will queue it until the webContents is loaded.
*/
// var initialAction;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 0,
    height: 0,
    show: false
  });
  mainWindow.loadURL('file://' + __dirname + '/index.html');
  mainWindow.webContents.openDevTools();

  // mainWindow.webContents.on('did-finish-load', () => {
  //   mainWindow.webContents.send('action', initialAction);
  // });
  app.dock.hide();
}

app.on('ready', createWindow);

// Incoming action from main process
parent.on('action', function(action) {
  if (action === 'quit') {
    app.quit();
    parent.emit('response', 'quit');
  } else {
    mainWindow.webContents.send('action', action);
  }

  // if (!initialAction) {
  //   initialAction = action;
  // } else {
  //   mainWindow.webContents.send('action', action);
  // }
});

ipcMain.on('rendererResponse', function(event, msg) {
  parent.emit('response', msg);
})
