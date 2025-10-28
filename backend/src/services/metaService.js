import axios from "axios";

export class MetaService {
  constructor(config) {
    this.pageAccessToken = config.pageAccessToken;
    this.graphBaseUrl = config.graphBaseUrl || "https://graph.facebook.com/v20.0";
  }

  async listConversations(accessTokenOverride) {
    const url = `${this.graphBaseUrl}/me/conversations`;
    const response = await axios.get(url, {
      params: {
        fields: "participants.limit(10){id,name},snippet",
        access_token: accessTokenOverride || this.pageAccessToken,
      },
    });
    return response.data.data.map((conv) => ({
      conversationId: conv.id,
      data: conv.participants?.data?.[0] || {},
      snippet: conv.snippet,
    }));
  }

  async getMessages(conversationId, accessTokenOverride) {
    const url = `${this.graphBaseUrl}/${conversationId}/messages`;
    const response = await axios.get(url, {
      params: {
        fields: "from,message,created_time",
        access_token: accessTokenOverride || this.pageAccessToken,
      },
    });
    return response.data.data.map((msg) => ({
      id: msg.id,
      from: msg.from?.name,
      fromId: msg.from?.id,
      text: msg.message,
      time: msg.created_time,
    }));
  }

  async sendMessage(recipientId, text, accessTokenOverride) {
    const url = `${this.graphBaseUrl}/me/messages`;
    const response = await axios.post(
      url,
      {
        messaging_type: "RESPONSE",
        recipient: { id: recipientId },
        message: { text },
      },
      {
        params: { access_token: accessTokenOverride || this.pageAccessToken },
      }
    );
    return response.data;
  }
}
