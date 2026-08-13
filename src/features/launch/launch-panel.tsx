"use client";

import { Clanker } from "clanker-sdk/v4";
import { useState } from "react";
import type { Account, Chain, PublicClient, Transport, WalletClient } from "viem";
import {
  useConnect,
  useConnection,
  useConnectors,
  usePublicClient,
  useSwitchChain,
  useWalletClient,
} from "wagmi";
import { base } from "wagmi/chains";

import styles from "@/features/studio/studio.module.css";
import type { PublicationReceipt, PublishableArtifact } from "@/features/publication/types";

import { getBaseWalletAfterSwitch } from "./base-wallet";
import { createClankerTokenConfig } from "./clanker-config";
import { assertClankerLaunchReceipt } from "./launch-receipt";
import {
  assertPublicationCreator,
  assertReviewedLaunch,
  createLaunchReview,
} from "./launch-review";

type LaunchState =
  | { status: "idle" | "simulating" }
  | {
      status: "ready" | "launching";
      expectedAddress: `0x${string}`;
      reviewedConfig: string;
      valueWei: bigint;
    }
  | { status: "error"; message: string }
  | { status: "submitted"; txHash: `0x${string}` }
  | { status: "confirmed"; txHash: `0x${string}`; tokenAddress: `0x${string}` };

function deploymentSuffix(): `0x${string}` | undefined {
  const value = process.env.NEXT_PUBLIC_BASE_BUILDER_CODE_SUFFIX;
  return value && /^0x(?:[0-9a-fA-F]{2})+$/.test(value) ? (value as `0x${string}`) : undefined;
}

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function LaunchPanel({
  artifact,
  receipt,
}: {
  artifact: PublishableArtifact;
  receipt: PublicationReceipt | null;
}) {
  const connection = useConnection();
  const connectors = useConnectors();
  const connect = useConnect();
  const switchChain = useSwitchChain();
  const publicClient = usePublicClient({ chainId: base.id });
  const walletClient = useWalletClient({ chainId: base.id });
  const [launch, setLaunch] = useState<LaunchState>({ status: "idle" });

  const tokenConfig = receipt
    ? createClankerTokenConfig({
        creator: receipt.creator,
        title: artifact.title,
        symbol: artifact.symbol,
        coverUri: receipt.coverUri,
        audioUri: receipt.audioUri,
        metadataUri: receipt.metadataUri,
      })
    : null;
  const currentConfig = tokenConfig ? JSON.stringify(tokenConfig) : "";

  const clanker = (wallet: WalletClient<Transport, Chain, Account>) => {
    if (!publicClient) throw new Error("Base public client is not ready.");
    return new Clanker({
      wallet,
      publicClient: publicClient as PublicClient,
    });
  };

  const freshBaseWallet = () =>
    getBaseWalletAfterSwitch({
      chainId: connection.chainId,
      switchToBase: () => switchChain.mutateAsync({ chainId: base.id }),
      getBaseWallet: async () => {
        const result = await walletClient.refetch();
        return result.data as WalletClient<Transport, Chain, Account> | undefined;
      },
    });

  const simulate = async () => {
    if (!tokenConfig || !receipt || !connection.address) return;
    setLaunch({ status: "simulating" });
    try {
      assertPublicationCreator(receipt.creator, connection.address);
      const client = clanker(await freshBaseWallet());
      const transaction = await client.getDeployTransaction(tokenConfig);
      if (!transaction.expectedAddress) throw new Error("Clanker did not return a predicted token address.");
      const result = await client.deploySimulate(tokenConfig);
      if ("error" in result && result.error) throw result.error;
      setLaunch({
        status: "ready",
        expectedAddress: transaction.expectedAddress,
        reviewedConfig: currentConfig,
        valueWei: transaction.value ?? BigInt(0),
      });
    } catch (error) {
      setLaunch({ status: "error", message: error instanceof Error ? error.message : "Simulation failed." });
    }
  };

  const deploy = async () => {
    if (!tokenConfig || !receipt || launch.status !== "ready") return;
    try {
      if (!connection.address) throw new Error("Reconnect the launch wallet.");
      if (!publicClient) throw new Error("Base public client is not ready.");
      const expectedCreator = assertPublicationCreator(receipt.creator, connection.address);
      const expectedAddress = assertReviewedLaunch(
        launch.reviewedConfig,
        currentConfig,
        launch.expectedAddress,
      );
      setLaunch({
        status: "launching",
        expectedAddress,
        reviewedConfig: launch.reviewedConfig,
        valueWei: launch.valueWei,
      });
      const suffix = deploymentSuffix();
      const client = clanker(await freshBaseWallet());
      const result = await client.deploy(tokenConfig, suffix ? { dataSuffix: suffix } : undefined);
      if ("error" in result && result.error) throw result.error;
      setLaunch({ status: "submitted", txHash: result.txHash });
      const transactionReceipt = await publicClient.waitForTransactionReceipt({ hash: result.txHash });
      if (transactionReceipt.status !== "success") throw new Error("Clanker deployment reverted on Base.");
      const tokenAddress = assertClankerLaunchReceipt({
        logs: transactionReceipt.logs,
        expectedAddress,
        expectedCreator,
      });
      setLaunch({ status: "confirmed", txHash: result.txHash, tokenAddress });
      void fetch("/api/clanker/index", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address: tokenAddress }),
      });
    } catch (error) {
      setLaunch({ status: "error", message: error instanceof Error ? error.message : "Launch failed." });
    }
  };

  const review =
    receipt && connection.address && (launch.status === "ready" || launch.status === "launching")
      ? createLaunchReview({
          creator: receipt.creator,
          expectedAddress: launch.expectedAddress,
          metadataUri: receipt.metadataUri,
          valueWei: launch.valueWei,
        })
      : null;

  return (
    <div className={styles.releaseStage}>
      <span>02 / BASE TOKEN</span>
      <strong>{launch.status === "confirmed" ? "TOKEN LIVE" : "CLANKER V4"}</strong>
      <small>Standard Base/WETH launch. Zero automatic dev buy. The wallet always confirms deployment.</small>
      <small>1% swap fee per side. Clanker anti-sniper fee decays from 66.6777% to 4.1673% during the first 15 seconds.</small>

      {!receipt ? <p>Publish the master first.</p> : null}

      {receipt && connection.status !== "connected" ? (
        <div className={styles.walletChoices}>
          {connectors.map((connector) => (
            <button
              type="button"
              key={connector.uid}
              disabled={connect.isPending}
              onClick={() => connect.mutate({ connector })}
            >
              CONNECT {connector.name.toUpperCase()}
            </button>
          ))}
        </div>
      ) : null}

      {receipt && connection.status === "connected" ? (
        <div className={styles.launchActions}>
          <p>{shortAddress(connection.address)} / {connection.chainId === base.id ? "BASE" : "WRONG NETWORK"}</p>
          {connection.address.toLowerCase() !== receipt.creator.toLowerCase() ? (
            <p className={styles.renderError}>Reconnect {shortAddress(receipt.creator)} — this wallet owns the immutable release.</p>
          ) : null}
          {launch.status === "confirmed" ? (
            <div className={styles.launchLinks}>
              <a href={`https://basescan.org/token/${launch.tokenAddress}`} target="_blank" rel="noreferrer">BASESCAN ↗</a>
              <a href={`https://base.app/coin/base-mainnet/${launch.tokenAddress}`} target="_blank" rel="noreferrer">OPEN IN BASE APP ↗</a>
            </div>
          ) : (
            <>
              {review ? (
                <dl className={styles.launchReview}>
                  <div><dt>PROTOCOL</dt><dd>{review.protocol}</dd></div>
                  <div><dt>NETWORK</dt><dd>{review.network} / {review.chainId}</dd></div>
                  <div><dt>CREATOR</dt><dd title={review.creator}>{shortAddress(review.creator)}</dd></div>
                  <div><dt>METADATA</dt><dd title={review.metadataUri}>IPFS / IMMUTABLE</dd></div>
                  <div><dt>PREDICTED TOKEN</dt><dd title={review.expectedAddress}>{shortAddress(review.expectedAddress)}</dd></div>
                  <div><dt>TX VALUE</dt><dd>{review.valueEth}</dd></div>
                </dl>
              ) : null}
              <button
                type="button"
                disabled={
                  launch.status === "simulating" ||
                  launch.status === "launching" ||
                  connection.address.toLowerCase() !== receipt.creator.toLowerCase()
                }
                onClick={() => void simulate()}
              >
                {launch.status === "simulating" ? "SIMULATING…" : "CHECK LAUNCH"}
              </button>
              <button
                type="button"
                className={styles.launchConfirm}
                disabled={launch.status !== "ready"}
                onClick={() => void deploy()}
              >
                {launch.status === "launching" ? "CONFIRM IN WALLET…" : "LAUNCH TOKEN"}
              </button>
            </>
          )}
        </div>
      ) : null}

      {launch.status === "submitted" ? <p>Transaction submitted: {shortAddress(launch.txHash)}</p> : null}
      {launch.status === "error" ? <p className={styles.renderError}>{launch.message}</p> : null}
      {connect.error ? <p className={styles.renderError}>{connect.error.message}</p> : null}
    </div>
  );
}
