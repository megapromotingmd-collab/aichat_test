import express from "express";
import { config } from "../config/env.js";
import { AgentsStore } from "../store/agentsStore.js";
import { MetaService } from "../services/metaService.js";
import { generateAgentReply } from "../services/aiService.js";

const router = express.Router();

// Verification endpoint for Meta Webhooks
router.get("/meta", (req, res) => {
  const VERIFY_TOKEN = config.meta.verifyToken;
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token && mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// Receive messages from Meta (Facebook/Instagram)
router.post("/meta", async (req, res) => {
  try {
    const body = req.body;

    // Basic structure: body.entry[].messaging[] for FB Messenger
    if (body.object === "page") {
      for (const entry of body.entry || []) {
        for (const messagingEvent of entry.messaging || []) {
          const senderId = messagingEvent.sender?.id;
          const recipientId = messagingEvent.recipient?.id; // page id
          const messageText = messagingEvent.message?.text;
          const threadId = senderId; // for simplicity use sender as thread

          if (messageText && senderId) {
            const binding =
              AgentsStore.findBindingForEvent("facebook", { threadId, pageId: recipientId });
            if (binding) {
              const agents = AgentsStore.listAgents();
              const agent = agents.find(a => a.id === binding.agentId);
              if (agent) {
                const reply = await generateAgentReply({
                  systemPrompt: agent.systemPrompt,
                  history: [], // could be enhanced with stored history
                  userMessage: messageText,
                });
                await MetaService.sendMessage(senderId, reply);
              }
            }
          }
        }
      }
      return res.sendStatus(200);
    }

    return res.sendStatus(404);
  } catch (e) {
    console.error("Webhook error:", e);
    return res.sendStatus(500);
  }
});

export default router;
