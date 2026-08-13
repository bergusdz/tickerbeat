import { PUBLICATION_LIMITS } from "@/features/publication/validation";

export const MAX_PUBLICATION_REQUEST_BYTES =
  PUBLICATION_LIMITS.audio + PUBLICATION_LIMITS.cover + PUBLICATION_LIMITS.project + 1024 * 1024;

type HeaderFailure = {
  code: "UNSUPPORTED_MEDIA_TYPE" | "PAYLOAD_TOO_LARGE";
  status: 413 | 415;
};

export function validatePublicationRequestHeaders(headers: Headers): HeaderFailure | null {
  const contentType = headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("multipart/form-data;")) {
    return { code: "UNSUPPORTED_MEDIA_TYPE", status: 415 };
  }

  const rawLength = headers.get("content-length");
  if (rawLength) {
    const contentLength = Number(rawLength);
    if (!Number.isFinite(contentLength) || contentLength > MAX_PUBLICATION_REQUEST_BYTES) {
      return { code: "PAYLOAD_TOO_LARGE", status: 413 };
    }
  }

  return null;
}

export function clientIdentifier(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    "unknown-client"
  );
}

type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

export class PublicationRateLimiter {
  private readonly requests = new Map<string, number[]>();

  constructor(private readonly options: { limit: number; windowMs: number }) {}

  consume(identifier: string, now = Date.now()): RateLimitResult {
    const threshold = now - this.options.windowMs;
    const recent = (this.requests.get(identifier) ?? []).filter((time) => time > threshold);

    if (recent.length >= this.options.limit) {
      const retryAfterSeconds = Math.max(1, Math.ceil((recent[0] + this.options.windowMs - now) / 1000));
      this.requests.set(identifier, recent);
      return { allowed: false, retryAfterSeconds };
    }

    recent.push(now);
    this.requests.set(identifier, recent);
    return { allowed: true };
  }
}

export const publicationRateLimiter = new PublicationRateLimiter({
  limit: 4,
  windowMs: 60_000,
});

