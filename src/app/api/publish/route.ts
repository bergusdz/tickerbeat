import { NextResponse } from "next/server";
import { PinataSDK } from "pinata";
import { isAddress } from "viem";

import { publishArtifacts } from "@/features/publication/publish-artifacts";
import { validatePublicationFiles } from "@/features/publication/validation";
import { EnvironmentConfigurationError, readPublicationEnv } from "@/lib/env";
import {
  clientIdentifier,
  publicationRateLimiter,
  validatePublicationRequestHeaders,
} from "./boundary";

export const runtime = "nodejs";

function requiredText(form: FormData, key: string): string | null {
  const value = form.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function failure(code: string, error: string, status: number, headers?: HeadersInit) {
  return NextResponse.json({ code, error }, { status, headers });
}

export async function POST(request: Request) {
  const headerFailure = validatePublicationRequestHeaders(request.headers);
  if (headerFailure) {
    const message =
      headerFailure.code === "PAYLOAD_TOO_LARGE"
        ? "The release payload exceeds the upload limit."
        : "The release must use multipart form data.";
    return failure(headerFailure.code, message, headerFailure.status);
  }

  const quota = publicationRateLimiter.consume(clientIdentifier(request.headers));
  if (!quota.allowed) {
    return failure("RATE_LIMITED", "Too many publication attempts. Try again shortly.", 429, {
      "Retry-After": String(quota.retryAfterSeconds),
    });
  }

  let environment: ReturnType<typeof readPublicationEnv>;
  try {
    environment = readPublicationEnv();
  } catch (error) {
    if (error instanceof EnvironmentConfigurationError) {
      return failure(
        "PUBLICATION_NOT_CONFIGURED",
        "IPFS publishing is not configured on this deployment.",
        503,
      );
    }
    throw error;
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return failure("INVALID_MULTIPART", "The release form could not be read.", 400);
  }

  const title = requiredText(form, "title");
  const symbol = requiredText(form, "symbol")?.toUpperCase() ?? null;
  const tempoText = requiredText(form, "tempo");
  const creator = requiredText(form, "creator");
  const audio = form.get("audio");
  const cover = form.get("cover");
  const project = form.get("project");

  if (
    !title ||
    !symbol ||
    !tempoText ||
    !creator ||
    !(audio instanceof File) ||
    !(cover instanceof File) ||
    !(project instanceof File)
  ) {
    return failure("INCOMPLETE_RELEASE", "The release payload is incomplete.", 400);
  }
  if (title.length > 80) {
    return failure("INVALID_TITLE", "Title must contain 80 characters or fewer.", 400);
  }
  if (!isAddress(creator)) {
    return failure("INVALID_CREATOR", "Creator must be a valid wallet address.", 400);
  }
  if (!/^[A-Z0-9]{1,10}$/.test(symbol)) {
    return failure("INVALID_TICKER", "Ticker must contain 1-10 letters or numbers.", 400);
  }
  const tempo = Number(tempoText);
  if (!Number.isFinite(tempo) || tempo < 40 || tempo > 240) {
    return failure("INVALID_TEMPO", "Tempo is outside the supported range.", 400);
  }

  const errors = validatePublicationFiles({ audio, cover, project });
  if (errors.length > 0) {
    return failure("INVALID_ARTIFACTS", errors.join(" "), 400);
  }

  try {
    const pinata = new PinataSDK({
      pinataJwt: environment.pinataJwt,
      pinataGateway: environment.gatewayUrl,
    });
    const receipt = await publishArtifacts(pinata, environment.gatewayUrl, {
      title,
      symbol,
      tempo,
      creator,
      audio,
      cover,
      project,
      appUrl: environment.appUrl || new URL(request.url).origin,
    });
    return NextResponse.json(receipt);
  } catch (error) {
    console.error("TickerBeat publication failed", error instanceof Error ? error.message : error);
    return failure(
      "PUBLICATION_PROVIDER_UNAVAILABLE",
      "The release could not be published to IPFS.",
      502,
    );
  }
}
