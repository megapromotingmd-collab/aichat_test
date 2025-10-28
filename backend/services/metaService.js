import axios from "axios";
import { config } from "../config/env.js";

const GRAPH_BASE = `https://graph.facebook.com/${config.meta.graphVersion}`;

function buildAuth(tokenOverride) {
  const token = tokenOverride || config.meta.pageAccessToken;
  if (!token) throw new Error("Missing Meta Page Access Token");
  return { access_token: token };
}

export const MetaService = {
  async listConversations({ limit = 25, after, token } = {}) {
    const params = {
      ...buildAuth(token),
      fields: "participants.limit(10){id,name},snippet,updated_time",
      limit,
    };
    if (after) params.after = after;
    const url = `${GRAPH_BASE}/me/conversations`;
    const { data } = await axios.get(url, { params });
    return data;
  },

  async getMessages(conversationId, { limit = 50, before, after, token } = {}) {
    const params = {
      ...buildAuth(token),
      fields: "from,message,created_time",
      limit,
    };
    if (before) params.before = before;
    if (after) params.after = after;
    const url = `${GRAPH_BASE}/${conversationId}/messages`;
    const { data } = await axios.get(url, { params });
    return data;
  },

  async sendMessage(recipientId, text, { token } = {}) {
    const url = `${GRAPH_BASE}/me/messages`;
    const payload = {
      messaging_type: "RESPONSE",
      recipient: { id: recipientId },
      message: { text },
    };
    const params = buildAuth(token);
    const { data } = await axios.post(url, payload, { params });
    return data;
  },
};
