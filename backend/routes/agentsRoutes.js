import express from "express";
import { AgentsStore } from "../store/agentsStore.js";
import crypto from "crypto";

const router = express.Router();

function newId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

// Agents CRUD
router.get("/agents", (req, res) => {
  res.json({ agents: AgentsStore.listAgents() });
});

router.post("/agents", (req, res) => {
  const { name, systemPrompt, model, temperature } = req.body;
  const agent = {
    id: newId("agent"),
    name,
    systemPrompt: systemPrompt || "You are a helpful assistant.",
    model: model || "gpt-4o-mini",
    temperature: typeof temperature === "number" ? temperature : 0.7,
  };
  AgentsStore.upsertAgent(agent);
  res.json({ agent });
});

router.put("/agents/:id", (req, res) => {
  const agents = AgentsStore.listAgents();
  const idx = agents.findIndex(a => a.id === req.params.id);
  if (idx < 0) return res.sendStatus(404);
  const updated = { ...agents[idx], ...req.body };
  AgentsStore.upsertAgent(updated);
  res.json({ agent: updated });
});

router.delete("/agents/:id", (req, res) => {
  AgentsStore.deleteAgent(req.params.id);
  res.sendStatus(204);
});

// Bindings CRUD
router.get("/bindings", (req, res) => {
  res.json({ bindings: AgentsStore.listBindings() });
});

router.post("/bindings", (req, res) => {
  const { platform, pageId, threadId, agentId } = req.body;
  const binding = { id: newId("bind"), platform, pageId, threadId, agentId };
  AgentsStore.upsertBinding(binding);
  res.json({ binding });
});

router.put("/bindings/:id", (req, res) => {
  const bindings = AgentsStore.listBindings();
  const idx = bindings.findIndex(b => b.id === req.params.id);
  if (idx < 0) return res.sendStatus(404);
  const updated = { ...bindings[idx], ...req.body };
  AgentsStore.upsertBinding(updated);
  res.json({ binding: updated });
});

router.delete("/bindings/:id", (req, res) => {
  AgentsStore.deleteBinding(req.params.id);
  res.sendStatus(204);
});

export default router;
