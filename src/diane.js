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
  }
});

function stop() {
  recorder.stop((encodedAudio) => {
    var buf = new Buffer(encodedAudio, 'base64');
    fs.writeFile("test.wav", buf, function(err) {
      if(err) {
        ipcRenderer.send('rendererResponse', 'Error writing file');
      } else {
        ipcRenderer.send('rendererResponse', 'Wrote file');
      }
    });
  });
}
