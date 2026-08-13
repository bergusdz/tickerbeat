export type ClipPlaybackSettings = {
  trimStart: number;
  trimEnd: number;
  level: number;
};

export type ClipPlaybackWindow = {
  offset: number;
  duration: number;
  gain: number;
};

export const DEFAULT_CLIP_SETTINGS: ClipPlaybackSettings = {
  trimStart: 0,
  trimEnd: 1,
  level: 0.7,
};

const MIN_TRIM_WINDOW = 0.01;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function normalizeClipSettings(
  settings: ClipPlaybackSettings,
): ClipPlaybackSettings {
  let trimStart = clamp01(settings.trimStart);
  let trimEnd = clamp01(settings.trimEnd);

  if (trimEnd - trimStart < MIN_TRIM_WINDOW) {
    trimEnd = Math.min(1, trimStart + MIN_TRIM_WINDOW);
    trimStart = Math.max(0, trimEnd - MIN_TRIM_WINDOW);
  }

  return {
    trimStart,
    trimEnd,
    level: clamp01(settings.level),
  };
}

export function updateClipSettings(
  current: ClipPlaybackSettings,
  patch: Partial<ClipPlaybackSettings>,
): ClipPlaybackSettings {
  const next = {
    trimStart: clamp01(patch.trimStart ?? current.trimStart),
    trimEnd: clamp01(patch.trimEnd ?? current.trimEnd),
    level: clamp01(patch.level ?? current.level),
  };

  if (patch.trimStart !== undefined && next.trimStart > next.trimEnd - MIN_TRIM_WINDOW) {
    next.trimStart = Math.max(0, next.trimEnd - MIN_TRIM_WINDOW);
  } else if (patch.trimEnd !== undefined && next.trimEnd < next.trimStart + MIN_TRIM_WINDOW) {
    next.trimEnd = Math.min(1, next.trimStart + MIN_TRIM_WINDOW);
  }

  return normalizeClipSettings(next);
}

export function clipPlaybackWindow(
  sourceDuration: number,
  settings: ClipPlaybackSettings,
  maxDuration: number,
): ClipPlaybackWindow | null {
  if (!Number.isFinite(sourceDuration) || sourceDuration <= 0) return null;
  if (!Number.isFinite(maxDuration) || maxDuration <= 0) return null;

  const normalized = normalizeClipSettings(settings);
  const offset = sourceDuration * normalized.trimStart;
  const selectedDuration = sourceDuration * (normalized.trimEnd - normalized.trimStart);
  const duration = Math.min(selectedDuration, maxDuration);
  if (duration <= 0) return null;

  return { offset, duration, gain: normalized.level };
}
