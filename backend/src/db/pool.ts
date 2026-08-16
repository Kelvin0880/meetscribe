import { Pool } from "pg";
import { env } from "../config/env";
import { logger } from "../utils/logger";

const isLocalDb = /localhost|127\.0\.0\.1/.test(env.DATABASE_URL);

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  // Render Postgres exige SSL para conexiones externas (dev local); dentro
  // de la red interna de Render también funciona con este flag.
  ssl: isLocalDb ? false : { rejectUnauthorized: false },
});

pool.on("error", (err) => {
  // Error en una conexión inactiva del pool: se loguea pero no se tumba el proceso.
  logger.error("db_pool_idle_error", { message: err.message });
});
