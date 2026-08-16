import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

// En desarrollo local las variables viven en el .env de la raíz del repo
// (compartido con la app de escritorio). En Render se configuran como
// Environment Variables del servicio, así que este archivo no existe ahí
// y dotenv simplemente no encuentra nada que cargar (no falla).
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, "Falta DATABASE_URL"),
  OPENROUTER_API_KEY: z.string().min(1, "Falta OPENROUTER_API_KEY"),
  OPENROUTER_MODEL: z.string().default("openai/gpt-oss-20b:free"),
  OPENROUTER_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  APP_URL: z.string().optional(),
  CORS_ORIGIN: z.string().default("*"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Fallar rápido y claro en el arranque evita errores crípticos más adelante.
  console.error("Variables de entorno inválidas:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
