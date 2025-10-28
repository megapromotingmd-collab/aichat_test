import express from "express";
import { MetaService } from "../services/metaService.js";

const router = express.Router();

router.get("/conversations", async (req, res) => {
  try {
    const data = await MetaService.listConversations({ token: req.query.token });
    const conversations = (data.data || []).map(conv => ({
      conversationId: conv.id,
      data: conv.participants?.data?.[0] || {},
      snippet: conv.snippet,
      updated_time: conv.updated_time,
    }));
    res.json({ conversations, paging: data.paging });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/messages/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const data = await MetaService.getMessages(conversationId, { token: req.query.token });
    const messages = (data.data || []).map(msg => ({
      id: msg.id,
      from: msg.from?.name,
      fromId: msg.from?.id,
      text: msg.message,
      time: msg.created_time,
    }));
    res.json({ messages, paging: data.paging });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/send-message", async (req, res) => {
  try {
    const { recipientId, message, token } = req.body;
    if (!recipientId || !message) return res.status(400).json({ error: "recipientId and message are required" });
    const data = await MetaService.sendMessage(recipientId, message, { token });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
