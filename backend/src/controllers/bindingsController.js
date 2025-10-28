import { BindingsStore } from "../store/bindingsStore.js";

export class BindingsController {
  constructor() {
    this.store = new BindingsStore();
  }

  list = (req, res) => {
    try {
      res.json({ bindings: this.store.list() });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  upsert = (req, res) => {
    try {
      const { channelId, agentId, platform } = req.body;
      if (!channelId || !agentId || !platform) return res.status(400).json({ error: "channelId, agentId, and platform are required" });
      const saved = this.store.upsert({ channelId, agentId, platform });
      res.json({ binding: saved });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  remove = (req, res) => {
    try {
      const { channelId } = req.params;
      const removed = this.store.remove(channelId);
      res.json({ binding: removed });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };
}
