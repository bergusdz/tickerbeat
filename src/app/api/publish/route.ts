import { NextResponse } from "next/server";
import { PinataSDK } from "pinata";

import { publishArtifacts } from "@/features/publication/publish-artifacts";
import { validatePublicationFiles } from "@/features/publication/validation";

export const runtime = "nodejs";

function requiredText(form: FormData, key: string): string | null {
  const value = form.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function POST(request: Request) {
  const jwt = process.env.PINATA_JWT;
  const gateway = process.env.NEXT_PUBLIC_GATEWAY_URL;
  if (!jwt || !gateway) {
    return NextResponse.json(
      { error: "IPFS publishing is not configured on this deployment." },
      { status: 503 },
    );
  }

  try {
    const form = await request.formData();
    const title = requiredText(form, "title");
    const symbol = requiredText(form, "symbol")?.toUpperCase() ?? null;
    const tempoText = requiredText(form, "tempo");
    const audio = form.get("audio");
    const cover = form.get("cover");
    const project = form.get("project");

    if (!title || !symbol || !tempoText || !(audio instanceof File) || !(cover instanceof File) || !(project instanceof File)) {
      return NextResponse.json({ error: "The release payload is incomplete." }, { status: 400 });
    }
    if (!/^[A-Z0-9]{1,10}$/.test(symbol)) {
      return NextResponse.json({ error: "Ticker must contain 1-10 letters or numbers." }, { status: 400 });
    }
    const tempo = Number(tempoText);
    if (!Number.isFinite(tempo) || tempo < 40 || tempo > 240) {
      return NextResponse.json({ error: "Tempo is outside the supported range." }, { status: 400 });
    }

    const errors = validatePublicationFiles({ audio, cover, project });
    if (errors.length > 0) return NextResponse.json({ error: errors.join(" ") }, { status: 400 });

    const pinata = new PinataSDK({ pinataJwt: jwt, pinataGateway: gateway });
    const receipt = await publishArtifacts(pinata, gateway, {
      title,
      symbol,
      tempo,
      audio,
      cover,
      project,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin,
    });
    return NextResponse.json(receipt);
  } catch (error) {
    console.error("TickerBeat publication failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "The release could not be published to IPFS." }, { status: 502 });
  }
}
