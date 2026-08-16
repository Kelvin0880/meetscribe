/**
 * Error controlado con status HTTP asociado. Todo lo que el cliente deba
 * poder leer directamente (validación, 404, timeouts de servicios externos)
 * se lanza como AppError; cualquier otro error se trata como un bug interno
 * y se responde con un 500 genérico (ver middleware/errorHandler.ts).
 */
export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}
