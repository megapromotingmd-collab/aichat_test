// backend/services/openaiClient.js
import OpenAI from "openai";

let cachedClient = null;

export function getOpenAIClient() {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing OPENAI_API_KEY. Please set it in your environment variables."
    );
  }
  cachedClient = new OpenAI({ apiKey });
  return cachedClient;
}
