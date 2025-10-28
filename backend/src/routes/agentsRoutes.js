import { Router } from "express";

export function createAgentsRoutes(controller) {
  const router = Router();
  router.get("/agents", controller.list);
  router.post("/agents", controller.create);
  router.put("/agents/:id", controller.update);
  router.delete("/agents/:id", controller.remove);
  return router;
}
