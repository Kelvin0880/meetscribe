#!/usr/bin/env node
// Descarga el binario de whisper.cpp para Windows x64 y un modelo ggml, y
// los deja en desktop/resources/whisper/ (gitignorado — nunca se commitea).
//
// Uso: npm run setup:whisper  (opcional: -- --model small)

import fs from "node:fs";
import { createWriteStream } from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import AdmZip from "adm-zip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESOURCES_DIR = path.resolve(__dirname, "../resources/whisper");
const MODELS_DIR = path.join(RESOURCES_DIR, "models");
const BINARY_PATH = path.join(RESOURCES_DIR, "whisper-cli.exe");

const modelFlagIndex = process.argv.indexOf("--model");
const MODEL_NAME = modelFlagIndex !== -1 ? process.argv[modelFlagIndex + 1] : "base";

async function download(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo descargar ${url} (${res.status})`);
  await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
  await pipeline(res.body, createWriteStream(destPath));
}

async function downloadModel() {
  const destPath = path.join(MODELS_DIR, `ggml-${MODEL_NAME}.bin`);
  if (fs.existsSync(destPath)) {
    console.log(`Modelo ya presente: ${destPath}`);
    return;
  }
  const modelUrl = `https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-${MODEL_NAME}.bin`;
  console.log(`Descargando modelo "${MODEL_NAME}" desde Hugging Face...`);
  await download(modelUrl, destPath);
  console.log("Modelo descargado.");
}

function findExecutable(dir) {
  // El zip trae, en la raíz, un "whisper-cli.exe" que en realidad es solo un
  // stub de aviso de deprecación (~27KB) que imprime un mensaje y sale — el
  // binario real y funcional vive más adentro (carpeta Release/) y pesa
  // varios cientos de KB. Buscamos TODOS los candidatos y nos quedamos con
  // el más grande, no con el primero que aparezca.
  const targets = new Set(["whisper-cli.exe", "main.exe"]);
  const candidates = [];
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(fullPath);
      else if (targets.has(entry.name.toLowerCase())) candidates.push(fullPath);
    }
  }
  if (candidates.length === 0) return null;
  return candidates.map((p) => ({ p, size: fs.statSync(p).size })).sort((a, b) => b.size - a.size)[0].p;
}

async function downloadBinary() {
  if (fs.existsSync(BINARY_PATH)) {
    console.log(`Binario ya presente: ${BINARY_PATH}`);
    return;
  }

  console.log("Buscando el último release de whisper.cpp en GitHub...");
  const releaseRes = await fetch("https://api.github.com/repos/ggml-org/whisper.cpp/releases/latest");
  if (!releaseRes.ok) {
    throw new Error(`No se pudo consultar releases de whisper.cpp (${releaseRes.status})`);
  }
  const release = await releaseRes.json();

  // El release "estándar" CPU-only para Windows x64 se llama "whisper-bin-x64.zip"
  // (sin CUDA/BLAS, no requiere DLLs ni drivers extra). Match exacto primero,
  // y si el nombre cambia en un release futuro, un fallback más laxo que
  // evita las variantes cublas/blas/arm/ubuntu.
  const asset =
    release.assets.find((a) => /^whisper-bin-x64\.zip$/i.test(a.name)) ??
    release.assets.find(
      (a) => /x64/i.test(a.name) && /\.zip$/i.test(a.name) && !/blas|cublas|arm|ubuntu/i.test(a.name),
    );
  if (!asset) {
    throw new Error(
      "No se encontró un binario de Windows x64 en el último release de whisper.cpp. " +
        "Descargalo a mano desde https://github.com/ggml-org/whisper.cpp/releases y colocá el .exe " +
        `(renombrado a "whisper-cli.exe") en: ${RESOURCES_DIR}`,
    );
  }

  const zipPath = path.join(RESOURCES_DIR, "_download.zip");
  console.log(`Descargando ${asset.name}...`);
  await download(asset.browser_download_url, zipPath);

  console.log("Descomprimiendo...");
  new AdmZip(zipPath).extractAllTo(RESOURCES_DIR, true);
  fs.rmSync(zipPath, { force: true });

  const extractedExe = findExecutable(RESOURCES_DIR);
  if (!extractedExe) {
    throw new Error(
      `Se descomprimió el zip pero no se encontró whisper-cli.exe/main.exe dentro de ${RESOURCES_DIR}. ` +
        "Revisá la carpeta y copiá el ejecutable correcto ahí como whisper-cli.exe manualmente.",
    );
  }
  if (extractedExe !== BINARY_PATH) {
    fs.copyFileSync(extractedExe, BINARY_PATH);
  }
  console.log(`Binario listo en ${BINARY_PATH}`);
}

async function main() {
  fs.mkdirSync(RESOURCES_DIR, { recursive: true });
  try {
    await downloadBinary();
    await downloadModel();
    console.log("\nListo. Ya podés grabar reuniones.");
  } catch (err) {
    console.error(`\nError en el setup de Whisper: ${err.message}`);
    // process.exitCode (en vez de process.exit) deja que Node cierre los
    // handles de red pendientes solo, evitando un crash nativo de libuv al
    // salir de golpe con una request de fetch todavía en curso.
    process.exitCode = 1;
  }
}

main();
