export default function handler(req, res) {
    // Allow POST only
    if (req.method !== "POST") {
      return res
        .status(405)
        .json({ success: false, error: `Only POST allowed, got ${req.method}` });
    }
  
    // Just echo back a test reply
    return res.status(200).json({
      success: true,
      reply: "🔧 Your backend is wired up and working!",
    });
  }
  
