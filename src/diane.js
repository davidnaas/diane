/**
 * This runs inside of the chromium part of electron.
 * Hence, it is here that all the audio stuff can be done.
 */

var fs = require('fs');
var ipcRenderer = require('electron').ipcRenderer;
var recorderCreator = require('./recorder');
var format = require('date-fns/format');

var ctx = new AudioContext();
var recorder = recorderCreator(ctx);

function play(pathName) {
  try {
    var audio = new Audio('file://' + pathName);
    audio.addEventListener('ended', () => {
     ipcRenderer.send('rendererResponse', 'Play ended');  
    });
  } catch (e) {
    ipcRenderer.send('rendererResponse', 'Error playing file');
  }
  audio.play();
}

function checkPath(path) {
  const parts = path.split('/');
  parts.forEach(function(part, i) {
    const aggregatedPath = parts.slice(0, i + 1).join('/');
    fs.stat(aggregatedPath, function (err, stats){
      if (err) {
        fs.mkdir(aggregatedPath);
      }
      if (stats && !stats.isDirectory()) {
        ipcRenderer.send('rendererResponse', aggregatedPath + ' already exists but is not a directory');
      }
    });
  });
}

function writeFile(encodedAudio) {
  var buf = new Buffer(encodedAudio, 'base64');
  var now = new Date();
  var year = format(now, 'YYYY');
  var month = format(now, 'MMMM');
  var dayOfMonth = format(now, 'Do');
  var hour = format(now, 'HH');
  var minute = format(now, 'mm');
  var second = format(now, 'ss');

  var path = `${process.env.DIANE_PATH}${year}/${month}/${dayOfMonth}`;
  var fileName = `${path}/${hour}.${minute}.${second}.wav`;
  ipcRenderer.send('rendererResponse', fileName);
  checkPath(fileName)
  ipcRenderer.send('rendererResponse',fileName)
  fs.writeFile(fileName, buf, function(err) {
    if(err) {
      ipcRenderer.send('rendererResponse', err);
    } else {
      ipcRenderer.send('rendererResponse', 'Wrote file');
    }
  });
}

function stop() {
  recorder.stop((encodedAudio) => {
    writeFile(encodedAudio)
  });
}

function record() {
  navigator.webkitGetUserMedia(
    { audio: true },
    function success(e) {
      var audioInput = ctx.createMediaStreamSource(e);
      audioInput.connect(recorder);
      recorder.connect(ctx.destination);
    },
    function fail(e) {
      ipcRenderer.send('rendererResponse', 'Error requesting user microphone');
    }
  );
}

ipcRenderer.on('action', function (event, action) {
  if (action === 'rec') {
    record()
  } else if (action === 'stop') {
    stop();
  } else if (action.type === 'play') {
    // pass in file name here
    play(action.pathName);
  }
});
