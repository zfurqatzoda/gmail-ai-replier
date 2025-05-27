import { buffer } from "micro";

export const config = {
  api: {
    bodyParser: false,
  },
};

const setCorsHeaders = (res) => {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
};

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  let message;

  try {
    const rawBody = await buffer(req);
    const parsedBody = JSON.parse(rawBody.toString());

    if (!parsedBody.message) {
      return res.status(400).json({ success: false, error: "Missing message" });
    }

    message = parsedBody.message;
  } catch (err) {
    console.error("❌ JSON parse error:", err);
    return res.status(400).json({ success: false, error: "Invalid JSON" });
  }

  try {
    if (!process.env.OPENAI_API_KEY) throw new Error("Missing OpenAI API key");

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a helpful assistant that writes professional, friendly email replies." },
          { role: "user", content: message },
        ],
      }),
    });

    const data = await openaiRes.json();
    console.log("🧠 OpenAI raw response:", JSON.stringify(data, null, 2));

    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) {
      return res.status(500).json({ success: false, error: "No reply from OpenAI", full: data });
    }

    return res.status(200).json({ success: true, reply });
  } catch (err) {
    console.error("❌ OpenAI request failed:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
