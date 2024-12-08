import OpenAI, { toFile } from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { wavWorker } from "./wav-worker";

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
const openai = new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true,
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
  const chunkDuration = durationInSeconds / 3;

  console.log(
    "Compressed audio - Duration:",
    durationInSeconds,
    "Sample rate:",
    compressedBuffer.sampleRate
  );

  const chunks: Blob[] = [];

  for (let i = 0; i < 3; i++) {
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
      prompt:
        "This transcript is mainly of a teacher from a class, in Israel, in Hebrew",
    });
    console.log(transcription.text);
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
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
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
        Attached is a transcript of a lesson. Most of the transcript will be the words of the teacher speaking.
        The transcript may have errors but you can understand what the teacher originally said.
        You are a diligent and brilliant student who always uses the Cornell Method to summarize a lesson in a notebook.
        You need to take all the content of the lesson and the material studied and write it in a length that will fill an entire page of a notebook (A4).
        You will use the Cornell Method to summarize the material into:
        - Title
        - Notes - Expand in this part, main lecture notes go here
        - Cues (Main Ideas, concepts, vocabulary, questions, study prompts, hints)
        - Summary
        Imagine that the page is divided into 2 thirds - the content (notes), on the side - the cues, and in the bottom quarter - the summary of the entire page.
        You will return content in Hebrew only. Use the following format and return your answer with JSON code only without any introduction or additional characters.
        If you add characters outside the JSON object, parsing will fail and the program will crash make sure the response is a valid JSON object that is ready to be parsed to a JSON object
        If you see an obvious mistake in the transcript of a famous quote, verse, name, etc., this is probably a result of bad transcription.
        Try to include the correct thing.

        Text format: HTML
        Use text formatting HTML tags to create bulleted lists, numbered lists, underline, line breaks, paragraphs, emphasis, italics, etc. (apart from title, leave as vanilla text)

        Ensure no unescaped control characters like line breaks or tabs are present in the string.
        Step 1: Remove unnecessary newlines in the strings.
        Step 2: Ensure your JSON is a valid single-line string.

        IMPORTANT: Your response must be a valid JSON object with no line breaks or special characters in the strings. 
        All property names must be in quotes.
        Example format:
        {"title": "value", "notes": "value", "cues": "value", "summary": "value"}
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
