import OpenAI from "openai";
import { config } from "../config/env.js";

const client = new OpenAI({ apiKey: config.openai.apiKey });

export async function generateAgentReply({ systemPrompt, history, userMessage }) {
  const messages = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  for (const m of history || []) messages.push(m);
  messages.push({ role: "user", content: userMessage });

  const response = await client.chat.completions.create({
    model: config.openai.model,
    temperature: config.openai.temperature,
    messages,
  });
  return response.choices?.[0]?.message?.content ?? "";
}
