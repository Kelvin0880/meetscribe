import { env } from "./config/env";
import { createApp } from "./app";
import { runMigrations } from "./db/migrate";
import { logger } from "./utils/logger";

async function start(): Promise<void> {
  try {
    await runMigrations();
    const app = createApp();
    app.listen(env.PORT, () => {
      logger.info("server_started", { port: env.PORT, env: env.NODE_ENV });
    });
  } catch (err) {
    logger.error("startup_failed", { message: (err as Error).message });
    process.exit(1);
  }
}

start();

// El backend nunca debe crashear silenciosamente: cualquier promesa no
// atrapada o excepción se loguea con contexto antes de terminar.
process.on("unhandledRejection", (reason) => {
  logger.error("unhandled_rejection", { message: (reason as Error)?.message ?? String(reason) });
});

process.on("uncaughtException", (err) => {
  logger.error("uncaught_exception", { message: err.message });
  process.exit(1);
});
