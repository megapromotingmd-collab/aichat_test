// backend/services/assistantsStore.js
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "backend", "data");
const ASSISTANTS_FILE = path.join(DATA_DIR, "assistants.json");

async function ensureDataFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(ASSISTANTS_FILE);
  } catch {
    await fs.writeFile(ASSISTANTS_FILE, JSON.stringify({ assistants: [] }, null, 2));
  }
}

export async function listAssistants() {
  await ensureDataFile();
  const raw = await fs.readFile(ASSISTANTS_FILE, "utf8");
  const parsed = JSON.parse(raw || "{}");
  return parsed.assistants || [];
}

export async function addAssistant(assistant) {
  await ensureDataFile();
  const assistants = await listAssistants();
  const cleaned = {
    id: assistant.id,
    name: assistant.name,
    model: assistant.model,
    instructions: assistant.instructions,
    createdAt: new Date().toISOString(),
  };
  assistants.push(cleaned);
  await fs.writeFile(ASSISTANTS_FILE, JSON.stringify({ assistants }, null, 2));
  return cleaned;
}
