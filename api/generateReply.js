// /api/generateReply.js

import { buffer } from "micro";

export const config = {
  api: {
    bodyParser: false, // required for micro buffer to work
  },
};

// Set necessary CORS headers
const setCorsHeaders = (res) => {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
};

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed",
      details: `Expected POST, got ${req.method}`,
    });
  }

  let message;
  try {
    const rawBody = await buffer(req);
    const parsedBody = JSON.parse(rawBody.toString());

    if (!parsedBody.message || typeof parsedBody.message !== "string" || !parsedBody.message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Bad Request",
        details: "Missing or invalid 'message' field",
      });
    }

    message = parsedBody.message.trim();
  } catch (err) {
    console.error("❌ Invalid request body:", err);
    return res.status(400).json({
      success: false,
      error: "Bad Request",
      details: "Could not parse JSON payload",
    });
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("Missing OPENAI_API_KEY in environment variables");
    }

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
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
          {
            role: "user",
            content: message,
          },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const errorText = await openaiRes.text();
      console.error("❌ OpenAI API error:", errorText);
      return res.status(500).json({
        success: false,
        error: "OpenAI API Error",
        details: errorText,
      });
    }

    const data = await openaiRes.json();
    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      console.error("❌ No valid reply received from OpenAI:", data);
      return res.status(500).json({
        success: false,
        error: "Invalid response from OpenAI",
        details: "Missing reply message",
      });
    }

    return res.status(200).json({
      success: true,
      reply,
    });
  } catch (err) {
    console.error("❌ Unexpected server error:", err);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      details: err.message || "Unknown error",
    });
  }
}
