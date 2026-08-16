import path from "node:path";
import { app, BrowserWindow, shell } from "electron";
import { registerIpcHandlers } from "./ipc";
import { registerSystemAudioCapture } from "./services/systemAudio";
import { logger } from "./utils/logger";

function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 800,
    minHeight: 560,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Cualquier link externo se abre en el navegador, no dentro de la app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  return win;
}

app.whenReady().then(() => {
  registerSystemAudioCapture();
  registerIpcHandlers();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// La app nunca debe crashear en silencio: cualquier promesa/exception no
// atrapada se loguea con contexto antes de que el proceso muera.
process.on("unhandledRejection", (reason) => {
  logger.error("main_unhandled_rejection", { message: (reason as Error)?.message ?? String(reason) });
});

process.on("uncaughtException", (err) => {
  logger.error("main_uncaught_exception", { message: err.message });
});
