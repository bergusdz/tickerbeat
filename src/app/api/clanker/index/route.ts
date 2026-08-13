import { NextResponse } from "next/server";

const CLANKER_INDEX_API = "https://www.clanker.world/api/tokens/index-by-address";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { address?: unknown } | null;
  if (typeof body?.address !== "string" || !/^0x[0-9a-fA-F]{40}$/.test(body.address)) {
    return NextResponse.json({ error: "A valid token address is required." }, { status: 400 });
  }

  try {
    const response = await fetch(CLANKER_INDEX_API, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ address: body.address, chainId: 8453 }),
    });
    const result = await response.json().catch(() => ({}));
    return NextResponse.json(result, { status: response.status });
  } catch {
    // A deployment is already final onchain; indexing can safely be retried later.
    return NextResponse.json({ error: "Clanker indexing is temporarily unavailable." }, { status: 502 });
  }
}
