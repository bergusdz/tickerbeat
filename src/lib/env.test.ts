import { describe, expect, it } from "vitest";

import { EnvironmentConfigurationError, readPublicationEnv } from "./env";

describe("publication environment", () => {
  it("accepts server-only credentials and normalized HTTPS URLs", () => {
    expect(
      readPublicationEnv({
        PINATA_JWT: "header.payload.signature",
        NEXT_PUBLIC_GATEWAY_URL: "https://beats.mypinata.cloud/",
        NEXT_PUBLIC_APP_URL: "https://tickerbeat.example/",
      }),
    ).toEqual({
      pinataJwt: "header.payload.signature",
      gatewayUrl: "https://beats.mypinata.cloud",
      appUrl: "https://tickerbeat.example",
    });
  });

  it("does not accept a public variable in place of the Pinata secret", () => {
    expect(() =>
      readPublicationEnv({
        NEXT_PUBLIC_PINATA_JWT: "exposed-secret",
        NEXT_PUBLIC_GATEWAY_URL: "https://beats.mypinata.cloud",
      }),
    ).toThrow(EnvironmentConfigurationError);
  });

  it("rejects malformed or insecure production URLs", () => {
    expect(() =>
      readPublicationEnv({
        PINATA_JWT: "header.payload.signature",
        NEXT_PUBLIC_GATEWAY_URL: "javascript:alert(1)",
      }),
    ).toThrow("NEXT_PUBLIC_GATEWAY_URL");

    expect(() =>
      readPublicationEnv({
        PINATA_JWT: "header.payload.signature",
        NEXT_PUBLIC_GATEWAY_URL: "https://beats.mypinata.cloud",
        NEXT_PUBLIC_APP_URL: "http://tickerbeat.example",
      }),
    ).toThrow("NEXT_PUBLIC_APP_URL");
  });
});

