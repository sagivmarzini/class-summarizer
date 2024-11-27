import { useState } from "react";
import Notebook from "./Components/Notebook";
import UploadArea from "./Components/UploadArea";
import OpenAI, { toFile } from "openai";

function App() {
  return (
    <div className="p-4">
      <UploadArea onUpload={processAudioFile} />
      <Notebook />
    </div>
  );
}

export default App;
