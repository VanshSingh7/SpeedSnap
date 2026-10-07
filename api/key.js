// Vercel Serverless Function — Exposes GEMINI_API_KEY from Vercel Environment Variables
export default function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY || '';
  res.status(200).json({ apiKey });
}
