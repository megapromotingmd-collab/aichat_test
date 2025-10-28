import express from "express";
import { config } from "../config/env.js";
import { TokenStore } from "../store/tokenStore.js";

const router = express.Router();

// Start Meta OAuth (dialog)
router.get("/meta/start", (req, res) => {
  const redirectUri = encodeURIComponent(`${req.protocol}://${req.get("host")}/api/oauth/meta/callback`);
  const scope = [
    "pages_messaging",
    "pages_manage_metadata",
    "pages_read_engagement",
    "instagram_manage_messages",
  ].join(",");
  const dialogUrl = `https://www.facebook.com/${config.meta.graphVersion}/dialog/oauth?client_id=${config.meta.appId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
  res.json({ url: dialogUrl });
});

// Callback stub (exchange code for tokens would go here)
router.get("/meta/callback", async (req, res) => {
  // For this scaffold, we simply record that OAuth would complete here
  // In production, exchange code for user access token, then get page access token
  const meta = TokenStore.getMetaTokens();
  res.json({ message: "OAuth callback stub. Implement token exchange.", meta });
});

export default router;
