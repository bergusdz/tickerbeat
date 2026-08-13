import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PublishableArtifact } from "./types";
import { PublishPanel } from "./publish-panel";

const wallet = vi.hoisted(() => ({
  address: undefined as `0x${string}` | undefined,
  connect: vi.fn(),
}));

vi.mock("wagmi", () => ({
  useConnection: () => ({
    address: wallet.address,
    status: wallet.address ? "connected" : "disconnected",
  }),
  useConnectors: () => [{ uid: "injected", name: "Browser wallet" }],
  useConnect: () => ({ mutate: wallet.connect, isPending: false, error: null }),
}));

vi.mock("@/features/launch/launch-panel", () => ({
  LaunchPanel: () => <div data-testid="launch-panel" />,
}));

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

describe("PublishPanel", () => {
  beforeEach(() => {
    wallet.address = undefined;
    wallet.connect.mockReset();
    vi.unstubAllGlobals();
  });

  it("requires a wallet before immutable publication", () => {
    render(<PublishPanel artifact={artifact} />);

    expect(screen.getByRole("button", { name: "CONNECT BROWSER WALLET TO PUBLISH" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "PUBLISH TO IPFS" })).not.toBeInTheDocument();
  });

  it("binds the connected creator to the publication request", async () => {
    wallet.address = "0x1111111111111111111111111111111111111111";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);
    render(<PublishPanel artifact={artifact} />);

    fireEvent.click(screen.getByRole("button", { name: "PUBLISH TO IPFS" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    const request = fetchMock.mock.calls[0][1] as { body: FormData };
    expect(request.body.get("creator")).toBe(wallet.address);
  });
});
