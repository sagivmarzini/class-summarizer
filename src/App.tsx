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

interface ProcessingState {
  loading: boolean;
  loadingStage: "transcribing" | "summarizing";
}

function App() {
  const [{ loading, loadingStage }, setProcessingState] = useState<ProcessingState>({
    loading: false,
    loadingStage: "transcribing",
  });
  const [notebook, setNotebook] = useState<NotebookType | null>(null);
  const [showNotebook, setShowNotebook] = useState(false);

  // Helper functions for state management
  const startProcessing = (stage: "transcribing" | "summarizing") => {
    setProcessingState({ loading: true, loadingStage: stage });
  };

  const stopProcessing = () => {
    setProcessingState({ loading: false, loadingStage: "transcribing" });
  };

  const handleError = (error: unknown, errorMessage: string) => {
    console.error(errorMessage, error);
    stopProcessing();
    alert(`${errorMessage} Please try again.`);
  };

  const updateNotebook = (parsedSummary: NotebookType) => {
    setNotebook({
      title: parsedSummary.title,
      notes: parsedSummary.notes,
      cues: parsedSummary.cues,
      summary: parsedSummary.summary,
    });
    setShowNotebook(true);
  };

  // Core processing functions
  async function transcribeAudioChunks(chunks: Blob[]): Promise<string> {
    const transcriptionPromises = chunks.map((chunk, index) =>
      transcribe(new File([chunk], `chunk${index + 1}.wav`, { type: "audio/wav" }))
    );
    const transcriptionParts = await Promise.all(transcriptionPromises);
    return transcriptionParts.join(" ");
  }

  async function generateSummary(content: string): Promise<NotebookType> {
    const summaryText = await summarizeTranscriptionClaude(content);
    return JSON.parse(summaryText);
  }

  // Main processing functions
  async function processAudioFile(file: File) {
    try {
      startProcessing("transcribing");
      
      // Split and transcribe audio
      const chunks = await splitAudioFile(file);
      const transcription = await transcribeAudioChunks(chunks);
      console.log("Transcription completed:", transcription);

      // Generate summary
      startProcessing("summarizing");
      const parsedSummary = await generateSummary(transcription);
      updateNotebook(parsedSummary);
    } catch (error) {
      handleError(error, "Failed to process audio file.");
    } finally {
      stopProcessing();
    }
  }

  async function processTextContent(content: string) {
    try {
      startProcessing("summarizing");
      const parsedSummary = await generateSummary(content);
      updateNotebook(parsedSummary);
    } catch (error) {
      handleError(error, "Failed to process text content.");
    } finally {
      stopProcessing();
    }
  }

  return (
    <div className="grid h-screen p-4 place-items-center">
      {!showNotebook && !loading && (
        <UploadScreen onUpload={processAudioFile} onUploadText={processTextContent} />
      )}
      {loading && <Processing stage={loadingStage} />}
      {showNotebook && <Notebook notebook={notebook} />}
    </div>
  );
}

export default App;
