import axios from "axios";

// .env読み込み (Vercelなら自動で読み込み)
const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const events = req.body.events;
  for (const event of events) {
    if (event.type === "message" && event.message.type === "text") {
      const userMessage = event.message.text;

      // Geminiに問い合わせ
      const geminiReply = await generateGeminiResponse(userMessage);

      // LINEに返信
      await replyToLine(event.replyToken, geminiReply);
    }
  }
  res.status(200).send("OK");
}

async function generateGeminiResponse(userMessage) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

  const requestData = {
    contents: [{ parts: [{ text: userMessage }] }],
  };

  try {
    const res = await axios.post(url, requestData);
    const geminiText = res.data.candidates[0].content.parts[0].text;
    return geminiText;
  } catch (err) {
    console.error("Gemini Error", err);
    return "エラーが発生しました";
  }
}

async function replyToLine(replyToken, message) {
  const url = "https://api.line.me/v2/bot/message/reply";
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${LINE_TOKEN}`,
  };
  const body = {
    replyToken,
    messages: [{ type: "text", text: message }],
  };

  await axios.post(url, body, { headers });
}
