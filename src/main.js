#!/usr/bin/env node --harmony

/**
 * This is the main process started by the diane command.
 * It has two main responsibilities, starting the child process
 * running electron where all the audio stuff happens and
 * handling in/out communication with the user.
 */

var electronPath = require('electron');
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

function ls(pathName) {
  return fs.readdirSync(pathName).filter((file) => file.substring(0, 1) !== '.');
}

function generatePlayActionList(pathName) {
  const choices = ls(pathName);
  choices.push(new inquirer.Separator())
  choices.push('Exit')
  return {
    type: 'list',
    name: 'action',
    message: 'Choose a file to play',
    choices,
  }
}

function playPrompt(pathName) {
  inquirer.prompt([generatePlayActionList(pathName)])
    .then((answer) => {
      const action = answer.action;
      if (action !== 'Exit') {
        const fullPath = path.join(pathName, action)
        const isDir = fs.statSync(fullPath).isDirectory();
        if (isDir) {
          playPrompt(fullPath)
        } else {
          const file = path.parse(fullPath)
          if (file.ext === '.wav') {
            child.emit('action', { type: 'play', pathName: fullPath });
          }
        }
      } else {
        exit();
      }
    });
}

function defaultPrompt() {
  inquirer.prompt([defaultActionList])
    .then((answer) => {
      var action = answer.action;
      if (action === 'Record') {
        child.emit('action', 'rec');
        recordingPrompt()
      } else if (action === 'Play') {
        playPrompt(process.env.DIANE_PATH);
      } else if (action === 'Exit') {
        exit();
      }
    });
}

function recordingPrompt() {
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

  if (msg === 'Play ended') {
    defaultPrompt();
  }

  if(msg === 'quit') {
    process.exit(1);
  }
});

if(!process.env.DIANE_PATH) {
  console.log('Please set your DIANE_PATH where recordings will be saved and try again')
  process.exit(1)
}

defaultPrompt();
