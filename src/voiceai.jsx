import { useState, useRef } from "react";
import axios from "axios";
import { AudioRecorder } from "react-audio-recorder";

const VoiceAI = () => {
  const [audioFile, setAudioFile] = useState(null);
  const [aiResponseAudio, setAiResponseAudio] = useState(null);
  const audioRef = useRef(null);

  // Handle recorded audio
  const handleAudioRecorded = (audioBlob) => {
    setAudioFile(audioBlob);
  };

  // Upload audio & get AI response
  const handleUpload = async () => {
    if (!audioFile) {
      alert("Please record audio first!");
      return;
    }

    const formData = new FormData();
    formData.append("audio", audioFile, "input-audio.wav");

    try {
      const response = await axios.post(
        "http://localhost:3000/voice-ai",
        formData,
        {
          responseType: "blob", // Expecting audio file in response
        }
      );

      const audioUrl = URL.createObjectURL(response.data);
      setAiResponseAudio(audioUrl);
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong. Check the console for details.");
    }
  };

  return (
    <div className="p-4 flex flex-col items-center">
      <h2 className="text-lg font-semibold mb-2">🎙️ AI Voice Assistant</h2>

      {/* Audio Recorder */}
      <AudioRecorder
        onRecordingComplete={handleAudioRecorded}
        audioType="audio/wav"
        showVisualizer={true}
      />

      <button
        onClick={handleUpload}
        className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Upload & Get AI Response
      </button>

      {/* Playback AI response */}
      {aiResponseAudio && (
        <audio controls ref={audioRef} className="mt-4">
          <source src={aiResponseAudio} type="audio/mp3" />
          Your browser does not support the audio element.
        </audio>
      )}
    </div>
  );
};

export default VoiceAI;
