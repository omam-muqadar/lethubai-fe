import { useState } from "react";
import axios from "axios";

const API_PROD = "https://lethubai.azurewebsites.net/";
// const API_LOCAL = "http://localhost:3000/";

const VoiceAITest = () => {
  const [audioFile, setAudioFile] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [textInput, setTextInput] = useState("");
  const [aiSpeechAudio, setAiSpeechAudio] = useState(null);

  // Handle audio file selection
  const handleAudioChange = (event) => {
    setAudioFile(event.target.files[0]);
  };

  // Upload audio for speech-to-text
  const handleSTT = async () => {
    if (!audioFile) {
      alert("Please select an audio file first!");
      return;
    }

    const formData = new FormData();
    formData.append("audio", audioFile);

    try {
      console.log("Sending audio file...");
      const response = await axios.post(API_PROD + "stt", formData);
      console.log("STT Response:", response.data);
      setTranscription(response.data.transcription);
    } catch (error) {
      console.error("STT Error:", error);
      alert("Error processing speech-to-text.");
    }
  };

  // Convert text to speech
  const handleTTS = async () => {
    if (!textInput.trim()) {
      alert("Please enter text to convert to speech.");
      return;
    }

    try {
      console.log("Sending text for TTS:", textInput);
      const response = await axios.post(
        API_PROD + "tts",
        {
          text: textInput,
        },
        { responseType: "blob" }
      );

      console.log("TTS Response:", response);
      const audioUrl = URL.createObjectURL(response.data);
      console.log("Generated audio URL:", audioUrl);
      setAiSpeechAudio(audioUrl);
    } catch (error) {
      console.error("TTS Error:", error);
      alert("Error processing text-to-speech.");
    }
  };

  return (
    <div className="p-6 max-w-md !text-gray-500 mx-auto bg-white rounded-2xl shadow-lg flex flex-col items-center space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
        <span>🗣️</span> <span>AI Voice Test</span>
      </h2>

      {/* File Upload */}
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700">
          Upload Audio File
        </label>
        <input
          type="file"
          accept="audio/*"
          onChange={handleAudioChange}
          className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-300"
        />
      </div>

      <button
        onClick={handleSTT}
        className="w-full px-4 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition"
      >
        🎤 Convert to Text
      </button>

      {transcription && (
        <p className="mt-2 px-3 py-2 w-full bg-gray-100 rounded-lg text-gray-800 text-sm">
          📝 <strong>Transcription:</strong> <p>{transcription}</p>
        </p>
      )}

      {/* Text-to-Speech Input */}
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700">
          Enter Text for Speech
        </label>
        <textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Type text here..."
          className="mt-1 text-gray w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-green-300"
          rows="3"
        />
      </div>

      <button
        onClick={handleTTS}
        className="w-full px-4 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition"
      >
        🗣️ Convert to Speech
      </button>

      {/* Audio Playback */}
      {aiSpeechAudio && (
        <div className="w-full flex flex-col items-center mt-4">
          <p className="text-sm text-gray-600">🔊 AI-Generated Speech</p>
          <audio controls className="w-full mt-2">
            <source src={aiSpeechAudio} type="audio/mp3" />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
    </div>
  );
};

export default VoiceAITest;
