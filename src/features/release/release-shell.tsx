"use client";

import { useEffect, useMemo, useReducer } from "react";
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

import { getBaseWalletAfterSwitch } from "../launch/base-wallet";
import { LaunchPanel } from "../launch/launch-panel";
import { PublishPanel } from "../publication/publish-panel";
import type { PublishableArtifact, PublicationReceipt } from "../publication/types";
import styles from "../studio/studio.module.css";
import { ClankerTokenLauncher } from "./adapters/clanker-launcher";
import { PinataPublicationGateway } from "./adapters/pinata-publication";
import type { LaunchInput, PublicationGateway, TokenLauncher } from "./core/ports";
import {
  createEditingSession,
  reduceReleaseSession,
  type LaunchReviewReceipt,
  type ReleaseSession,
} from "./core/release-session";

type BaseWallet = WalletClient<Transport, Chain, Account>;

async function sha256(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new Uint8Array(await blob.arrayBuffer()));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function artifactHashes(artifact: PublishableArtifact) {
  const snapshotHash = await sha256(artifact.project);
  const parts = await Promise.all([sha256(artifact.audio), sha256(artifact.cover), snapshotHash]);
  const artifactHash = await sha256(new Blob([parts.join(":")], { type: "text/plain" }));
  return { snapshotHash, artifactHash };
}

function publicationFrom(session: ReleaseSession): PublicationReceipt | null {
  if (session.status === "failed") return publicationFrom(session.lastSafe);
  return "publication" in session ? session.publication : null;
}

function reviewFrom(session: ReleaseSession): LaunchReviewReceipt | null {
  if (session.status === "failed") return reviewFrom(session.lastSafe);
  return "review" in session ? session.review : null;
}

export function ReleaseShell({
  artifact,
  publicationGateway = new PinataPublicationGateway(),
  createLauncher,
}: {
  artifact: PublishableArtifact;
  publicationGateway?: PublicationGateway;
  createLauncher?: () => TokenLauncher;
}) {
  const [session, dispatch] = useReducer(reduceReleaseSession, undefined, createEditingSession);
  const connection = useConnection();
  const connectors = useConnectors();
  const connect = useConnect();
  const switchChain = useSwitchChain();
  const publicClient = usePublicClient({ chainId: base.id });
  const walletClient = useWalletClient({ chainId: base.id });
  const publication = publicationFrom(session);
  const review = reviewFrom(session);

  const freshBaseWallet = async () =>
    getBaseWalletAfterSwitch({
      chainId: connection.chainId,
      switchToBase: () => switchChain.mutateAsync({ chainId: base.id }),
      getBaseWallet: async () => {
        const result = await walletClient.refetch();
        return result.data as BaseWallet | undefined;
      },
    });

  const launcher = useMemo(() => {
    if (createLauncher) return createLauncher();
    if (!publicClient) return null;
    return new ClankerTokenLauncher(publicClient as PublicClient, freshBaseWallet);
    // Wallet/network state is validated again immediately before every operation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createLauncher, publicClient]);

  useEffect(() => {
    let cancelled = false;
    void artifactHashes(artifact).then(({ snapshotHash, artifactHash }) => {
      if (cancelled) return;
      dispatch({ type: "render-started", snapshotHash });
      dispatch({ type: "render-succeeded", artifactHash });
    }).catch((error) => {
      if (!cancelled) {
        dispatch({
          type: "operation-failed",
          operation: "render",
          message: error instanceof Error ? error.message : "Artifact verification failed.",
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [artifact]);

  const connectWallet = (uid: string) => {
    const connector = connectors.find((candidate) => candidate.uid === uid);
    if (connector) connect.mutate({ connector });
  };

  const publish = async () => {
    if (!connection.address) return;
    const safe = session.status === "failed" ? session.lastSafe : session;
    if (safe.status !== "rendered") return;
    if (session.status === "failed") dispatch({ type: "retry" });
    dispatch({ type: "publication-started" });
    try {
      const receipt = await publicationGateway.publish(artifact, connection.address);
      dispatch({ type: "publication-succeeded", receipt });
    } catch (error) {
      dispatch({
        type: "operation-failed",
        operation: "publish",
        message: error instanceof Error ? error.message : "The release could not be published.",
      });
    }
  };

  const launchInput = (): LaunchInput => {
    if (!connection.address || !publication) throw new Error("Connect the publishing wallet first.");
    return { artifact, publication, creator: connection.address };
  };

  const checkLaunch = async () => {
    if (!launcher) return;
    const safe = session.status === "failed" ? session.lastSafe : session;
    if (safe.status !== "published") return;
    if (session.status === "failed") dispatch({ type: "retry" });
    dispatch({ type: "review-started" });
    try {
      dispatch({ type: "review-succeeded", review: await launcher.review(launchInput()) });
    } catch (error) {
      dispatch({
        type: "operation-failed",
        operation: "review",
        message: error instanceof Error ? error.message : "Launch simulation failed.",
      });
    }
  };

  const launch = async () => {
    if (!launcher || !review) return;
    const safe = session.status === "failed" ? session.lastSafe : session;
    if (safe.status !== "reviewed") return;
    if (session.status === "failed") dispatch({ type: "retry" });
    dispatch({ type: "launch-started" });
    try {
      const submitted = await launcher.submit(launchInput(), review);
      dispatch({ type: "launch-submitted", txHash: submitted.txHash });
      const confirmed = await launcher.confirm(submitted, review);
      dispatch({ type: "launch-confirmed", receipt: confirmed });
      void fetch("/api/clanker/index", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address: confirmed.tokenAddress }),
      });
    } catch (error) {
      dispatch({
        type: "operation-failed",
        operation: "launch",
        message: error instanceof Error ? error.message : "Launch failed.",
      });
    }
  };

  return (
    <div className={styles.releaseRail}>
      <PublishPanel
        receipt={publication}
        connected={connection.status === "connected"}
        connectors={connectors}
        connecting={connect.isPending}
        publishing={session.status === "publishing"}
        ready={session.status === "rendered" || (session.status === "failed" && session.lastSafe.status === "rendered")}
        error={session.status === "failed" && session.operation === "publish" ? session.message : null}
        connectError={connect.error?.message ?? null}
        onConnect={connectWallet}
        onPublish={() => void publish()}
      />
      <LaunchPanel
        receipt={publication}
        session={session}
        review={review}
        address={connection.address}
        chainId={connection.chainId}
        connectors={connectors}
        connecting={connect.isPending}
        connectError={connect.error?.message ?? null}
        onConnect={connectWallet}
        onReview={() => void checkLaunch()}
        onLaunch={() => void launch()}
      />
    </div>
  );
}
