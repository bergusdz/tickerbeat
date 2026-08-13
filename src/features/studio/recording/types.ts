import type { ClipReference } from "../core/model";
import type { ClipPlaybackSettings } from "./clip-playback";

export type SoundClip = ClipReference & {
  blob: Blob;
  url: string;
};

export type SoundClipController = {
  clip: SoundClip | null;
  error: string | null;
  importFile: (file: File) => Promise<void>;
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  clearClip: () => void;
  setClipSettings: (patch: Partial<ClipPlaybackSettings>) => void;
};
