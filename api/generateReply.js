export default async function handler(req, res) {
    // ✅ Add this line to parse the body manually
    const body = req.method === "POST" ? await getRawBody(req) : null;
  
    // ✅ Convert buffer to JSON
    const { message } = JSON.parse(body);
  
    // 🔐 Call OpenAI API (same as before)
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
  
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;
    res.status(200).json({ reply });
  }
  
  // Required to read raw body in Vercel's serverless environment
  import getRawBody from "raw-body";
  