import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "../../data");
const AGENTS_FILE = path.join(DATA_DIR, "agents.json");
const BINDINGS_FILE = path.join(DATA_DIR, "bindings.json");

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(AGENTS_FILE)) fs.writeFileSync(AGENTS_FILE, JSON.stringify([] , null, 2));
  if (!fs.existsSync(BINDINGS_FILE)) fs.writeFileSync(BINDINGS_FILE, JSON.stringify([], null, 2));
}

function readJson(file) {
  ensureDataFiles();
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function writeJson(file, data) {
  ensureDataFiles();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Agent: { id, name, systemPrompt, model, temperature }
// Binding: { id, platform: "facebook"|"instagram", pageId, threadId?, agentId }

export const AgentsStore = {
  listAgents() {
    return readJson(AGENTS_FILE);
  },
  upsertAgent(agent) {
    const agents = readJson(AGENTS_FILE);
    const idx = agents.findIndex(a => a.id === agent.id);
    if (idx >= 0) agents[idx] = agent; else agents.push(agent);
    writeJson(AGENTS_FILE, agents);
    return agent;
  },
  deleteAgent(id) {
    const agents = readJson(AGENTS_FILE).filter(a => a.id !== id);
    writeJson(AGENTS_FILE, agents);
  },
  listBindings() {
    return readJson(BINDINGS_FILE);
  },
  upsertBinding(binding) {
    const bindings = readJson(BINDINGS_FILE);
    const idx = bindings.findIndex(b => b.id === binding.id);
    if (idx >= 0) bindings[idx] = binding; else bindings.push(binding);
    writeJson(BINDINGS_FILE, bindings);
    return binding;
  },
  deleteBinding(id) {
    const bindings = readJson(BINDINGS_FILE).filter(b => b.id !== id);
    writeJson(BINDINGS_FILE, bindings);
  },
  findBindingByThread(platform, threadId) {
    const bindings = readJson(BINDINGS_FILE);
    return bindings.find(b => b.platform === platform && b.threadId === threadId);
  },
  findBindingForEvent(platform, { threadId, pageId }) {
    const bindings = readJson(BINDINGS_FILE);
    // Prioritize thread-specific binding
    const byThread = bindings.find(
      b => b.platform === platform && b.threadId && threadId && b.threadId === threadId
    );
    if (byThread) return byThread;
    // Fallback: page-wide/default binding (no threadId specified)
    const byPage = bindings.find(
      b => b.platform === platform && !b.threadId && b.pageId && pageId && b.pageId === pageId
    );
    return byPage || null;
  }
};
