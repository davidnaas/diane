#!/usr/bin/env node --harmony

/**
 * This is the main process started by the diane command.
 * It has two main responsibilities, starting the child process
 * running electron where all the audio stuff happens and
 * handling in/out communication with the user.
 */

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

var isRecordingActionList = {
  type: 'list',
  name: 'action',
  message: "Currently recording...",
  choices: [
    'Stop',
    new inquirer.Separator(),
    'Exit'
   ]
}

// Runner contains the electron process
var runner = path.join(__dirname, 'runner.js');

// Excite the electron
var proc = childProcess.spawn(electronPath, [runner],  {
  stdio: [null, null, null, 'ipc']
});

// Propagate all logs from electron child process to log file
proc.stdout.on('data', function(data) {
  log(data.toString()); 
});

const child = ipc(proc);

function exit() {
  child.emit('action', 'quit')
}


function generatePlayActionList() {
  var isRecordingActionList = {
    type: 'list',
    name: 'action',
    message: "Choose a file to play",
    choices: [
      'Stop',
      new inquirer.Separator(),
      'Exit'
     ]
  }
}

function playPrompt() {
  inquirer.prompt(generatePlayActionList)
    .then((answer) => {
      var action = answer.action;
    });
}

function defaultPrompt() {
  inquirer.prompt([defaultActionList])
    .then((answer) => {
      var action = answer.action;
      if (action === 'Record') {
        child.emit('action', 'rec');
        isRecordingPrompt()
      } else if (action === 'Play') {
        child.emit('action', 'play');
        playPrompt();
      } else if (action === 'Exit') {
        exit();
      }
    });
}

function isRecordingPrompt() {
  inquirer.prompt([isRecordingActionList])
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
