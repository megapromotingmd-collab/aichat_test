// backend/controllers/assistantsController.js
import { getOpenAIClient } from "../services/openaiClient.js";
import { addAssistant, listAssistants } from "../services/assistantsStore.js";

export async function getAssistants(req, res) {
  try {
    const assistants = await listAssistants();
    res.json({ assistants });
  } catch (err) {
    res.status(500).json({ error: "Failed to list assistants", details: err.message });
  }
}

export async function createAssistant(req, res) {
  try {
    const { name, instructions, model = "gpt-4o-mini" } = req.body || {};
    if (!name || !instructions) {
      return res.status(400).json({ error: "name and instructions are required" });
    }

    const client = getOpenAIClient();
    const assistant = await client.beta.assistants.create({
      name,
      instructions,
      model,
    });

    const saved = await addAssistant(assistant);
    res.status(201).json({ assistant: saved });
  } catch (err) {
    res.status(500).json({ error: "Failed to create assistant", details: err.message });
  }
}
