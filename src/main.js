#!/usr/bin/env node --harmony
var electronPath = require('electron-prebuilt');
var childProcess = require('child_process');
var path = require('path');
var ipc = require('./ipc');
var program = require('commander');
var dianeVersion = require('../package.json').version;
var inquirer = require('inquirer');
var ui = new inquirer.ui.BottomBar();
var fs = require('fs');

function log(msg) {
  fs.appendFile('.log', '\n' + msg);
}

var defaultActionList = {
  type: 'list',
  name: 'action',
  message: "What would you like to do",
  choices: [
    'Record',
    'Play',
    new inquirer.Separator(),
    'Exit'
   ]
}

var isRecoringActionList = {
  type: 'list',
  name: 'action',
  message: "Currently recording...",
  choices: [
    'Stop',
    new inquirer.Separator(),
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
  log(data.toString()); 
});

function exit() {
  child.emit('action', 'quit')
}

var child = ipc(proc);

function defaultPrompt() {
  inquirer.prompt([defaultActionList])
    .then((answer) => {
      var action = answer.action;
      if (action === 'Record') {
        child.emit('action', 'rec');
        isRecordingPrompt()
      } else if (action === 'Play') {
        child.emit('action', 'play');
        defaultPrompt();
      } else if (action === 'Exit') {
        exit();
      }
    });
}

function isRecordingPrompt() {
  inquirer.prompt([isRecoringActionList])
    .then((answer) => {
      var action = answer.action;
      if (action === 'Stop') {
        child.emit('action', 'stop');
        defaultPrompt();
      } else if (action === 'Exit') {
        exit();
      }
    });
}

// Response from electron process
child.on('response', function(msg) {
  log(msg)

  if(msg === 'quit') {
    process.exit(1);
  }
});

defaultPrompt();
