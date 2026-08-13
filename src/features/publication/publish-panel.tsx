"use client";

import styles from "@/features/studio/studio.module.css";

import type { PublicationReceipt } from "./types";

type WalletChoice = { uid: string; name: string };

export function PublishPanel({
  receipt,
  connected,
  connectors,
  connecting,
  publishing,
  ready,
  error,
  connectError,
  onConnect,
  onPublish,
}: {
  receipt: PublicationReceipt | null;
  connected: boolean;
  connectors: readonly WalletChoice[];
  connecting: boolean;
  publishing: boolean;
  ready: boolean;
  error: string | null;
  connectError: string | null;
  onConnect: (uid: string) => void;
  onPublish: () => void;
}) {
  return (
    <div className={styles.releaseStage}>
      <span>01 / IPFS RELEASE</span>
      <strong>{receipt ? "FILES PINNED" : "PUBLISH THE MASTER"}</strong>
      <small>WAV, cover, project state, and metadata are content-addressed together.</small>
      {!receipt && !connected ? (
        <div className={styles.walletChoices}>
          {connectors.map((connector) => (
            <button
              type="button"
              key={connector.uid}
              disabled={connecting}
              onClick={() => onConnect(connector.uid)}
            >
              CONNECT {connector.name.toUpperCase()} TO PUBLISH
            </button>
          ))}
        </div>
      ) : receipt ? (
        <a href={receipt.metadataUrl} target="_blank" rel="noreferrer">VIEW METADATA →</a>
      ) : (
        <button type="button" disabled={publishing || !ready} onClick={onPublish}>
          {publishing ? "PINNING…" : "PUBLISH TO IPFS"}
        </button>
      )}
      {error ? <p className={styles.renderError}>{error}</p> : null}
      {connectError ? <p className={styles.renderError}>{connectError}</p> : null}
    </div>
  );
}
