import { useState, useRef } from "react";
import { API_ENDPOINT } from "./env";

const VoiceChat = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const audioElRef = useRef(null);
  const streamRef = useRef(null);

  const startConversation = async () => {
    try {
      setError(null);
      console.log("Starting conversation...");

      // Fetch ephemeral key from backend
      const tokenResponse = await fetch(API_ENDPOINT + "session");
      const data = await tokenResponse.json();
      const EPHEMERAL_KEY = data.client_secret.value;

      // Create a new peer connection
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;

      // Set up audio output
      const audioEl = new Audio();
      audioEl.autoplay = true;
      audioElRef.current = audioEl;
      pc.ontrack = (event) => {
        console.log("Receiving audio stream...");
        audioEl.srcObject = event.streams[0];
      };

      // Get user microphone input
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      streamRef.current = mediaStream;
      pc.addTrack(mediaStream.getTracks()[0]);

      // Set up data channel for real-time events
      const dc = pc.createDataChannel("oai-events");
      dataChannelRef.current = dc;
      dc.addEventListener("message", (event) => {
        const realtimeEvent = JSON.parse(event.data);
        console.log("Received event:", realtimeEvent);
      });

      // Create an SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer to OpenAI real-time API
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp",
        },
      });

      // Set remote description
      const answer = {
        type: "answer",
        sdp: await sdpResponse.text(),
      };
      await pc.setRemoteDescription(answer);

      setIsConnected(true);
      console.log("Connected to OpenAI Voice AI.");
    } catch (err) {
      console.error("Error starting conversation:", err);
      setError("Failed to start conversation.");
    }
  };

  const stopConversation = () => {
    console.log("Stopping conversation...");
    peerConnectionRef.current?.close();
    streamRef.current?.getTracks().forEach((track) => track.stop());

    setIsConnected(false);
    peerConnectionRef.current = null;
    dataChannelRef.current = null;
    audioElRef.current = null;
    streamRef.current = null;
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">OpenAI Voice Chat</h1>
      {error && <p className="!text-red-600">{error}</p>}
      <div className="mt-4">
        {!isConnected ? (
          <button
            onClick={startConversation}
            className="px-4 py-2 !bg-blue-600 text-white rounded-lg"
          >
            Start Conversation
          </button>
        ) : (
          <button
            onClick={stopConversation}
            className="px-4 py-2 !bg-red-600 text-white rounded-lg"
          >
            Stop Conversation
          </button>
        )}
      </div>
    </div>
  );
};

export default VoiceChat;
