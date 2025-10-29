// backend/services/threadsStore.js
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "backend", "data");
const THREADS_FILE = path.join(DATA_DIR, "threads.json");

async function ensureDataFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(THREADS_FILE);
  } catch {
    await fs.writeFile(THREADS_FILE, JSON.stringify({ threads: {} }, null, 2));
  }
}

function makeKey(assistantId, conversationId) {
  return `${assistantId}::${conversationId}`;
}

export async function getThreadId(assistantId, conversationId) {
  await ensureDataFile();
  const raw = await fs.readFile(THREADS_FILE, "utf8");
  const parsed = JSON.parse(raw || "{}");
  return parsed.threads?.[makeKey(assistantId, conversationId)] || null;
}

export async function setThreadId(assistantId, conversationId, threadId) {
  await ensureDataFile();
  const raw = await fs.readFile(THREADS_FILE, "utf8");
  const parsed = JSON.parse(raw || "{\"threads\":{}}" );
  if (!parsed.threads) parsed.threads = {};
  parsed.threads[makeKey(assistantId, conversationId)] = threadId;
  await fs.writeFile(THREADS_FILE, JSON.stringify(parsed, null, 2));
}
