export async function transcribe(audioFile: File) {
  const formData = new FormData();
  formData.append("audio", audioFile);

  try {
    const response = await fetch("/api/transcribe", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Failed to transcribe audio");

    const transcription = await response.text();

    return transcription;
  } catch (error) {
    console.error("Error during transcription:", error);
    alert("Failed to transcribe audio. Please try again.");
  }
}

export async function summarize(transcription: string) {
  try {
    const response = await fetch("/api/summarize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transcription: transcription }),
    });

    if (!response.ok) throw new Error("Failed to summarize audio");

    const summaryText = await response.text();

    return summaryText;
  } catch (error) {
    console.error("Error during summarization:", error);
    alert("Failed to summarize audio. Please try again.");
  }
}
