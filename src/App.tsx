import { useState } from "react";
import Notebook from "./Components/Notebook";
import UploadScreen from "./Components/UploadScreen";
import Processing from "./Components/Modules/Processing";
import { NotebookType } from "./utils/types";
import {
  splitAudioFile,
  summarizeTranscriptionClaude,
  transcribe,
} from "./utils/api";

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

      // Split audio into 3 chunks
      const chunks = await splitAudioFile(file);

      // Process chunks in parallel
      const transcriptionPromises = chunks.map((chunk) =>
        transcribe(new File([chunk], "chunk.wav", { type: "audio/wav" }))
      );

      // Wait for all transcriptions to complete
      const transcriptionParts = await Promise.all(transcriptionPromises);

      // Combine transcriptions
      const transcription = transcriptionParts.join(" ");

      setLoadingStage("summarizing");
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
      setLoading(false);
      alert("Failed to process audio file. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid h-screen p-4 place-items-center">
      {!showNotebook && !loading && (
        <UploadScreen onUpload={processAudioFile} />
      )}
      {loading && <Processing stage={loadingStage} />}
      {showNotebook && <Notebook notebook={notebook} />}
    </div>
  );
}

export default App;
