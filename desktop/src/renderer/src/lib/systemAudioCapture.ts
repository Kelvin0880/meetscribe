export interface CapturedAudio {
  mixedStream: MediaStream;
  sourceStreams: MediaStream[];
}

/**
 * Combina el audio del sistema (lo que suena en los parlantes: la otra
 * persona en la videollamada) con el micrófono (tu voz) en un único stream
 * grabable con MediaRecorder. El video de getDisplayMedia se descarta
 * enseguida — Chromium lo exige para dar audio "loopback", pero acá solo
 * nos importa el audio.
 */
export async function captureMeetingAudioStream(): Promise<CapturedAudio> {
  let displayStream: MediaStream;
  try {
    displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
  } catch {
    throw new Error("No se pudo capturar el audio del sistema. Revisá los permisos de pantalla/audio de Windows.");
  }
  displayStream.getVideoTracks().forEach((track) => track.stop());

  let micStream: MediaStream;
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    displayStream.getTracks().forEach((track) => track.stop());
    throw new Error("No se pudo acceder al micrófono. Revisá los permisos de Windows.");
  }

  const audioContext = new AudioContext();
  const destination = audioContext.createMediaStreamDestination();

  const systemAudioTracks = displayStream.getAudioTracks();
  if (systemAudioTracks.length > 0) {
    audioContext.createMediaStreamSource(new MediaStream(systemAudioTracks)).connect(destination);
  }
  audioContext.createMediaStreamSource(micStream).connect(destination);

  return { mixedStream: destination.stream, sourceStreams: [displayStream, micStream] };
}
