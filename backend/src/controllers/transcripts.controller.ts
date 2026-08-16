import { Request, Response } from "express";
import { z } from "zod";
import * as transcriptsService from "../services/transcripts.service";
import { AppError } from "../utils/AppError";

const createTranscriptSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio").max(200),
  transcriptText: z.string().trim().min(1, "El transcript no puede estar vacío"),
  audioDurationSeconds: z.number().int().nonnegative().optional(),
});

export async function createTranscriptHandler(req: Request, res: Response): Promise<void> {
  const parsed = createTranscriptSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(parsed.error.issues.map((issue) => issue.message).join(", "), 400);
  }
  const transcript = await transcriptsService.createTranscript(parsed.data);
  res.status(201).json(transcript);
}

const listQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function listTranscriptsHandler(req: Request, res: Response): Promise<void> {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new AppError(parsed.error.issues.map((issue) => issue.message).join(", "), 400);
  }
  const { q, limit, offset } = parsed.data;
  const result = await transcriptsService.listTranscripts({ search: q, limit, offset });
  res.json(result);
}

const idParamSchema = z.object({ id: z.string().uuid("id inválido") });

export async function getTranscriptHandler(req: Request, res: Response): Promise<void> {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    throw new AppError(parsed.error.issues[0].message, 400);
  }
  const transcript = await transcriptsService.getTranscriptById(parsed.data.id);
  res.json(transcript);
}

export async function deleteTranscriptHandler(req: Request, res: Response): Promise<void> {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    throw new AppError(parsed.error.issues[0].message, 400);
  }
  await transcriptsService.deleteTranscript(parsed.data.id);
  res.status(204).send();
}
