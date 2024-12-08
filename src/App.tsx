import { useState } from "react";
import Notebook from "./Components/Notebook";
import UploadArea from "./Components/UploadArea";
import OpenAI, { toFile } from "openai";
import Processing from "./Components/Modules/Processing";
import { NotebookType } from "./utils/types";
import Anthropic from "@anthropic-ai/sdk";

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
const openai = new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true,
});

function App() {
  const [loading, setLoading] = useState(false);
  const [notebook, setNotebook] = useState<NotebookType | null>({
    title: "מבוא למערכות אקולוגיות",
    notes: `
  <u>הגדרת מערכת אקולוגית:</u>
  <ul>
    <li>מכלול יחסי הגומלין בין יצורים חיים לסביבתם</li>
    <li>כולל גורמים חיים (ביוטיים) ולא חיים (אביוטיים)</li>
  </ul>
  <u>רכיבי מערכת אקולוגית:</u>
  <ol>
    <li>יצרנים ראשוניים (צמחים)</li>
    <li>צרכנים (בעלי חיים)</li>
    <li>מפרקים (חיידקים, פטריות)</li>
  </ol>
  <u>מושגי מפתח:</u>
  <ul>
    <li><b>שרשרת מזון:</b> העברת אנרגיה בין רמות תזונתיות</li>
    <li><b>מחזור חומרים:</b> סחרור חומרים במערכת</li>
    <li><b>איזון אקולוגי:</b> יציבות והדדיות בין רכיבי המערכת</li>
  </ul>
  <u>דוגמאות למערכות אקולוגיות:</u>
  <ul>
    <li>יער גשם</li>
    <li>שונית אלמוגים</li>
    <li>מדבר</li>
  </ul>
`,
    cues: `<p>מהי המשמעות של איזון אקולוגי?</p>
<ul>
  <li>שמירה על יחסי גומלין יציבים</li>
  <li>מניעת השמדת מינים</li>
</ul>

<p>איך משפיעה התחממות גלובלית על מערכות אקולוגיות?</p>
<ul>
  <li>שינוי בתנאי סביבה</li>
  <li>הכחדת מינים</li>
  <li>שיבוש שרשראות מזון</li>
</ul>

<p>מדוע חשוב ללמוד מערכות אקולוגיות?</p>
<ul>
  <li>הבנת תלות הדדית</li>
  <li>פיתוח מודעות סביבתית</li>
  <li>יצירת פתרונות לשימור</li>
</ul>
`,
    summary: `<p>מערכות אקולוגיות הן מרחבים מורכבים של יחסי גומלין בין יצורים חיים וסביבתם. כל רכיב במערכת - יצרנים, צרכנים ומפרקים - משחק תפקיד חיוני בשמירה על איזון ורציפות. הבנת הדינמיקה האקולוגית חיונית להתמודדות עם אתגרים סביבתיים עכשויים כמו התחממות גלובלית והכחדת מינים.</p>

<p>נקודות מרכזיות:</p>
<ul>
  <li>מערכת אקולוגית = רשת מורכבת של יחסי גומלין</li>
  <li>כל רכיב תלוי ומשפיע על האחרים</li>
  <li>שמירה על איזון = מפתח לקיימות</li>
</ul>
`,
  });
  const [showNotebook, setShowNotebook] = useState(false);

  async function transcribe(audioFile: File) {
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
      setLoading(false);
      throw error;
    }
  }

  async function summarizeTranscriptionGPT(transcription: string) {
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

  async function summarizeTranscriptionClaude(transcription: string) {
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
          - Notes
          - Cues
          - Summary
          Imagine that the page is divided into 2 thirds - the content (notes), on the side - the cues, and in the bottom quarter - the summary of the entire page.
          You will return content in Hebrew only. Use the following format and return your answer with JSON code only without any introduction or additional characters.
          If you add characters outside the JSON object, parsing will fail and the program will crash make sure the response is a valid JSON object that is ready to be parsed to a JSON object
          Text format: HTML
          Use text formatting HTML tags to create bulleted lists, numbered lists, underline, line breaks, paragraphs, emphasis, italics, etc. (apart from title, leave as vanilla text)

          Ensure no unescaped control characters like line breaks or tabs are present in the string.
          Step 1: Remove unnecessary newlines in the strings.
          Step 2: Ensure your JSON is a valid single-line string.

          Response JSON object (fill this):
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
    });

    const text = response.content[0].text;
    if (!text) {
      throw new Error("Failed to get response content");
    }

    console.log(text);
    // const jsonText = extractJsonObject(text);
    const parsed = JSON.parse(text);
    console.log(parsed);
    return text;
  }

  function extractJsonObject(text: string): string {
    const startIndex = text.indexOf("{");
    const endIndex = text.lastIndexOf("}");
    if (startIndex === -1 || endIndex === -1) {
      throw new Error("No valid JSON object found in response");
    }
    return text.slice(startIndex, endIndex + 1);
  }

  async function processAudioFile(file: File) {
    try {
      setLoading(true);

      const transcription = await transcribe(file);
      const summaryText = await summarizeTranscriptionClaude(transcription);

      const parsedSummary: NotebookType = JSON.parse(summaryText);

      setNotebook({
        title: parsedSummary.title,
        notes: parsedSummary.notes,
        cues: parsedSummary.cues,
        summary: parsedSummary.summary,
      });
      setShowNotebook(true);
    } catch (error) {
      console.error("Error processing audio file:", error);
      // Ensure loading state is always turned off in case of error
      setLoading(false);
      // Optionally show an error message to the user
      alert("Failed to process audio file. Please try again.");
    } finally {
      // Ensure loading is set to false in all scenarios
      setLoading(false);
    }
  }

  return (
    <div className="grid h-screen p-4 place-items-center">
      {!showNotebook && <UploadArea onUpload={processAudioFile} />}
      {loading && <Processing />}
      {showNotebook && <Notebook notebook={notebook} />}
    </div>
  );
}

export default App;
