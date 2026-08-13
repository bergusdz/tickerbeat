import { beforeEach, describe, expect, it } from "vitest";

import {
  MAX_PUBLICATION_REQUEST_BYTES,
  PublicationRateLimiter,
  clientIdentifier,
  validatePublicationRequestHeaders,
} from "./boundary";

describe("publication HTTP boundary", () => {
  let limiter: PublicationRateLimiter;

  beforeEach(() => {
    limiter = new PublicationRateLimiter({ limit: 3, windowMs: 60_000 });
  });

  it("rejects non-multipart requests and declared oversized bodies", () => {
    expect(
      validatePublicationRequestHeaders(
        new Headers({ "content-type": "application/json", "content-length": "20" }),
      ),
    ).toEqual({ code: "UNSUPPORTED_MEDIA_TYPE", status: 415 });

    expect(
      validatePublicationRequestHeaders(
        new Headers({
          "content-type": "multipart/form-data; boundary=beat",
          "content-length": String(MAX_PUBLICATION_REQUEST_BYTES + 1),
        }),
      ),
    ).toEqual({ code: "PAYLOAD_TOO_LARGE", status: 413 });
  });

  it("allows a bounded number of requests per client and reports retry time", () => {
    expect(limiter.consume("198.51.100.2", 1_000)).toEqual({ allowed: true });
    expect(limiter.consume("198.51.100.2", 2_000)).toEqual({ allowed: true });
    expect(limiter.consume("198.51.100.2", 3_000)).toEqual({ allowed: true });
    expect(limiter.consume("198.51.100.2", 4_000)).toEqual({
      allowed: false,
      retryAfterSeconds: 57,
    });
    expect(limiter.consume("198.51.100.2", 61_001)).toEqual({ allowed: true });
  });

  it("uses the first trusted proxy address and has a stable fallback", () => {
    expect(
      clientIdentifier(new Headers({ "x-forwarded-for": "198.51.100.2, 10.0.0.1" })),
    ).toBe("198.51.100.2");
    expect(clientIdentifier(new Headers())).toBe("unknown-client");
  });
});

