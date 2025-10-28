import { Router } from "express";

export function createBindingsRoutes(controller) {
  const router = Router();
  router.get("/bindings", controller.list);
  router.post("/bindings", controller.upsert);
  router.delete("/bindings/:channelId", controller.remove);
  return router;
}
