import { useState } from "react";
import "./App.css";
import VoiceAI from "./voiceai";
import VoiceAITest from "./VoiceAITest";

function App() {
  const [type, setType] = useState("assistant");

  return (
    <div className="text-center relative">
      <div className="inline-block gap-x-2 mb-3">
        <button
          onClick={() => setType("ssrtts")}
          className={`px-4 py-2 ${
            type === "ssrtts" ? "!border-2 !border-blue-500 !font-bold" : ""
          }`}
        >
          STT & TTS
        </button>
        &nbsp; &nbsp;
        <button
          onClick={() => setType("assistant")}
          className={`px-4 py-2 ${
            type === "assistant" ? "!border-2 !border-blue-500 !font-bold" : ""
          }`}
        >
          AI Voice Assistant
        </button>
      </div>
      {type === "ssrtts" && <VoiceAITest />}
      {type === "assistant" && <VoiceAI />}
    </div>
  );
}

export default App;
