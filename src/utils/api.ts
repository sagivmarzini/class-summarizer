import { wavWorker } from "./wav-worker";
import { transcribeAudio, summarizeText } from "./apiClient";

// Length of each chunk in minutes
const CHUNK_LENGTH_MINUTES = 5;

// Audio processing functions
async function compressAudioBuffer(
  buffer: AudioBuffer,
  targetSampleRate = 16000
): Promise<AudioBuffer> {
  const offlineContext = new OfflineAudioContext(
    1, // mono
    Math.ceil(buffer.duration * targetSampleRate),
    targetSampleRate
  );

  const source = offlineContext.createBufferSource();
  source.buffer = buffer;
  source.connect(offlineContext.destination);
  source.start(0);

  return await offlineContext.startRendering();
}

async function createAudioChunk(
  compressedBuffer: AudioBuffer,
  startTime: number,
  endTime: number
): Promise<Blob> {
  const currentChunkDuration = endTime - startTime;

  const offlineContext = new OfflineAudioContext(
    1, // mono
    Math.floor(currentChunkDuration * compressedBuffer.sampleRate),
    compressedBuffer.sampleRate
  );

  const source = offlineContext.createBufferSource();
  source.buffer = compressedBuffer;
  source.connect(offlineContext.destination);
  source.start(0, startTime, currentChunkDuration);

  const renderedBuffer = await offlineContext.startRendering();
  return await convertBufferToWavBlob(renderedBuffer);
}

async function convertBufferToWavBlob(renderedBuffer: AudioBuffer): Promise<Blob> {
  const audioData = {
    numberOfChannels: renderedBuffer.numberOfChannels,
    sampleRate: renderedBuffer.sampleRate,
    length: renderedBuffer.length,
    channelData: Array.from(
      { length: renderedBuffer.numberOfChannels },
      (_, channel) => renderedBuffer.getChannelData(channel).slice()
    ),
  };

  return await new Promise<Blob>((resolve) => {
    const worker = new Worker(
      URL.createObjectURL(
        new Blob([`(${wavWorker.toString()})()`], {
          type: "application/javascript",
        })
      )
    );
    worker.onmessage = (e) => resolve(e.data);
    worker.postMessage({ buffer: audioData });
  });
}

async function splitAudioFile(file: File): Promise<Blob[]> {
  const audioContext = new AudioContext();
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  const compressedBuffer = await compressAudioBuffer(audioBuffer);

  const durationInSeconds = compressedBuffer.duration;
  const chunkDurationSeconds = CHUNK_LENGTH_MINUTES * 60;
  const numberOfChunks = Math.ceil(durationInSeconds / chunkDurationSeconds);

  console.log(
    "Compressed audio - Duration:",
    durationInSeconds/60,
    "minutes, Number of chunks:",
    numberOfChunks,
    "Sample rate:",
    compressedBuffer.sampleRate
  );

  const chunkPromises = Array.from({ length: numberOfChunks }, async (_, i) => {
    const startTime = i * chunkDurationSeconds;
    const endTime = Math.min((i + 1) * chunkDurationSeconds, durationInSeconds);
    return await createAudioChunk(compressedBuffer, startTime, endTime);
  });

  return await Promise.all(chunkPromises);
}

// Transcription functions
async function transcribe(audioFile: File): Promise<string> {
  try {
    const chunks = await splitAudioFile(audioFile);
    let fullTranscription = '';

    // Process chunks sequentially instead of in parallel
    for (const chunk of chunks) {
      try {
        const transcription = await transcribeAudio(chunk);
        fullTranscription += transcription + ' ';
      } catch (error) {
        console.error('Error transcribing chunk:', error);
        // If a chunk fails, continue with the next one
        continue;
      }
    }

    if (!fullTranscription.trim()) {
      throw new Error('Failed to transcribe any audio chunks');
    }

    return fullTranscription.trim();
  } catch (error) {
    console.error('Error in transcribe function:', error);
    throw error;
  }
}

// Summarization functions
async function summarizeTranscriptionClaude(transcription: string): Promise<string> {
  return await summarizeText(transcription);
}

// Export all used functions
export {
  transcribe,
  summarizeTranscriptionClaude,
  splitAudioFile,
  compressAudioBuffer,
  createAudioChunk,
  convertBufferToWavBlob
};
