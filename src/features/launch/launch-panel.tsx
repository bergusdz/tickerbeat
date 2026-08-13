"use client";

import { formatEther } from "viem";

import styles from "@/features/studio/studio.module.css";
import type { PublicationReceipt } from "@/features/publication/types";
import type { LaunchReviewReceipt, ReleaseSession } from "@/features/release/core/release-session";

type WalletChoice = { uid: string; name: string };

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function LaunchPanel({
  receipt,
  session,
  review,
  address,
  chainId,
  connectors,
  connecting,
  connectError,
  onConnect,
  onReview,
  onLaunch,
}: {
  receipt: PublicationReceipt | null;
  session: ReleaseSession;
  review: LaunchReviewReceipt | null;
  address?: `0x${string}`;
  chainId?: number;
  connectors: readonly WalletChoice[];
  connecting: boolean;
  connectError: string | null;
  onConnect: (uid: string) => void;
  onReview: () => void;
  onLaunch: () => void;
}) {
  const confirmed = session.status === "confirmed" ? session.launch : null;
  const wrongCreator = Boolean(
    address && receipt && address.toLowerCase() !== receipt.creator.toLowerCase(),
  );
  const busy = session.status === "reviewing" || session.status === "submitting";

  return (
    <div className={styles.releaseStage}>
      <span>02 / BASE TOKEN</span>
      <strong>{confirmed ? "TOKEN LIVE" : "CLANKER V4"}</strong>
      <small>Standard Base/WETH launch. Zero automatic dev buy. The wallet always confirms deployment.</small>
      <small>1% swap fee per side. Clanker anti-sniper fee decays during the first 15 seconds.</small>

      {!receipt ? <p>Publish the master first.</p> : null}
      {receipt && !address ? (
        <div className={styles.walletChoices}>
          {connectors.map((connector) => (
            <button type="button" key={connector.uid} disabled={connecting} onClick={() => onConnect(connector.uid)}>
              CONNECT {connector.name.toUpperCase()}
            </button>
          ))}
        </div>
      ) : null}

      {receipt && address ? (
        <div className={styles.launchActions}>
          <p>{shortAddress(address)} / {chainId === 8453 ? "BASE" : "WRONG NETWORK"}</p>
          {wrongCreator ? (
            <p className={styles.renderError}>Reconnect {shortAddress(receipt.creator)} — this wallet owns the immutable release.</p>
          ) : null}
          {confirmed ? (
            <div className={styles.launchLinks}>
              <a href={`https://basescan.org/token/${confirmed.tokenAddress}`} target="_blank" rel="noreferrer">BASESCAN →</a>
              <a href={`https://base.app/coin/base-mainnet/${confirmed.tokenAddress}`} target="_blank" rel="noreferrer">OPEN IN BASE APP →</a>
            </div>
          ) : (
            <>
              {review ? (
                <dl className={styles.launchReview}>
                  <div><dt>PROTOCOL</dt><dd>Clanker v4</dd></div>
                  <div><dt>NETWORK</dt><dd>Base / 8453</dd></div>
                  <div><dt>CREATOR</dt><dd title={review.creator}>{shortAddress(review.creator)}</dd></div>
                  <div><dt>METADATA</dt><dd title={review.metadataUri}>IPFS / IMMUTABLE</dd></div>
                  <div><dt>PREDICTED TOKEN</dt><dd title={review.expectedAddress}>{shortAddress(review.expectedAddress)}</dd></div>
                  <div><dt>TX VALUE</dt><dd>{formatEther(BigInt(review.valueWei))} ETH</dd></div>
                </dl>
              ) : null}
              <button type="button" disabled={busy || wrongCreator} onClick={onReview}>
                {session.status === "reviewing" ? "SIMULATING…" : "CHECK LAUNCH"}
              </button>
              <button type="button" className={styles.launchConfirm} disabled={session.status !== "reviewed"} onClick={onLaunch}>
                {session.status === "submitting" ? "CONFIRM IN WALLET…" : "LAUNCH TOKEN"}
              </button>
            </>
          )}
        </div>
      ) : null}

      {session.status === "submitted" ? <p>Transaction submitted: {shortAddress(session.txHash)}</p> : null}
      {session.status === "failed" ? <p className={styles.renderError}>{session.message}</p> : null}
      {connectError ? <p className={styles.renderError}>{connectError}</p> : null}
    </div>
  );
}
