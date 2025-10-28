import { Router } from "express";

export function createChannelsRoutes(controller) {
  const router = Router();
  router.get("/channels", controller.list);
  router.post("/channels", controller.upsert);
  router.delete("/channels/:channelId", controller.remove);
  return router;
}
