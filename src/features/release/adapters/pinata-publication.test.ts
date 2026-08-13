import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PublishableArtifact } from "../../publication/types";
import { PinataPublicationGateway } from "./pinata-publication";

const artifact: PublishableArtifact = {
  title: "Signal",
  symbol: "SIG",
  tempo: 120,
  audio: new Blob(["wav"], { type: "audio/wav" }),
  cover: new Blob(["svg"], { type: "image/svg+xml" }),
  project: new Blob(["{}"], { type: "application/json" }),
  audioUrl: "blob:audio",
  coverUrl: "blob:cover",
  projectUrl: "blob:project",
};

describe("PinataPublicationGateway", () => {
  beforeEach(() => vi.unstubAllGlobals());

  it("binds the connected creator and all canonical artifacts to the request", async () => {
    const creator = "0x1111111111111111111111111111111111111111" as const;
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ creator }) });
    vi.stubGlobal("fetch", fetchMock);

    await new PinataPublicationGateway().publish(artifact, creator);

    const request = fetchMock.mock.calls[0][1] as { body: FormData };
    expect(request.body.get("creator")).toBe(creator);
    expect(request.body.get("audio")).toBeInstanceOf(File);
    expect(request.body.get("cover")).toBeInstanceOf(File);
    expect(request.body.get("project")).toBeInstanceOf(File);
  });
});
