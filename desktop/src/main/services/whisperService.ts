import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { app } from "electron";
import { env } from "../config/env";

function resourcesRoot(): string {
  // En dev los binarios viven en desktop/resources/whisper (los baja
  // `npm run setup:whisper`). Empaquetada, la app los sirve desde
  // process.resourcesPath vía "extraResources" (ver package.json > build).
  // electron-vite empaqueta todo el proceso main en out/main/index.js, así
  // que __dirname en runtime siempre es desktop/out/main sin importar de
  // qué carpeta de src/ vino originalmente este módulo.
  return app.isPackaged
    ? path.join(process.resourcesPath, "whisper")
    : path.join(__dirname, "../../resources/whisper");
}

function resolveBinaryPath(): string {
  return env.WHISPER_CLI_PATH ?? path.join(resourcesRoot(), "whisper-cli.exe");
}

function resolveModelPath(): string {
  return env.WHISPER_MODEL_PATH ?? path.join(resourcesRoot(), "models", "ggml-base.bin");
}

export class WhisperNotConfiguredError extends Error {
  constructor(missingPath: string) {
    super(
      `No se encontró "${missingPath}". Corré "npm run setup:whisper" dentro de desktop/ para descargar ` +
        "el binario y el modelo de Whisper antes de grabar.",
    );
    this.name = "WhisperNotConfiguredError";
  }
}

/**
 * Transcribe un WAV local usando whisper.cpp corriendo 100% en el equipo del
 * usuario (sin costo, sin subir audio a ningún servidor). Devuelve el texto
 * plano; el resumen por IA se hace después, en el backend, sobre ese texto.
 */
export async function transcribeWavFile(wavPath: string): Promise<string> {
  const binaryPath = resolveBinaryPath();
  const modelPath = resolveModelPath();

  if (!fs.existsSync(binaryPath)) throw new WhisperNotConfiguredError(binaryPath);
  if (!fs.existsSync(modelPath)) throw new WhisperNotConfiguredError(modelPath);

  const outputBase = wavPath.replace(/\.wav$/i, "");

  await new Promise<void>((resolve, reject) => {
    const child = spawn(binaryPath, [
      "-m", modelPath,
      "-f", wavPath,
      "-otxt",
      "-of", outputBase,
      "-l", "auto",
      "-nt", // sin timestamps por línea, solo texto plano
    ]);

    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (err) => reject(new Error(`No se pudo ejecutar whisper-cli: ${err.message}`)));
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`whisper-cli terminó con código ${code}: ${stderr.slice(-500)}`));
    });
  });

  const txtPath = `${outputBase}.txt`;
  if (!fs.existsSync(txtPath)) {
    throw new Error("whisper-cli no generó el archivo de transcript esperado");
  }

  const text = fs.readFileSync(txtPath, "utf-8").trim();
  fs.rmSync(txtPath, { force: true });

  return text;
}
