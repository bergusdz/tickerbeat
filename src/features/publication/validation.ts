export const PUBLICATION_LIMITS = {
  audio: 15 * 1024 * 1024,
  cover: 1024 * 1024,
  project: 1024 * 1024,
} as const;

export type PublicationFiles = {
  audio: File;
  cover: File;
  project: File;
};

export function validatePublicationFiles(files: PublicationFiles): string[] {
  const errors: string[] = [];

  if (files.audio.type !== "audio/wav") errors.push("Audio must be a WAV file.");
  if (files.audio.size > PUBLICATION_LIMITS.audio) errors.push("Audio must be 15 MB or smaller.");
  if (files.cover.type !== "image/svg+xml") errors.push("Cover must be an SVG file.");
  if (files.cover.size > PUBLICATION_LIMITS.cover) errors.push("Cover must be 1 MB or smaller.");
  if (files.project.type !== "application/json") errors.push("Project must be JSON.");
  if (files.project.size > PUBLICATION_LIMITS.project) errors.push("Project must be 1 MB or smaller.");

  return errors;
}
