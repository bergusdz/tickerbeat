import { describe, expect, it } from "vitest";

import { createEditingSession, reduceReleaseSession } from "./release-session";

const publication = {
  creator: "0x1111111111111111111111111111111111111111" as const,
  audioCid: "audio",
  coverCid: "cover",
  projectCid: "project",
  metadataCid: "metadata",
  audioUri: "ipfs://audio",
  coverUri: "ipfs://cover",
  projectUri: "ipfs://project",
  metadataUri: "ipfs://metadata",
  audioUrl: "https://gateway/audio",
  coverUrl: "https://gateway/cover",
  metadataUrl: "https://gateway/metadata",
};

describe("release session", () => {
  it("moves through rendering and invalidates when the project changes", () => {
    const editing = createEditingSession();
    const rendering = reduceReleaseSession(editing, {
      type: "render-started",
      snapshotHash: "snapshot",
    });
    const rendered = reduceReleaseSession(rendering, {
      type: "render-succeeded",
      artifactHash: "artifact",
    });

    expect(rendering).toEqual({ status: "rendering", snapshotHash: "snapshot" });
    expect(rendered).toEqual({
      status: "rendered",
      snapshotHash: "snapshot",
      artifactHash: "artifact",
    });
    expect(reduceReleaseSession(rendered, { type: "project-changed" })).toEqual({
      status: "editing",
    });
  });

  it("enforces prerequisites before publication and launch", () => {
    const editing = createEditingSession();

    expect(() =>
      reduceReleaseSession(editing, { type: "publication-succeeded", receipt: publication }),
    ).toThrow("Cannot complete publication");
    expect(() =>
      reduceReleaseSession(editing, {
        type: "launch-submitted",
        txHash: `0x${"1".repeat(64)}`,
      }),
    ).toThrow("Cannot submit launch");
  });

  it("retains the last safe checkpoint when an operation fails", () => {
    const rendered = {
      status: "rendered" as const,
      snapshotHash: "snapshot",
      artifactHash: "artifact",
    };
    const publishing = reduceReleaseSession(rendered, { type: "publication-started" });

    expect(
      reduceReleaseSession(publishing, {
        type: "operation-failed",
        operation: "publish",
        message: "Gateway unavailable",
      }),
    ).toEqual({
      status: "failed",
      operation: "publish",
      message: "Gateway unavailable",
      lastSafe: rendered,
    });
  });
});
