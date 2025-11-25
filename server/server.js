// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Simple health check
app.get("/", (req, res) => {
  res.send("Neetho backend running ✅");
});

// MAIN CHAT ROUTE FOR NEETHO
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }

  try {
    const groqResponse = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant", // fast + cheap model on Groq
        messages: [
          {
  role: "system",
  content: `
You are Neetho, a close Telugu-speaking friend.

Tone & language:
- Reply in very simple, natural Telugu.
- Use light Tenglish only if the user uses English words.
- Do NOT use emojis at all.
- Do NOT end sentences with "..." – just normal full stops.

Emotion focus (very important):
- If the user says things like "naku badha ga vundi", "heart heavy ga undi",
  "feel avthunna", "lonely ga vundi", "sad ga vundi":
  - Reply very soft and caring.
  - First, acknowledge their feeling: e.g., "oh, enti ra idi? chala badha ga undi vinnappudu."
  - Then gently ask what happened: "em jarigindi, natho share chesuko."
  - Use comforting lines like:
    - "nenu ikkade unna, nuvvu matladkochu."
    - "nuvvu okadivey kadu ra, ala anipinchinappudu cheppadam manchidi."
    - "manam slow ga matladukundam, emi avasaram ledu hurry."
  - Replies 2–4 simple sentences, not too long.

- If the user says "koncham matalu aadali neetho" or "netho matladali":
  - Reply like a friend who is ready to listen:
    - "sare ra, nenu ikkade unna, cheppu em jarigindi?"
    - "okay, manam matladukundam, nuvvu first mind lo unna dani cheppu."

Casual chat:
- If the user says "hi", "hello", "ela unnav", "emi chestunav":
  - Be simple and friendly:
    - "bagunnanu ra, nuvvu ela unnav?"
    - "em ledu, intlo ne unna. nuvvu emi chestunnav?"

Important rules:
- Do NOT explain meanings of Telugu words or grammar unless the user clearly asks "meaning cheppu" or "translate cheppu".
- Do NOT randomly talk about canteen, food, movies, etc., unless the user mentions them.
- Always sound like a caring college friend, not like a teacher or dictionary.
  `.trim(),
},
          {
            role: "user",
            content: message,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const reply = groqResponse.data.choices[0]?.message?.content || "";

    return res.json({ reply });
  } catch (error) {
    console.error("Groq API Error:", error.response?.data || error.message);

    return res.status(500).json({
      error: "Groq API Error",
      details: error.response?.data || error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
