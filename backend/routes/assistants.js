// backend/routes/assistants.js
import { Router } from "express";
import { createAssistant, getAssistants } from "../controllers/assistantsController.js";
import { replyWithAssistant } from "../controllers/chatController.js";

const router = Router();

router.get("/", getAssistants);
router.post("/", createAssistant);
router.post("/:assistantId/reply", replyWithAssistant);

export default router;
