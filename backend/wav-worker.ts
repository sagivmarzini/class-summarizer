export const wavWorker = function () {
  self.onmessage = function (e) {
    const audioData = e.data.buffer;
    const numChannels = audioData.numberOfChannels;
    const sampleRate = audioData.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    let result = new Float32Array(audioData.length * numChannels);

    // Reconstruct audio data from channels
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = audioData.channelData[channel];
      for (let i = 0; i < channelData.length; i++) {
        result[i * numChannels + channel] = channelData[i];
      }
    }

    // Create WAV header
    const dataSize = result.length * (bitDepth / 8);
    const header = new ArrayBuffer(44);
    const view = new DataView(header);

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
    const samples = new Int16Array(result.length);
    for (let i = 0; i < result.length; i++) {
      const s = Math.max(-1, Math.min(1, result[i]));
      samples[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    // Create final Blob
    const blob = new Blob([header, samples.buffer], { type: "audio/wav" });
    self.postMessage(blob);
  };

  function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
};
