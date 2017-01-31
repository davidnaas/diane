#!/usr/bin/env node --harmony
var electronPath = require('electron-prebuilt');
var childProcess = require('child_process');
var path = require('path');
var ipc = require('./ipc');
var program = require('commander');
var dianeVersion = require('../package.json').version;
var inquirer = require('inquirer');
var ui = new inquirer.ui.BottomBar();

var actionList = {
  type: 'list',
  name: 'action',
  message: "I will tell you three things",
  choices: [
    'Stop',
    'Play',
    'Exit'
   ]
}

// Runner contains the main electron thread
var runner = path.join(__dirname, 'runner.js');

// Excite the electron
var proc = childProcess.spawn(electronPath, [runner],  {
  stdio: [null, null, null, 'ipc']
});

// Propagate all logs from electron child process to main 
proc.stdout.on('data', function(data) {
  console.log(data.toString()); 
});

var child = ipc(proc);

// Start recording at once
child.emit('action', 'rec');
prompt();

function prompt() {
  inquirer.prompt([actionList])
    .then((answer) => {
      var action = answer.action;
      if (action === 'Stop') {
        child.emit('action', 'stop');
      } else if (action === 'Exit') {
        process.exit(1);
      }
    });
}

// Response from electron process
child.on('response', function(msg) {
  console.log(msg) 
  if (msg === 'Wrote file') {
    prompt();
  }
});
