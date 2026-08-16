import { randomUUID } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ipcMain } from "electron";
import { IPC_CHANNELS } from "../shared/ipcChannels";
import type { ListTranscriptsParams, StopAndTranscribePayload } from "../shared/types";
import * as backendClient from "./services/backendClient";
import { transcribeWavFile } from "./services/whisperService";
import { logger } from "./utils/logger";

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.RECORDING_STOP_AND_TRANSCRIBE, async (_event, payload: StopAndTranscribePayload) => {
    const tempWavPath = path.join(os.tmpdir(), `meetscribe-${randomUUID()}.wav`);
    try {
      fs.writeFileSync(tempWavPath, Buffer.from(payload.wavBuffer));
      const transcriptText = await transcribeWavFile(tempWavPath);
      return await backendClient.createTranscript({
        title: payload.title,
        transcriptText,
        audioDurationSeconds: payload.audioDurationSeconds,
      });
    } catch (err) {
      logger.error("recording_pipeline_failed", { message: (err as Error).message });
      throw err;
    } finally {
      fs.rmSync(tempWavPath, { force: true });
    }
  });

  ipcMain.handle(IPC_CHANNELS.TRANSCRIPTS_LIST, (_event, params: ListTranscriptsParams | undefined) =>
    backendClient.listTranscripts(params ?? {}),
  );

  ipcMain.handle(IPC_CHANNELS.TRANSCRIPTS_GET, (_event, id: string) => backendClient.getTranscript(id));

  ipcMain.handle(IPC_CHANNELS.TRANSCRIPTS_DELETE, (_event, id: string) => backendClient.deleteTranscript(id));
}
