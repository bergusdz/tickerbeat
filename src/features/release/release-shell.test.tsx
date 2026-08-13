import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { PublishableArtifact, PublicationReceipt } from "../publication/types";
import type { PublicationGateway, TokenLauncher } from "./core/ports";
import { ReleaseShell } from "./release-shell";

const creator = "0x1111111111111111111111111111111111111111" as const;
const token = "0x2222222222222222222222222222222222222222" as const;
const txHash = `0x${"3".repeat(64)}` as const;

vi.mock("wagmi", () => ({
  useConnection: () => ({ address: creator, chainId: 8453, status: "connected" }),
  useConnectors: () => [],
  useConnect: () => ({ mutate: vi.fn(), isPending: false, error: null }),
  useSwitchChain: () => ({ mutateAsync: vi.fn() }),
  usePublicClient: () => undefined,
  useWalletClient: () => ({ refetch: vi.fn() }),
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

const publication: PublicationReceipt = {
  creator,
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

describe("ReleaseShell", () => {
  it("orchestrates publish, review, submit and confirmation through explicit ports", async () => {
    const publicationGateway: PublicationGateway = { publish: vi.fn().mockResolvedValue(publication) };
    const launcher: TokenLauncher = {
      review: vi.fn().mockResolvedValue({
        creator,
        expectedAddress: token,
        metadataUri: publication.metadataUri,
        reviewedConfig: "config",
        valueWei: "0",
      }),
      submit: vi.fn().mockResolvedValue({ txHash }),
      confirm: vi.fn().mockResolvedValue({
        creator,
        expectedAddress: token,
        metadataUri: publication.metadataUri,
        reviewedConfig: "config",
        valueWei: "0",
        txHash,
        tokenAddress: token,
        blockNumber: "100",
      }),
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    render(
      <ReleaseShell
        artifact={artifact}
        publicationGateway={publicationGateway}
        createLauncher={() => launcher}
      />,
    );

    const publish = await screen.findByRole("button", { name: "PUBLISH TO IPFS" });
    await waitFor(() => expect(publish).toBeEnabled());
    fireEvent.click(publish);
    await screen.findByRole("link", { name: "VIEW METADATA →" });

    fireEvent.click(screen.getByRole("button", { name: "CHECK LAUNCH" }));
    await screen.findByText("PREDICTED TOKEN");
    fireEvent.click(screen.getByRole("button", { name: "LAUNCH TOKEN" }));

    await screen.findByText("TOKEN LIVE");
    expect(publicationGateway.publish).toHaveBeenCalledWith(artifact, creator);
    expect(launcher.review).toHaveBeenCalledOnce();
    expect(launcher.submit).toHaveBeenCalledOnce();
    expect(launcher.confirm).toHaveBeenCalledOnce();
  });
});
