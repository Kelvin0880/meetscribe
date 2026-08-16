import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../shared/ipcChannels";
import type {
  ListTranscriptsParams,
  ListTranscriptsResult,
  StopAndTranscribePayload,
  TranscriptDto,
} from "../shared/types";

// Única superficie de la app expuesta al renderer (contextIsolation: true,
// nodeIntegration: false). El renderer nunca toca Node/Electron directo.
const api = {
  recording: {
    stopAndTranscribe: (payload: StopAndTranscribePayload): Promise<TranscriptDto> =>
      ipcRenderer.invoke(IPC_CHANNELS.RECORDING_STOP_AND_TRANSCRIBE, payload),
  },
  transcripts: {
    list: (params: ListTranscriptsParams): Promise<ListTranscriptsResult> =>
      ipcRenderer.invoke(IPC_CHANNELS.TRANSCRIPTS_LIST, params),
    get: (id: string): Promise<TranscriptDto> => ipcRenderer.invoke(IPC_CHANNELS.TRANSCRIPTS_GET, id),
    remove: (id: string): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.TRANSCRIPTS_DELETE, id),
  },
};

contextBridge.exposeInMainWorld("meetscribe", api);

export type MeetscribeApi = typeof api;
