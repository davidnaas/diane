#!/usr/bin/env node --harmony
var electronPath = require('electron-prebuilt');
var childProcess = require('child_process');
var path = require('path');
var ipc = require('./ipc');
var program = require('commander');

// Runner contains the main electron thread
var runner = path.join(__dirname, 'runner.js');

// Excite the electron
var proc = childProcess.spawn(electronPath, [runner],  {
  stdio: [null, null, null, 'ipc']
});

// Propagate all logs from electron child process to main 
proc.stdout.on('data', function(data) {
  console.log('proc.stdout.on'); 
  console.log(data.toString()); 
});

// CLI interactions
var child = ipc(proc);

program
  .arguments('<action>')
  .action(function(action) {
    // Let electron process decide what to do
    child.emit('action', action);
  })
  .parse(process.argv);

// Response from electron process
child.on('response', function(msg) {
  console.log('child.on');
  console.log(msg);
  if (msg.type === 'blob') {
    console.log(msg.content);  
  }
});
