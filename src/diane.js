var fs = require('fs');
var ipcRenderer = require('electron').ipcRenderer;
var recorderCreator = require('./recorder');

var ctx = new AudioContext();
var recorder = recorderCreator(ctx, ipcRenderer.send);

ipcRenderer.on('action', function (event, action) {
  if (action === 'rec') {
    navigator.webkitGetUserMedia({ audio:true },
    function success(e) {
      var audioInput = ctx.createMediaStreamSource(e);
      audioInput.connect(recorder);
      recorder.connect(ctx.destination);
    },
    function fail(e) {
      ipcRenderer.send('rendererResponse', 'Error requesting user microphone');
    });
  } else if (action === 'stop') {
    stop();
  } else if (action === 'play') {
    // pass in file name here
    play();
  }
});

function play() {
  try {
    var audio = new Audio('file://' + process.env.DIANE_PATH + '1486328268886.wav');
  } catch (e) {
    ipcRenderer.send('rendererResponse', 'Error playing file');
  }
  audio.play();
}

function writeFile(encodedAudio) {
  var buf = new Buffer(encodedAudio, 'base64');
  var fileName = process.env.DIANE_PATH + Date.now().toString() + '.wav';
  
  fs.writeFile(fileName, buf, function(err) {
    if(err) {
      ipcRenderer.send('rendererResponse', 'Error writing file');
    } else {
      ipcRenderer.send('rendererResponse', 'Wrote file');
    }
  });
}

function stop() {
  recorder.stop((encodedAudio) => {
    fs.stat(process.env.DIANE_PATH, function (err, stats){
      if (err) {
        fs.mkdir(process.env.DIANE_PATH);
      }
      if (!stats.isDirectory()) {
        ipcRenderer.send('rendererResponse', 'The specifed DIANE_PATH is not a directory');
      }
      writeFile(encodedAudio)
    });
  });
}
