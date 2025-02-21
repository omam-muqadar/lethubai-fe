import { useState } from "react";
import axios from "axios";
import { ReactMic } from "react-mic";
import { API_ENDPOINT } from "./env";

const VoiceAI = () => {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [aiResponseAudio, setAiResponseAudio] = useState(null);

  const startRecording = () => setRecording(true);
  const stopRecording = () => setRecording(false);

  const onStop = (recordedBlob) => {
    setAudioBlob(recordedBlob.blob);
  };

  const handleUpload = async () => {
    if (!audioBlob) {
      alert("Please record audio first!");
      return;
    }

    const formData = new FormData();
    formData.append("audio", audioBlob, "input-audio.wav");

    try {
      const response = await axios.post(API_ENDPOINT + "voice-ai", formData, {
        responseType: "blob", // Expecting audio file in response
      });

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
      <ReactMic
        record={recording}
        className="border rounded"
        onStop={onStop}
        mimeType="audio/wav"
        visualSetting="sinewave"
      />

      <div className="mt-2 flex gap-2">
        <button
          onClick={startRecording}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Start
        </button>
        <button
          onClick={stopRecording}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Stop
        </button>
      </div>

      <button
        onClick={handleUpload}
        className="mt-3 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Upload & Get AI Response
      </button>

      {/* Playback AI response */}
      {aiResponseAudio && (
        <audio controls className="mt-4">
          <source src={aiResponseAudio} type="audio/mp3" />
          Your browser does not support the audio element.
        </audio>
      )}
    </div>
  );
};

export default VoiceAI;
