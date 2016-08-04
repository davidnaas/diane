var fs = require('fs');
var ipcRenderer = require('electron').ipcRenderer;
var recorderCreator = require('./recorder');

var ctx = new AudioContext();
var recorder = recorderCreator(ctx, ipcRenderer.send);

ipcRenderer.on('action', function (event, action) {
  navigator.webkitGetUserMedia({ audio:true },
  function success(e) {
    ipcRenderer.send('rendererResponse', 'CONNECT INPUT');
    var audioInput = ctx.createMediaStreamSource(e);
    audioInput.connect(recorder);
    recorder.connect(ctx.destination);
      // Do stuff like record, stop, play etc. based on 'action'
      if (action === 'rec') {
        record();
      }
  },
  function fail(e) {
    ipcRenderer.send('rendererResponse', 'Error requesting user microphone');
  });
});

function record() {
  var timer = window.setTimeout(() => {
    window.clearTimeout(timer);
    var blob = recorder.stop((encodedAudio) => {
      var buf = new Buffer(encodedAudio, 'base64');
      fs.writeFile("test.wav", buf, function(err) {
        if(err) {
          ipcRenderer.send('rendererResponse', 'Error writing file');
        } else {
          ipcRenderer.send('rendererResponse', 'Wrote file');
        }
      });
    });
  }, 2000);
}