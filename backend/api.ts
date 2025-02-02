import OpenAI, { toFile } from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { wavWorker } from "./wav-worker";
import * as dotenv from "dotenv";

dotenv.config();

const AUDIO_SLICE_AMOUNT = 5;

const openaiApiKey = process.env.OPENAI_API_KEY;
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

const openai = new OpenAI({
  apiKey: openaiApiKey,
  dangerouslyAllowBrowser: true,
});

const anthropic = new Anthropic({
  apiKey: anthropicApiKey,
});

export async function compressAudioBuffer(
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
export async function splitAudioFile(file: File): Promise<Blob[]> {
  const audioContext = new AudioContext();
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // Compress the audio first
  const compressedBuffer = await compressAudioBuffer(audioBuffer);

  const durationInSeconds = compressedBuffer.duration;
  const chunkDuration = durationInSeconds / AUDIO_SLICE_AMOUNT;

  console.log(
    "Compressed audio - Duration:",
    durationInSeconds / 60,
    "Sample rate:",
    compressedBuffer.sampleRate
  );

  const chunks: Blob[] = [];

  for (let i = 0; i < AUDIO_SLICE_AMOUNT; i++) {
    const startTime = i * chunkDuration;
    const endTime = Math.min((i + 1) * chunkDuration, durationInSeconds);
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

    // Extract the raw audio data
    const audioData = {
      numberOfChannels: renderedBuffer.numberOfChannels,
      sampleRate: renderedBuffer.sampleRate,
      length: renderedBuffer.length,
      channelData: Array.from(
        { length: renderedBuffer.numberOfChannels },
        (_, channel) => renderedBuffer.getChannelData(channel).slice()
      ),
    };

    const wavBlob = await new Promise<Blob>((resolve) => {
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

    chunks.push(wavBlob);
  }

  return chunks;
}

export async function transcribe(audioFile: File) {
  console.log("Transcribing audio: ", audioFile.name);
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: await toFile(audioFile, "audio.wav", {
        type: "audio/wav",
      }),
      model: "whisper-1",
      language: "he",
      prompt: `This transcript is of a teacher from a class, in Israel, in Hebrew.
        There will be Hebrew names, verses from bible and Gemarah, etc.`,
    });
    return transcription.text;
  } catch (error) {
    console.error("Error during transcription:", error);
    throw error;
  }
}

export async function summarizeTranscriptionGPT(transcription: string) {
  console.log("Summarizing transcription...");
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `מצורף תמליל של שיעור. רוב התמליל יהיה מילותיו של המורה מדבר.
            התמליל עלול להיות עם טעויות אבל אתה יכול להבין מה המורה אמר במקור.
            אתה תלמיד חרוץ וגאון שתמיד משתמש בשיטת קורנל (Cornell's Method) לסיכום שיעור במחברת.
            אתה צריך לקחת את כל התוכן של השיעור והחומר הנלמד ולכתוב אותו באורך שימלא דף שלם של מחברת (A4).
            תשתמש בשיטת קורנל כדי לסכם את החומר ל:
            - כותרת
            - תוכן
            - נקודות, רמזים, שאלות, מושגי מפתח
            - סיכום
            דמיין שהדף מחולק ל2 שליש התוכן, בצד הנקודות הצדדיות, ובשליש התחתון הסיכום של כל הדף.
            תחזיר תוכן בעברית בלבד. השתמש בתבנית הבאה ותחזיר את התשובה שלך עם קוד JSON בלבד בלי שום הקדמה או תווים נוספים.
            פורמט הטקסט: HTML
            השתמש בתגים הבסיסיים של HTML כדי ליצור רשימות נקודות, רשימות ממוספרות, קו תחתון, ירידות שורה, פסקאות, הדגשות, איטליזציה, וכו׳.
            {
              "title": ""
              "notes": ""
              "cues": ""
              "summary": ""  
            }
            `,
      },
      {
        role: "user",
        content: transcription,
      },
    ],
    stream: false,
  });
  const text = response.choices[0].message.content;
  if (text === null) {
    throw new Error("Failed to get response content");
  }
  console.log(text);
  const parsed = JSON.parse(text);
  console.log(parsed);
  return text;
}

export async function summarizeTranscriptionClaude(transcription: string) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  console.log("Summarizing transcription with Claude...");
  const response = await anthropic.messages.create({
    model: "claude-3-sonnet-20240229",
    max_tokens: 4096,

    messages: [
      {
        role: "user",
        content: `
        You are a precise JSON generator and expert note-taker using the Cornell Method. Your task is to create a structured summary of a lecture transcript in Hebrew, formatted as a valid, parseable JSON object.

        OUTPUT CONSTRAINTS:
        1. Return ONLY a single-line JSON object
        2. NO text before or after the JSON object
        3. ALL strings must be properly escaped
        4. NO line breaks, tabs, or control characters in strings
        5. ALL HTML tags must be properly closed
        6. Use ONLY double quotes for JSON properties and values

        JSON STRUCTURE:
        {
          "title": "Brief descriptive title",
          "notes": "Main content with HTML formatting",
          "cues": "Key points with HTML formatting",
          "summary": "Concise summary with HTML formatting"
        }

        CONTENT GUIDELINES:
        - Title: Concise, informative (plain text, no HTML)
        - Notes (Main Section):
          * Comprehensive lecture content
          * Use <p>, <ul>, <li>, <strong>, <em> tags
          * Convert bullet points to <ul><li> format
          * Preserve Hebrew text direction
        - Cues (Side Section):
          * Key terms with definitions
          * Study questions
          * Important concepts
          * Use HTML lists for organization
        - Summary (Bottom Section):
          * Concise overview
          * Key takeaways
          * Single paragraph with <p> tags

        HEBREW LANGUAGE RULES:
        - All content must be in Hebrew
        - Correct any obvious transcription errors in quotes/verses
        - Maintain proper Hebrew text direction
        - Use correct Hebrew punctuation

        HTML FORMATTING:
        - Valid tags: <p>, <ul>, <li>, <ol>, <strong>, <em>, <br>
        - All tags must be properly closed
        - No attributes in HTML tags
        - No nested lists
        - No custom CSS or classes

        Example structure (but in Hebrew):
        {"title": "Topic Name", "notes": "<p>Main point</p><ul><li>Detail 1</li></ul>", "cues": "<ul><li>Key term: definition</li></ul>", "summary": "<p>Overview</p>"}

        Process the following transcript according to these specifications, ensuring the output is a valid, parseable JSON string:
        ${transcription}
            `,
      },
      {
        role: "user",
        content: transcription,
      },
    ],
  });

  const text = (response.content[0] as Anthropic.TextBlock).text;
  if (!text) {
    throw new Error("Failed to get response content");
  }

  console.log(text);
  const sanitizedJson = sanitizeJsonResponse(text);
  const parsed = JSON.parse(sanitizedJson);
  console.log(parsed);
  return sanitizedJson;
}

function sanitizeJsonResponse(text: string): string {
  // First extract just the JSON object
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}") + 1;
  let jsonText = text.slice(jsonStart, jsonEnd);

  // Remove any newlines and escape special characters
  jsonText = jsonText
    .replace(/\n/g, " ")
    .replace(/\r/g, " ")
    .replace(/\t/g, " ");

  // Ensure properties are properly quoted
  jsonText = jsonText.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');

  return jsonText;
}
