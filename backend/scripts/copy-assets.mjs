// tsc solo compila .ts — los .sql de las migraciones hay que copiarlos a
// mano a dist/ para que el build de producción (el que corre en Render)
// los encuentre en runtime.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(__dirname, "../src/db/migrations");
const dest = path.resolve(__dirname, "../dist/db/migrations");

fs.cpSync(src, dest, { recursive: true });
console.log(`Migraciones copiadas a ${dest}`);
