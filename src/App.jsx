import { useState } from "react";
import "./App.css";
import VoiceAI from "./voiceai";
import VoiceAITest from "./VoiceAITest";
import VoiceChat from "./voicechatfunc";

function App() {
  const [type, setType] = useState("ssrtts");

  return (
    <div className="text-center relative">
      <div className="inline-flex flex-wrap gap-2 mb-3">
        <button
          onClick={() => setType("ssrtts")}
          className={`px-4 py-2 rounded-md flex items-center justify-center ${
            type === "ssrtts" ? "!border-2 !border-blue-500 font-bold" : ""
          }`}
        >
          <span className="md:hidden">🎙️🔊</span>
          <span className="hidden md:inline">STT & TTS</span>
        </button>

        <button
          onClick={() => setType("assistant")}
          className={`px-4 py-2 rounded-md flex items-center justify-center ${
            type === "assistant" ? "!border-2 !border-blue-500 font-bold" : ""
          }`}
        >
          <span className="md:hidden">🗣️📼</span>
          <span className="hidden md:inline">Voice Chat Record</span>
        </button>

        <button
          onClick={() => setType("voicechat")}
          className={`px-4 py-2 rounded-md flex items-center justify-center ${
            type === "voicechat" ? "!border-2 !border-blue-500 font-bold" : ""
          }`}
        >
          <span className="md:hidden">🔊⏳</span>
          <span className="hidden md:inline">Voice Chat Realtime</span>
        </button>
      </div>
      {type === "ssrtts" && <VoiceAITest />}
      {type === "assistant" && <VoiceAI />}
      {type === "voicechat" && <VoiceChat />}
    </div>
  );
}

export default App;
