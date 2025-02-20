import { useState } from "react";
import axios from "axios";

export default function WhisperTranscriber() {
  const [audioFile, setAudioFile] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    setAudioFile(event.target.files[0]);
  };

  const transcribeAudio = async () => {
    if (!audioFile) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", audioFile);

    try {
      const response = await axios.post(
        import.meta.env.VITE_AZURE_WHISPER_ENDPOINT,
        formData,
        {
          headers: {
            "Ocp-Apim-Subscription-Key": import.meta.env.VITE_AZURE_API_KEY,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setTranscription(
        response.data.transcription || "No transcription available"
      );
    } catch (error) {
      console.error(
        "Error transcribing audio:",
        error.response?.data || error.message
      );
      setTranscription("Error processing audio. Check console for details.");
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center p-6 bg-gray-100 min-h-screen">
      <h1 className="text-xl font-bold mb-4">Azure Whisper Transcription</h1>
      <input
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        className="mb-4"
      />
      <button
        onClick={transcribeAudio}
        className="px-4 py-2 bg-blue-500 text-white rounded"
        disabled={loading}
      >
        {loading ? "Transcribing..." : "Transcribe"}
      </button>
      {transcription && (
        <p className="mt-4 bg-white p-4 rounded shadow">{transcription}</p>
      )}
    </div>
  );
}
