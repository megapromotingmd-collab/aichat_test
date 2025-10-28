import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";

import { MetaService } from "./services/metaService.js";
import { AgentsService } from "./services/agentsService.js";

import { MetaController } from "./controllers/metaController.js";
import { AgentsController } from "./controllers/agentsController.js";
import { BindingsController } from "./controllers/bindingsController.js";

import { createMetaRoutes } from "./routes/metaRoutes.js";
import { createAgentsRoutes } from "./routes/agentsRoutes.js";
import { createBindingsRoutes } from "./routes/bindingsRoutes.js";
import { createChannelsRoutes } from "./routes/channelsRoutes.js";
import { createMetaWebhook } from "./webhooks/metaWebhook.js";
import { ChannelsStore } from "./store/channelsStore.js";
import { ChannelsController } from "./controllers/channelsController.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const config = {
  pageAccessToken: process.env.PAGE_ACCESS_TOKEN || "",
  verifyToken: process.env.META_VERIFY_TOKEN || "",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
};

// Services
const metaService = new MetaService({ pageAccessToken: config.pageAccessToken });
const agentsService = new AgentsService({ openaiApiKey: config.openaiApiKey });

// Controllers
const metaController = new MetaController(metaService);
const agentsController = new AgentsController(agentsService);
const bindingsController = new BindingsController();
const channelsStore = new ChannelsStore();
const channelsController = new ChannelsController();

// Routes
app.use("/api", createMetaRoutes(metaController));
app.use("/api", createAgentsRoutes(agentsController));
app.use("/api", createBindingsRoutes(bindingsController));
app.use("/api", createChannelsRoutes(channelsController));

// Webhook
const webhook = createMetaWebhook({
  verifyToken: config.verifyToken,
  onMessage: async ({ senderId, recipientId, text }) => {
    // recipientId is the page ID; build channelId and look up binding/token
    const channelId = `facebook:${recipientId}`;
    const binding = bindingsController.store.getByChannel(channelId);
    if (binding?.agentId) {
      const messages = [{ fromId: senderId, text }];
      try {
        const reply = await agentsService.generateReply(binding.agentId, messages);
        const channel = channelsStore.get(channelId);
        const tokenOverride = channel?.accessToken;
        if (reply) await metaService.sendMessage(senderId, reply, tokenOverride);
      } catch (e) {
        console.error("Agent reply failed:", e.message);
      }
    }
  },
});

app.get("/webhook", webhook.verify);
app.post("/webhook", webhook.handle);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
