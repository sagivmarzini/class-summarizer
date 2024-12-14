import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const reader = new FileReader();
  const audioBase64 = await new Promise<string>((resolve) => {
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(audioBlob);
  });

  const response = await axios.post(`${API_URL}/api/transcribe`, {
    audioData: audioBase64
  });
  return response.data.text;
}

export async function summarizeText(text: string): Promise<any> {
  const response = await axios.post(`${API_URL}/api/summarize`, { text });
  return response.data;
}
