import crypto from "crypto";

export function createMetaWebhook({ verifyToken, onMessage }) {
  return {
    verify: (req, res) => {
      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];
      if (mode === "subscribe" && token === verifyToken) {
        return res.status(200).send(challenge);
      }
      return res.sendStatus(403);
    },

    // Minimal handler for incoming messaging events
    handle: async (req, res) => {
      try {
        const body = req.body;
        if (body.object === "page" && Array.isArray(body.entry)) {
          for (const entry of body.entry) {
            const events = entry.messaging || [];
            for (const event of events) {
              if (event.message && event.sender?.id) {
                await onMessage({
                  senderId: event.sender.id,
                  recipientId: event.recipient?.id,
                  text: event.message.text,
                  timestamp: event.timestamp,
                });
              }
            }
          }
        }
        res.sendStatus(200);
      } catch (e) {
        res.status(500).json({ error: e.message });
      }
    },
  };
}
