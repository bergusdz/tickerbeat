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

import { createClankerTokenConfig } from "./clanker-config";

type LaunchState =
  | { status: "idle" | "simulating" }
  | { status: "ready" | "launching"; expectedAddress: `0x${string}` }
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

  const tokenConfig = receipt && connection.address
    ? createClankerTokenConfig({
        creator: connection.address,
        title: artifact.title,
        symbol: artifact.symbol,
        coverUri: receipt.coverUri,
        audioUri: receipt.audioUri,
        metadataUri: receipt.metadataUri,
      })
    : null;

  const clanker = () => {
    if (!walletClient.data || !publicClient) throw new Error("Base wallet is not ready.");
    return new Clanker({
      wallet: walletClient.data as WalletClient<Transport, Chain, Account>,
      publicClient: publicClient as PublicClient,
    });
  };

  const simulate = async () => {
    if (!tokenConfig) return;
    setLaunch({ status: "simulating" });
    try {
      if (connection.chainId !== base.id) await switchChain.mutateAsync({ chainId: base.id });
      const client = clanker();
      const transaction = await client.getDeployTransaction(tokenConfig);
      if (!transaction.expectedAddress) throw new Error("Clanker did not return a predicted token address.");
      const result = await client.deploySimulate(tokenConfig);
      if ("error" in result && result.error) throw result.error;
      setLaunch({ status: "ready", expectedAddress: transaction.expectedAddress });
    } catch (error) {
      setLaunch({ status: "error", message: error instanceof Error ? error.message : "Simulation failed." });
    }
  };

  const deploy = async () => {
    if (!tokenConfig || launch.status !== "ready") return;
    const expectedAddress = launch.expectedAddress;
    setLaunch({ status: "launching", expectedAddress });
    try {
      const suffix = deploymentSuffix();
      const result = await clanker().deploy(tokenConfig, suffix ? { dataSuffix: suffix } : undefined);
      if ("error" in result && result.error) throw result.error;
      setLaunch({ status: "submitted", txHash: result.txHash });
      const confirmed = await result.waitForTransaction();
      if ("error" in confirmed && confirmed.error) throw confirmed.error;
      setLaunch({ status: "confirmed", txHash: result.txHash, tokenAddress: confirmed.address });
      void fetch("/api/clanker/index", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address: confirmed.address }),
      });
    } catch (error) {
      setLaunch({ status: "error", message: error instanceof Error ? error.message : "Launch failed." });
    }
  };

  return (
    <div className={styles.releaseStage}>
      <span>02 / BASE TOKEN</span>
      <strong>{launch.status === "confirmed" ? "TOKEN LIVE" : "CLANKER V4"}</strong>
      <small>Standard Base/WETH launch. Zero automatic dev buy. The wallet always confirms deployment.</small>

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
          {launch.status === "confirmed" ? (
            <div className={styles.launchLinks}>
              <a href={`https://basescan.org/token/${launch.tokenAddress}`} target="_blank" rel="noreferrer">BASESCAN ↗</a>
              <a href={`https://base.app/coin/base-mainnet/${launch.tokenAddress}`} target="_blank" rel="noreferrer">OPEN IN BASE APP ↗</a>
            </div>
          ) : (
            <>
              {launch.status === "ready" || launch.status === "launching" ? (
                <p>PREDICTED TOKEN: {shortAddress(launch.expectedAddress)}</p>
              ) : null}
              <button
                type="button"
                disabled={launch.status === "simulating" || launch.status === "launching"}
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
