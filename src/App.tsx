import { useState } from "react";
import Notebook from "./Components/Notebook";
import UploadArea from "./Components/UploadArea";
import OpenAI, { toFile } from "openai";
import Processing from "./Components/Modules/Processing";

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
const openai = new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true,
});

function App() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  async function transcribe(audioFile: File) {
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
      return transcription.text;
    } catch (error) {
      console.error("Error during transcription:", error);
      throw error;
    }
  }

  async function summarizeTranscription(transcription: string) {
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
    const parsed = JSON.parse(text);

    console.log(parsed);

    return text;
  }
  async function processAudioFile(file: File) {
    setIsProcessing(true);

    const transcription = await transcribe(file);
    console.log(await summarizeTranscription(transcription));

    setIsProcessing(false);
  }

  return (
    <div className="p-4">
      <UploadArea onUpload={processAudioFile} />
      <Processing isLoading={isProcessing} />
      <Notebook />
    </div>
  );
}

export default App;
