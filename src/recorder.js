// Stolen from http://typedarray.org/from-microphone-to-wav-with-getusermedia-and-web-audio
var send = null;

function mergeBuffers(channelBuffer, recordingLength){
  var result = new Float32Array(recordingLength);
  var offset = 0;
  var lng = channelBuffer.length;
  for (var i = 0; i < lng; i++){
    var buffer = channelBuffer[i];
    result.set(buffer, offset);
    offset += buffer.length;
  }
  return result;
}

function interleave(leftChannel, rightChannel){
  var length = leftChannel.length + rightChannel.length;
  var result = new Float32Array(length);

  var inputIndex = 0;

  for (var index = 0; index < length; ){
    result[index++] = leftChannel[inputIndex];
    result[index++] = rightChannel[inputIndex];
    inputIndex++;
  }
  return result;
}

function writeUTFBytes(view, offset, string){ 
  var lng = string.length;
  for (var i = 0; i < lng; i++){
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function getWAV(interleaved, sampleRate) {
  // create the buffer and view to create the .WAV file
  var buffer = new ArrayBuffer(44 + interleaved.length * 2);
  var view = new DataView(buffer);

  // write the WAV container, check spec at: https://ccrma.stanford.edu/courses/422/projects/WaveFormat/
  // RIFF chunk descriptor
  writeUTFBytes(view, 0, 'RIFF');
  view.setUint32(4, 44 + interleaved.length * 2, true);
  writeUTFBytes(view, 8, 'WAVE');
  // FMT sub-chunk
  writeUTFBytes(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  // stereo (2 channels)
  view.setUint16(22, 2, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 4, true);
  view.setUint16(32, 4, true);
  view.setUint16(34, 16, true);
  // data sub-chunk
  writeUTFBytes(view, 36, 'data');
  view.setUint32(40, interleaved.length * 2, true);

  // write the PCM samples
  var lng = interleaved.length;
  var index = 44;
  var volume = 1;
  for (var i = 0; i < lng; i++){
    view.setInt16(index, interleaved[i] * (0x7FFF * volume), true);
    index += 2;
  }

  // our final binary blob that we can hand off
  return new Blob ([view], { type : 'audio/wav' });
}

// found on stackoverflow
function blobToBase64(blob, cb) {
  var reader = new FileReader();
  reader.onload = function() {
    var dataUrl = reader.result;
    var base64 = dataUrl.split(',')[1];
    cb(base64);
  };
  reader.readAsDataURL(blob);
};

function recorderCreator(context, ipcSend) {
  send = ipcSend;
  var bufferSize = 2048;
  var recorder = context.createScriptProcessor(bufferSize, 2, 2);
  recorder.recordingLength = 0;
  recorder.leftChannel = [];
  recorder.rightChannel = [];

  recorder.onaudioprocess = function(e) {
    var left = e.inputBuffer.getChannelData(0);
    var right = e.inputBuffer.getChannelData(1);
    // we clone the samples
    this.leftChannel.push(new Float32Array(left));
    this.rightChannel.push(new Float32Array(right));
    this.recordingLength += bufferSize;
  }.bind(recorder);

  recorder.stop = function(cb) {
    var left = mergeBuffers(this.leftChannel, this.recordingLength);
    var right = mergeBuffers(this.rightChannel, this.recordingLength);
    var interleavedChannels = interleave(left, right);
    var blob = getWAV(interleavedChannels, context.sampleRate)
    recorder.disconnect();
    blobToBase64(blob, (base64) => {
      cb(base64);
    });
  }.bind(recorder);

  return recorder;
}

module.exports = recorderCreator;