import { ChannelsStore } from "../store/channelsStore.js";

export class ChannelsController {
  constructor() {
    this.store = new ChannelsStore();
  }

  list = (req, res) => {
    try {
      res.json({ channels: this.store.list() });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  upsert = (req, res) => {
    try {
      const { platform, pageId, accessToken, name } = req.body;
      if (!platform || !pageId || !accessToken) return res.status(400).json({ error: "platform, pageId, accessToken required" });
      const channelId = `${platform}:${pageId}`;
      const saved = this.store.upsert({ channelId, platform, pageId, accessToken, name: name || channelId });
      res.json({ channel: saved });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  remove = (req, res) => {
    try {
      const { channelId } = req.params;
      const removed = this.store.remove(channelId);
      res.json({ channel: removed });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };
}
