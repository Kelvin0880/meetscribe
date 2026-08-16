import express, { Express, Request, Response } from "express";
import cors from "cors";
import { env } from "./config/env";
import { healthRouter } from "./routes/health.routes";
import { transcriptsRouter } from "./routes/transcripts.routes";
import { errorHandler } from "./middleware/errorHandler";

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: "10mb" })); // transcripts largos de texto, nunca audio

  app.get("/", (_req: Request, res: Response) => {
    res.json({ name: "MeetScribe API", status: "ok", health: "/health" });
  });

  app.use("/health", healthRouter);
  app.use("/api/transcripts", transcriptsRouter);

  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: { message: "Ruta no encontrada" } });
  });

  app.use(errorHandler);

  return app;
}
