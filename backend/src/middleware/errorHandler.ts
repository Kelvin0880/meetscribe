import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";

// Middleware de errores de Express: debe tener 4 parámetros para que Express lo reconozca como tal.
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    logger.warn("handled_error", { path: req.path, status: err.statusCode, message: err.message });
    res.status(err.statusCode).json({ error: { message: err.message } });
    return;
  }

  logger.error("unhandled_error", { path: req.path, message: (err as Error)?.message });
  res.status(500).json({ error: { message: "Error interno del servidor" } });
}
