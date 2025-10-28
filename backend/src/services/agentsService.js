import fs from "fs";
import path from "path";
import OpenAI from "openai";

const DATA_DIR = path.resolve(process.cwd(), "backend/data");
const AGENTS_FILE = path.join(DATA_DIR, "agents.json");

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(AGENTS_FILE)) fs.writeFileSync(AGENTS_FILE, JSON.stringify({ agents: [] }, null, 2));
}

export class AgentsService {
  constructor({ openaiApiKey }) {
    ensureDataFiles();
    this.client = new OpenAI({ apiKey: openaiApiKey });
  }

  listAgents() {
    const data = JSON.parse(fs.readFileSync(AGENTS_FILE, "utf-8"));
    return data.agents;
  }

  createAgent(agent) {
    const data = JSON.parse(fs.readFileSync(AGENTS_FILE, "utf-8"));
    const id = `agent_${Date.now()}`;
    const newAgent = { id, name: agent.name, model: agent.model || "gpt-4o-mini", systemPrompt: agent.systemPrompt || "You are a helpful assistant.", temperature: agent.temperature ?? 0.7 };
    data.agents.push(newAgent);
    fs.writeFileSync(AGENTS_FILE, JSON.stringify(data, null, 2));
    return newAgent;
  }

  updateAgent(id, updates) {
    const data = JSON.parse(fs.readFileSync(AGENTS_FILE, "utf-8"));
    const idx = data.agents.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error("Agent not found");
    data.agents[idx] = { ...data.agents[idx], ...updates };
    fs.writeFileSync(AGENTS_FILE, JSON.stringify(data, null, 2));
    return data.agents[idx];
  }

  deleteAgent(id) {
    const data = JSON.parse(fs.readFileSync(AGENTS_FILE, "utf-8"));
    const idx = data.agents.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error("Agent not found");
    const [removed] = data.agents.splice(idx, 1);
    fs.writeFileSync(AGENTS_FILE, JSON.stringify(data, null, 2));
    return removed;
  }

  async generateReply(agentId, messages) {
    const agents = this.listAgents();
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) throw new Error("Agent not found");

    const chatMessages = [
      { role: "system", content: agent.systemPrompt },
      ...messages.map((m) => ({ role: m.fromId === "bot" ? "assistant" : "user", content: m.text })),
    ];

    const response = await this.client.chat.completions.create({
      model: agent.model,
      temperature: agent.temperature,
      messages: chatMessages,
    });

    return response.choices?.[0]?.message?.content || "";
  }
}
