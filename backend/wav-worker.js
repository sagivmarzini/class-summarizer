"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wavWorker = void 0;
var wavWorker = function () {
    self.onmessage = function (e) {
        var audioData = e.data.buffer;
        var numChannels = audioData.numberOfChannels;
        var sampleRate = audioData.sampleRate;
        var format = 1; // PCM
        var bitDepth = 16;
        var result = new Float32Array(audioData.length * numChannels);
        // Reconstruct audio data from channels
        for (var channel = 0; channel < numChannels; channel++) {
            var channelData = audioData.channelData[channel];
            for (var i = 0; i < channelData.length; i++) {
                result[i * numChannels + channel] = channelData[i];
            }
        }
        // Create WAV header
        var dataSize = result.length * (bitDepth / 8);
        var header = new ArrayBuffer(44);
        var view = new DataView(header);
        // Write WAV header
        writeString(view, 0, "RIFF");
        view.setUint32(4, 36 + dataSize, true);
        writeString(view, 8, "WAVE");
        writeString(view, 12, "fmt ");
        view.setUint32(16, 16, true);
        view.setUint16(20, format, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
        view.setUint16(32, numChannels * (bitDepth / 8), true);
        view.setUint16(34, bitDepth, true);
        writeString(view, 36, "data");
        view.setUint32(40, dataSize, true);
        // Convert to 16-bit PCM
        var samples = new Int16Array(result.length);
        for (var i = 0; i < result.length; i++) {
            var s = Math.max(-1, Math.min(1, result[i]));
            samples[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        // Create final Blob
        var blob = new Blob([header, samples.buffer], { type: "audio/wav" });
        self.postMessage(blob);
    };
    function writeString(view, offset, string) {
        for (var i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }
};
exports.wavWorker = wavWorker;
