// backend/server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { config } from "./config/env.js";
import metaRoutes from "./routes/metaRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import agentsRoutes from "./routes/agentsRoutes.js";
import oauthRoutes from "./routes/oauthRoutes.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Health
app.get("/health", (_req, res) => res.json({ ok: true }));

// Routes
app.use("/api/meta", metaRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api", agentsRoutes);
app.use("/api/oauth", oauthRoutes);

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
