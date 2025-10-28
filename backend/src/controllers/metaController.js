import { ChannelsStore } from "../store/channelsStore.js";

export class MetaController {
  constructor(metaService) {
    this.metaService = metaService;
    this.channelsStore = new ChannelsStore();
  }

  listConversations = async (req, res) => {
    try {
      const { channelId } = req.query;
      const channel = channelId ? this.channelsStore.get(channelId) : null;
      const tokenOverride = channel?.accessToken;
      const conversations = await this.metaService.listConversations(tokenOverride);
      res.json({ conversations });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  getMessages = async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { channelId } = req.query;
      const channel = channelId ? this.channelsStore.get(channelId) : null;
      const tokenOverride = channel?.accessToken;
      const messages = await this.metaService.getMessages(conversationId, tokenOverride);
      res.json({ messages });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  sendMessage = async (req, res) => {
    try {
      const { recipientId, message, channelId } = req.body;
      if (!recipientId || !message) return res.status(400).json({ error: "recipientId and message are required" });
      const channel = channelId ? this.channelsStore.get(channelId) : null;
      const tokenOverride = channel?.accessToken;
      const data = await this.metaService.sendMessage(recipientId, message, tokenOverride);
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
}
