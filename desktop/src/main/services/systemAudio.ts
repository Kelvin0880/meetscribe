import { desktopCapturer, session } from "electron";
import { logger } from "../utils/logger";

/**
 * Permite que el renderer pida `getDisplayMedia({ audio: true })` y reciba
 * automáticamente el audio "loopback" del sistema (lo que suena en los
 * parlantes) sin mostrar el selector nativo de pantalla — solo nos importa
 * el audio, nunca grabamos video.
 */
export function registerSystemAudioCapture(): void {
  session.defaultSession.setDisplayMediaRequestHandler((_request, callback) => {
    desktopCapturer
      .getSources({ types: ["screen"] })
      .then((sources) => {
        if (sources.length === 0) {
          logger.error("system_audio_no_sources_found");
          callback({});
          return;
        }
        callback({ video: sources[0], audio: "loopback" });
      })
      .catch((err) => {
        logger.error("system_audio_capture_setup_failed", { message: (err as Error).message });
        callback({});
      });
  });
}
