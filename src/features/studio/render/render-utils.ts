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
<rect width="1200" height="1200" fill="#070605" />
<rect x="64" y="64" width="1072" height="1072" rx="48" fill="#12100c" stroke="#3a342c" />
<text x="108" y="168" fill="#9a9386" font-family="monospace" font-size="28">TICKERBEAT</text>
<text x="104" y="300" fill="#f3eee4" font-family="Arial Black, sans-serif" font-size="92" font-weight="900">${title}</text>
<text x="108" y="430" fill="#d8ff3c" font-family="monospace" font-size="42">${project.tempo} BPM · 16 STEPS</text>
${bars}
<text x="108" y="1068" fill="#9a9386" font-family="monospace" font-size="26">ACTIVE STEPS ${density} · MAKE SOUND · MAKE MARKET</text>
</svg>`;

  return new Blob([svg], { type: "image/svg+xml" });
}
