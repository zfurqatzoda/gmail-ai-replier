export default async function handler(req, res) {
    const { message } = req.body;
  
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
            content: "You are a helpful assistant that writes email replies on my behalf. Your responses should be professional, friendly, and concise. Match the tone of the original message when appropriate, and ensure the reply is clear, polite, and actionable. Avoid unnecessary repetition. Always aim to save my time while maintaining a human, trustworthy voice.",
          },
          { role: "user", content: message },
        ],
      }),
    });
  
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;
    res.status(200).json({ reply });
  }
  