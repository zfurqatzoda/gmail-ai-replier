import { buffer } from "micro";

export const config = {
  api: {
    bodyParser: false,
  },
};

const setCorsHeaders = (res) => {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*"); // Consider restricting this in production
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
      return res.status(400).json({ success: false, error: "Missing 'message' in request body" });
    }

    message = parsedBody.message;
  } catch (err) {
    console.error("❌ JSON parse error:", err.message);
    return res.status(400).json({ success: false, error: "Invalid JSON format" });
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ Missing OpenAI API key");
      return res.status(500).json({ success: false, error: "Server configuration error" });
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
          { role: "system", content: "You are a helpful assistant that writes professional, friendly email replies." },
          { role: "user", content: message },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const errorData = await openaiRes.json();
      console.error("❌ OpenAI API error:", errorData);
      return res.status(openaiRes.status).json({
        success: false,
        error: errorData.error?.message || "Failed to fetch response from OpenAI API",
      });
    }

    const data = await openaiRes.json();
    console.log("🧠 OpenAI raw response:", JSON.stringify(data, null, 2));

    return res.status(200).json({
      success: true,
      reply: data?.choices?.[0]?.message?.content || "No reply generated",
    });
  } catch (err) {
    console.error("❌ Unexpected error:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
