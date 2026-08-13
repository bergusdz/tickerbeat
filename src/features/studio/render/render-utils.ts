import type { StudioProject } from "../core/model";

type AudioBufferLike = {
  numberOfChannels: number;
  length: number;
  sampleRate: number;
  getChannelData(channel: number): Float32Array;
};

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function projectDurationSeconds(project: StudioProject): number {
  return (60 / project.tempo) * 4;
}

export function audioBufferToWav(buffer: AudioBufferLike): Blob {
  const bytesPerSample = 2;
  const dataLength = buffer.length * buffer.numberOfChannels * bytesPerSample;
  const bytes = new ArrayBuffer(44 + dataLength);
  const view = new DataView(bytes);

  const writeText = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };

  writeText(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, buffer.numberOfChannels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * buffer.numberOfChannels * bytesPerSample, true);
  view.setUint16(32, buffer.numberOfChannels * bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, dataLength, true);

  const channels = Array.from({ length: buffer.numberOfChannels }, (_, channel) =>
    buffer.getChannelData(channel),
  );
  let offset = 44;
  for (let frame = 0; frame < buffer.length; frame += 1) {
    for (const channel of channels) {
      const sample = Math.max(-1, Math.min(1, channel[frame] ?? 0));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += bytesPerSample;
    }
  }

  return new Blob([bytes], { type: "audio/wav" });
}

export function createCoverSvg(project: StudioProject): Blob {
  const activeSteps = project.tracks.flatMap((track) => track.steps).filter((step) => step.active).length;
  const density = String(activeSteps).padStart(2, "0");
  const title = escapeXml(project.title.toUpperCase());
  const bars = project.tracks
    .map((track, trackIndex) => {
      const width = 180 + track.steps.filter((step) => step.active).length * 62;
      const y = 650 + trackIndex * 82;
      return `<rect x="92" y="${y}" width="${width}" height="42" rx="4" fill="${track.color}" />`;
    })
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
<rect width="1200" height="1200" fill="#0a0b08" />
<path d="M0 0H1200V1200H0Z" fill="url(#grid)" opacity=".2" />
<defs><pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="#d9ff43" stroke-width="1" /></pattern></defs>
<text x="90" y="110" fill="#d9ff43" font-family="monospace" font-size="24" letter-spacing="6">TICKERBEAT // BASE AUDIO</text>
<text x="88" y="260" fill="#f0eee5" font-family="Arial Black, sans-serif" font-size="112" font-weight="900">${title}</text>
<text x="92" y="430" fill="none" stroke="#d9ff43" stroke-width="3" font-family="Arial Black, sans-serif" font-size="150" font-weight="900">${project.tempo} BPM</text>
${bars}
<text x="92" y="1080" fill="#8e9287" font-family="monospace" font-size="28">ACTIVE STEPS ${density} / ONE LOOP / ONE MARKET</text>
</svg>`;

  return new Blob([svg], { type: "image/svg+xml" });
}
