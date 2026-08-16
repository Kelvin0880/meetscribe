import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import * as controller from "../controllers/transcripts.controller";

export const transcriptsRouter = Router();

transcriptsRouter.post("/", asyncHandler(controller.createTranscriptHandler));
transcriptsRouter.get("/", asyncHandler(controller.listTranscriptsHandler));
transcriptsRouter.get("/:id", asyncHandler(controller.getTranscriptHandler));
transcriptsRouter.delete("/:id", asyncHandler(controller.deleteTranscriptHandler));
