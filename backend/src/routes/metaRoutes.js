import { Router } from "express";

export function createMetaRoutes(controller) {
  const router = Router();
  router.get("/conversations", controller.listConversations);
  router.get("/messages/:conversationId", controller.getMessages);
  router.post("/send-message", controller.sendMessage);
  return router;
}
