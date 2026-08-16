import { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Envuelve un handler async para que sus rechazos de promesa lleguen al
 * middleware de errores de Express en vez de crashear el proceso.
 */
export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
