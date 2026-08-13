import { describe, expect, it } from "vitest";

import { createPublicationMetadata, gatewayUrl, ipfsUri } from "./metadata";

describe("publication metadata", () => {
  it("binds the playable audio, cover, and editable project to one release", () => {
    expect(
      createPublicationMetadata({
        title: "Acid Broadcast 001",
        symbol: "ACID",
        description: "A one-bar TickerBeat loop.",
        tempo: 118,
        audioCid: "bafy-audio",
        coverCid: "bafy-cover",
        projectCid: "bafy-project",
      }),
    ).toEqual({
      name: "Acid Broadcast 001",
      description: "A one-bar TickerBeat loop.",
      image: "ipfs://bafy-cover",
      animation_url: "ipfs://bafy-audio",
      external_url: "https://tickerbeat.xyz",
      properties: {
        app: "TickerBeat",
        chain: "Base",
        symbol: "ACID",
        tempo: 118,
        project_uri: "ipfs://bafy-project",
      },
    });
  });

  it("normalizes IPFS and gateway URLs", () => {
    expect(ipfsUri("bafy-test")).toBe("ipfs://bafy-test");
    expect(gatewayUrl("https://example.mypinata.cloud/", "bafy-test")).toBe(
      "https://example.mypinata.cloud/ipfs/bafy-test",
    );
  });
});
