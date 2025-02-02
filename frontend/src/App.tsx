import { useState } from "react";
import Notebook from "./Components/Notebook";
import UploadScreen from "./Components/UploadScreen";
import Processing from "./Components/Modules/Processing";
import { NotebookType } from "./utils/types";
import { summarize, transcribe } from "./utils/api";

function App() {
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<
    "transcribing" | "summarizing"
  >("transcribing");
  const [notebook, setNotebook] = useState<NotebookType | null>(null);
  const [showNotebook, setShowNotebook] = useState(false);

  async function processAudioFile(file: File) {
    try {
      setLoading(true);

      setLoadingStage("transcribing");
      const transcription = await transcribe(file);
      if (!transcription) throw new Error("Failed to transcribe audio");
      console.log(transcription);

      setLoadingStage("summarizing");
      const summaryText = await summarize(transcription);
      if (!summaryText) throw new Error("Failed to summarize audio");
      console.log(summaryText);

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
      setLoading(false);
      alert("Failed to process audio file. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function processTextContent(content: string) {
    try {
      setLoading(true);
      setLoadingStage("summarizing");
      const summaryText = await summarize(content);
      if (!summaryText) throw new Error("Failed to summarize text content");

      const parsedSummary: NotebookType = JSON.parse(summaryText);
      setNotebook({
        title: parsedSummary.title,
        notes: parsedSummary.notes,
        cues: parsedSummary.cues,
        summary: parsedSummary.summary,
      });
      setShowNotebook(true);
    } catch (error) {
      console.error("Error processing text content:", error);
      setLoading(false);
      alert("Failed to process text content. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid place-items-center p-4 h-screen">
      {!showNotebook && !loading && (
        <UploadScreen
          onUpload={processAudioFile}
          onUploadText={processTextContent}
        />
      )}
      {loading && <Processing stage={loadingStage} />}
      {showNotebook && <Notebook notebook={notebook} />}
    </div>
  );
}

export default App;
