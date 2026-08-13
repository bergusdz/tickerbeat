"use client";

import { useState } from "react";

import { LaunchPanel } from "@/features/launch/launch-panel";
import styles from "@/features/studio/studio.module.css";

import type { PublicationReceipt, PublishableArtifact } from "./types";

async function responseError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? `Publishing failed with HTTP ${response.status}.`;
}

export function PublishPanel({ artifact }: { artifact: PublishableArtifact }) {
  const [status, setStatus] = useState<"idle" | "publishing" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<PublicationReceipt | null>(null);

  const publish = async () => {
    setStatus("publishing");
    setError(null);

    try {
      const filename = artifact.symbol.toLowerCase();
      const form = new FormData();
      form.set("title", artifact.title);
      form.set("symbol", artifact.symbol);
      form.set("tempo", String(artifact.tempo));
      form.set("audio", new File([artifact.audio], `${filename}.wav`, { type: "audio/wav" }));
      form.set("cover", new File([artifact.cover], `${filename}-cover.svg`, { type: "image/svg+xml" }));
      form.set(
        "project",
        new File([artifact.project], `${filename}.tickerbeat.json`, { type: "application/json" }),
      );

      const response = await fetch("/api/publish", { method: "POST", body: form });
      if (!response.ok) throw new Error(await responseError(response));
      setReceipt((await response.json()) as PublicationReceipt);
      setStatus("ready");
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : "The release could not be published.");
      setStatus("error");
    }
  };

  return (
    <div className={styles.releaseRail}>
      <div className={styles.releaseStage}>
        <span>01 / IPFS RELEASE</span>
        <strong>{receipt ? "FILES PINNED" : "PUBLISH THE MASTER"}</strong>
        <small>WAV, cover, project state, and metadata are content-addressed together.</small>
        {receipt ? (
          <a href={receipt.metadataUrl} target="_blank" rel="noreferrer">VIEW METADATA ↗</a>
        ) : (
          <button type="button" disabled={status === "publishing"} onClick={() => void publish()}>
            {status === "publishing" ? "PINNING…" : "PUBLISH TO IPFS"}
          </button>
        )}
        {error ? <p className={styles.renderError}>{error}</p> : null}
      </div>

      <LaunchPanel artifact={artifact} receipt={receipt} />
    </div>
  );
}
