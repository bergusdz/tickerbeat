import type { PublicationGateway } from "../core/ports";
import type { PublishableArtifact, PublicationReceipt } from "../../publication/types";

async function responseError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? `Publishing failed with HTTP ${response.status}.`;
}

export class PinataPublicationGateway implements PublicationGateway {
  async publish(
    artifact: PublishableArtifact,
    creator: `0x${string}`,
  ): Promise<PublicationReceipt> {
    const filename = artifact.symbol.toLowerCase();
    const form = new FormData();
    form.set("title", artifact.title);
    form.set("symbol", artifact.symbol);
    form.set("tempo", String(artifact.tempo));
    form.set("creator", creator);
    form.set("audio", new File([artifact.audio], `${filename}.wav`, { type: "audio/wav" }));
    form.set("cover", new File([artifact.cover], `${filename}-cover.svg`, { type: "image/svg+xml" }));
    form.set(
      "project",
      new File([artifact.project], `${filename}.tickerbeat.json`, { type: "application/json" }),
    );

    const response = await fetch("/api/publish", { method: "POST", body: form });
    if (!response.ok) throw new Error(await responseError(response));
    return (await response.json()) as PublicationReceipt;
  }
}
