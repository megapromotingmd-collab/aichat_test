import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  meta: {
    appId: process.env.META_APP_ID || "",
    appSecret: process.env.META_APP_SECRET || "",
    verifyToken: process.env.META_VERIFY_TOKEN || "dev-verify-token",
    // Optional bootstrap token for quick testing without OAuth
    pageAccessToken: process.env.PAGE_ACCESS_TOKEN || "",
    graphVersion: process.env.META_GRAPH_VERSION || "v20.0",
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: Number.isNaN(Number(process.env.OPENAI_TEMPERATURE))
      ? 0.7
      : Number(process.env.OPENAI_TEMPERATURE),
  },
};
