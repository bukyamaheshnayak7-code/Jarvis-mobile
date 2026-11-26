 const API_KEY = "YOUR_GEMINI_API_KEY";
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

const statusEl = document.getElementById("status");
const userTextEl = document.getElementById("user-text");
const replyEl = document.getElementById("jarvis-reply");
const micBtn = document.getElementById("mic-btn");

// Stores recent conversation so J.A.R.V.I.S. remembers context
let chatHistory = [];

// 1. Speech Recognition Setup (Ears)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = "en-IN";
recognition.interimResults = false;

function startListening() {
  window.speechSynthesis.cancel(); // Stop talking if currently speaking
  try {
    recognition.start();
    statusEl.textContent = "Listening, Sir...";
    micBtn.classList.add("listening");
  } catch (e) {
    console.log("Already listening");
  }
}

recognition.onresult = async (event) => {
  const transcript = event.results[0][0].transcript;
  micBtn.classList.remove("listening");
  userTextEl.textContent = `You: "${transcript}"`;
  statusEl.textContent = "Processing...";

  // Check for quick local device commands first
  if (handleLocalCommands(transcript.toLowerCase())) {
    return;
  }

  // Otherwise, send to Gemini Brain
  const reply = await askJarvis(transcript);
  replyEl.textContent = `J.A.R.V.I.S.: ${reply}`;
  statusEl.textContent = "Standing by, Sir.";
  speak(reply);
};

recognition.onerror = (event) => {
  micBtn.classList.remove("listening");
  statusEl.textContent = `Mic error: ${event.error}. Tap to retry.`;
};

recognition.onend = () => {
  micBtn.classList.remove("listening");
};

// 2. Quick Instant Phone Commands (No API delay)
function handleLocalCommands(cmd) {
  if (cmd.includes("open youtube")) {
    const msg = "Opening YouTube for you now, Sir.";
    replyEl.textContent = `J.A.R.V.I.S.: ${msg}`;
    statusEl.textContent = "Standing by, Sir.";
    speak(msg);
    window.open("https://www.youtube.com", "_blank");
    return true;
  }
  if (cmd.includes("open google")) {
    const msg = "Opening Google, Sir.";
    replyEl.textContent = `J.A.R.V.I.S.: ${msg}`;
    statusEl.textContent = "Standing by, Sir.";
    speak(msg);
    window.open("https://www.google.com", "_blank");
    return true;
  }
  return false;
}

// 3. Gemini AI Brain with Memory
async function askJarvis(userCommand) {
  chatHistory.push({
    role: "user",
    parts: [{ text: userCommand }]
  });

  // Keep only last 10 turns so requests stay fast
  if (chatHistory.length > 10) {
    chatHistory = chatHistory.slice(-10);
  }

  try {
    const response = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{
            text: "You are J.A.R.V.I.S., Tony Stark's AI assistant. Address the user as 'Sir'. Keep responses sharp, intelligent, witty, and concise (2-3 sentences max) so they sound natural when spoken aloud. Never use markdown symbols like asterisks, hashtags, or bullet points."
          }]
        },
        contents: chatHistory
      })
    });

    const data = await response.json();

    if (data.error) {
      return `System alert, Sir: ${data.error.message}`;
    }

    const reply = data.candidates[0].content.parts[0].text;
    chatHistory.push({
      role: "model",
      parts: [{ text: reply }]
    });

    return reply;
  } catch (error) {
    return "I am unable to reach the servers right now, Sir. Please check your connection.";
  }
}

// 4. Text-to-Speech Engine (Voice)
function speak(text) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();

  const britishVoice = voices.find((v) => v.lang.includes("en-GB"));
  if (britishVoice) utterance.voice = britishVoice;

  utterance.rate = 1.05;
  utterance.pitch = 0.95;
  window.speechSynthesis.speak(utterance);
}

// Preload voices on mobile browsers
window.speechSynthesis.onvoiceschanged = () => {
  window.speechSynthesis.getVoices();
};
