import { useCallback, useRef, useState } from "react";
import { audioBufferToWav } from "../lib/wavEncoder";
import { captureMeetingAudioStream } from "../lib/systemAudioCapture";
import type { TranscriptDto } from "../../../shared/types";

export type RecorderStatus = "idle" | "recording" | "processing" | "error";

const WHISPER_SAMPLE_RATE = 16000;

export function useRecorder() {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamsRef = useRef<MediaStream[]>([]);
  const startTimeRef = useRef(0);

  const stopAllTracks = () => {
    streamsRef.current.forEach((stream) => stream.getTracks().forEach((track) => track.stop()));
    streamsRef.current = [];
  };

  const start = useCallback(async () => {
    setErrorMessage(null);
    try {
      const { mixedStream, sourceStreams } = await captureMeetingAudioStream();
      streamsRef.current = sourceStreams;
      chunksRef.current = [];

      const recorder = new MediaRecorder(mixedStream);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.start(1000);

      mediaRecorderRef.current = recorder;
      startTimeRef.current = Date.now();
      setStatus("recording");
    } catch (err) {
      setErrorMessage((err as Error).message || "No se pudo empezar a grabar");
      setStatus("error");
    }
  }, []);

  const stopAndSave = useCallback(async (title: string): Promise<TranscriptDto | null> => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return null;

    setStatus("processing");
    const audioDurationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

    const blob = await new Promise<Blob>((resolve) => {
      recorder.addEventListener("stop", () => resolve(new Blob(chunksRef.current, { type: recorder.mimeType })), {
        once: true,
      });
      recorder.stop();
    });
    stopAllTracks();
    mediaRecorderRef.current = null;

    let audioContext: AudioContext | null = null;
    try {
      const arrayBuffer = await blob.arrayBuffer();
      audioContext = new AudioContext();
      const decoded = await audioContext.decodeAudioData(arrayBuffer);
      const wavBuffer = await audioBufferToWav(decoded, WHISPER_SAMPLE_RATE);

      const result = await window.meetscribe.recording.stopAndTranscribe({
        title,
        wavBuffer,
        audioDurationSeconds,
      });

      setStatus("idle");
      return result;
    } catch (err) {
      setErrorMessage((err as Error).message || "No se pudo transcribir la grabación");
      setStatus("error");
      return null;
    } finally {
      await audioContext?.close().catch(() => undefined);
    }
  }, []);

  const cancel = useCallback(() => {
    mediaRecorderRef.current?.stop();
    stopAllTracks();
    mediaRecorderRef.current = null;
    setStatus("idle");
  }, []);

  return { status, errorMessage, start, stopAndSave, cancel };
}
