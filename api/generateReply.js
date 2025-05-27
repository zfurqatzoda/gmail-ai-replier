// api/generateReply.js

import getRawBody from "raw-body";

export default async function handler(req, res) {
  try {
    // Parse raw body
    const rawBody = await getRawBody(req);
    const { message } = JSON.parse(rawBody.toString());

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that writes professional, friendly email replies.",
          },
          { role: "user", content: message },
        ],
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({ error: "No reply returned from OpenAI" });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("❌ Server error:", error);
    return res.status(500).json({ error: "Server crashed", details: error.message });
  }
}
