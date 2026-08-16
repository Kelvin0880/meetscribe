/**
 * Convierte un AudioBuffer decodificado a WAV PCM 16-bit mono al sample rate
 * pedido. whisper.cpp espera 16kHz mono — hacerlo acá evita depender de
 * ffmpeg para la conversión.
 */
export async function audioBufferToWav(buffer: AudioBuffer, targetSampleRate: number): Promise<ArrayBuffer> {
  const monoSamples = await resampleToMono(buffer, targetSampleRate);
  return encodePcm16Wav(monoSamples, targetSampleRate);
}

async function resampleToMono(buffer: AudioBuffer, targetSampleRate: number): Promise<Float32Array> {
  const offlineContext = new OfflineAudioContext(
    1,
    Math.ceil(buffer.duration * targetSampleRate),
    targetSampleRate,
  );
  const source = offlineContext.createBufferSource();
  source.buffer = buffer;
  source.connect(offlineContext.destination);
  source.start();
  const rendered = await offlineContext.startRendering();
  return rendered.getChannelData(0);
}

function encodePcm16Wav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const bytesPerSample = 2;
  const byteRate = sampleRate * bytesPerSample;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAsciiString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAsciiString(view, 8, "WAVE");
  writeAsciiString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeAsciiString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  return buffer;
}

function writeAsciiString(view: DataView, offset: number, text: string): void {
  for (let i = 0; i < text.length; i++) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}
