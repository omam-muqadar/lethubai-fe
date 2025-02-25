import { useState, useRef } from "react";
import { API_ENDPOINT } from "./env";
import axios from "axios";

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

      // Create WebRTC peer connection
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

      // Set up data channel for real-time function calls
      const dc = pc.createDataChannel("oai-events");
      dataChannelRef.current = dc;

      // Register the available functions with OpenAI
      const sessionUpdate = {
        type: "session.update",
        session: {
          tools: [
            {
              type: "function",
              name: "create_event",
              description: "Create an event with a name and date.",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Name of the event." },
                  date: {
                    type: "string",
                    description: "Date of the event (YYYY-MM-DD).",
                  },
                },
                required: ["name", "date"],
              },
            },
            {
              type: "function",
              name: "update_event",
              description: "Update the date of an existing event.",
              parameters: {
                type: "object",
                properties: {
                  date: {
                    type: "string",
                    description: "New date of the event (YYYY-MM-DD).",
                  },
                },
                required: ["date"],
              },
            },
            {
              type: "function",
              name: "delete_event",
              description: "Delete an event with a name and date.",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Name of the event." },
                  date: {
                    type: "string",
                    description: "Date of the event (YYYY-MM-DD).",
                  },
                },
                required: ["name", "date"],
              },
            },
            {
              type: "function",
              name: "get_weather",
              description: "Get weather detail based on location.",
              parameters: {
                type: "object",
                properties: {
                  location: {
                    type: "string",
                    description: "Could be a city or state.",
                  },
                },
                required: ["location"],
              },
            },
          ],
          tool_choice: "auto",
        },
      };

      // Send session update after WebRTC connection is established
      dc.onopen = () => {
        console.log("Data channel open. Sending session update...");
        dc.send(JSON.stringify(sessionUpdate));
      };

      // Handle incoming messages (LLM function calls)

      dc.addEventListener("message", async (event) => {
        try {
          const realtimeEvent = JSON.parse(event.data);
          console.log("Received event:", realtimeEvent);

          if (
            realtimeEvent.type === "response.done" &&
            realtimeEvent.response?.output
          ) {
            const functionCalls = realtimeEvent.response.output.filter(
              (item) => item.type === "function_call"
            );

            for (const call of functionCalls) {
              const { name, arguments: args } = call;

              // Parse function arguments (they are in JSON string format)
              const parameters = JSON.parse(args);
              console.log(`Function call detected: ${name}`, parameters);

              let functionResult;
              if (name === "create_event") {
                functionResult = `Event '${parameters.name}' created for ${parameters.date}.`;
              } else if (name === "update_event") {
                functionResult = `Event date updated to ${parameters.date}.`;
              } else if (name === "delete_event") {
                functionResult = `Event date deleted schduled on ${parameters.date} for '${parameters.name}'.`;
              } else if (name === "get_weather") {
                const location = parameters.location || "New York"; // Default to New York if no location found

                // Step 2: Fetch Weather Data
                const weatherApiKey = "a8eb80a9b86b410da2b194439252102";
                const weatherResponse = await axios.get(
                  `https://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=${location}`
                );

                const weatherData = weatherResponse.data;
                functionResult = `The current temperature in ${weatherData.location.name} is ${weatherData.current.temp_c} degrees Celsius with ${weatherData.current.condition.text}.`;

                // functionResult = `Event date deleted schduled on ${parameters.date} for '${parameters.name}'.`;
              } else {
                functionResult = "Unknown function call.";
              }

              console.log("Function response:", functionResult);

              // 🔹 Send function result as a conversation item
              // Step 1: Send function result as a conversation item
              const functionResponse = {
                type: "conversation.item.create",
                item: {
                  type: "function_call_output",
                  call_id: realtimeEvent.response.output[0].call_id, // Ensure this matches the function call
                  output: JSON.stringify(functionResult), // Must be a JSON string
                },
              };

              dc.send(JSON.stringify(functionResponse));
              console.log("Sent function response:", functionResponse);

              // Step 2: Trigger the model to continue responding
              const continueResponse = {
                type: "response.create",
              };

              dc.send(JSON.stringify(continueResponse));
              console.log("Sent function response:", functionResponse);
            }
          }
        } catch (err) {
          console.error("Error processing message:", err);
        }
      });

      // Create SDP offer
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
      <h1 className="!text-2xl font-bold">OpenAI Voice Chat</h1>
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
        <div className="mt-6 p-4 bg-zinc-700 shadow-md rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-3">
            Available APIs
          </h2>
          <ul className="space-y-2 text-white">
            <li className="flex flex-col md:flex-row text-left items-start gap-2 p-3 border border-zinc-500 rounded-md bg-zinc-600">
              <span className="font-bold text-white">create_event:</span>
              <span>Create an event with a name and date.</span>
            </li>
            <li className="flex flex-col md:flex-row text-left items-start gap-2 p-3 border border-zinc-500 rounded-md bg-zinc-600">
              <span className="font-bold text-white">update_event:</span>
              <span>Update the date of an existing event.</span>
            </li>
            <li className="flex flex-col md:flex-row text-left items-start gap-2 p-3 border border-zinc-500 rounded-md bg-zinc-600">
              <span className="font-bold text-white">delete_event:</span>
              <span>Delete an event with a name and date.</span>
            </li>
            <li className="flex flex-col md:flex-row text-left items-start gap-2 p-3 border border-zinc-500 rounded-md bg-zinc-600">
              <span className="font-bold text-white">get_weather:</span>
              <span>Get weather details based on location.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VoiceChat;
