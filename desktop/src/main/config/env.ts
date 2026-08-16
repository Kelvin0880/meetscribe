import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";
import { logger } from "../utils/logger";

// Comparte el .env de la raíz del repo con el backend, así solo hay un lugar
// donde tocar la URL del backend en Render o las rutas locales de Whisper.
// electron-vite empaqueta el proceso main entero en out/main/index.js, así
// que __dirname en runtime siempre es desktop/out/main.
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const envSchema = z.object({
  MEETSCRIBE_BACKEND_URL: z.string().url().default("http://localhost:3000"),
  WHISPER_CLI_PATH: z.string().optional(),
  WHISPER_MODEL_PATH: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // No tumbamos la app de escritorio por una env var mal seteada: logueamos
  // y seguimos con los defaults, para no romper la experiencia del usuario.
  logger.warn("invalid_env_using_defaults", { errors: parsed.error.flatten().fieldErrors });
}

export const env = parsed.success
  ? parsed.data
  : {
      MEETSCRIBE_BACKEND_URL: "http://localhost:3000",
      WHISPER_CLI_PATH: undefined as string | undefined,
      WHISPER_MODEL_PATH: undefined as string | undefined,
    };
