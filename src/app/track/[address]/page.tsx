import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getTickerBeatRelease } from "@/features/board/clanker-api";

import styles from "./page.module.css";

const FALLBACK_GATEWAY = "https://ipfs.io/ipfs/";

function publicUrl(uri: string | null): string | undefined {
  if (!uri) return undefined;
  return uri.startsWith("ipfs://") ? `${FALLBACK_GATEWAY}${uri.slice(7)}` : uri;
}

type TrackPageProps = { params: Promise<{ address: string }> };

export async function generateMetadata({ params }: TrackPageProps): Promise<Metadata> {
  const release = await getTickerBeatRelease((await params).address);
  if (!release) return { title: "Sound not found — TickerBeat" };
  const title = `${release.name} ($${release.symbol}) — TickerBeat`;
  const description = `Listen to ${release.name}, a playable token launched on Base through TickerBeat.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "music.song",
      images: release.imageUrl ? [publicUrl(release.imageUrl) ?? ""] : [],
      audio: release.audioUrl ? [publicUrl(release.audioUrl) ?? ""] : [],
    },
  };
}

export default async function TrackPage({ params }: TrackPageProps) {
  const release = await getTickerBeatRelease((await params).address);
  if (!release) notFound();
  const image = publicUrl(release.imageUrl);
  const audio = publicUrl(release.audioUrl);

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/#board">← Sound board</Link>
        <span>Base · Clanker v4</span>
      </header>
      <article className={styles.release}>
        <div>
          {image ? (
            <Image className={styles.artwork} src={image} alt={`${release.name} cover`} width={900} height={900} unoptimized />
          ) : <div className={styles.fallback}>{release.symbol.slice(0, 2)}</div>}
        </div>
        <div className={styles.details}>
          <span>Playable release</span>
          <h1>{release.name}</h1>
          <strong className={styles.ticker}>${release.symbol}</strong>
          {audio ? <audio controls preload="metadata" src={audio} /> : null}
          <p>The sound is the artifact. The token is its onchain market. Listen, then verify, then trade.</p>
          <nav className={styles.actions}>
            <a href={`https://base.app/coin/base-mainnet/${release.address}`} target="_blank" rel="noreferrer">Trade in Base App</a>
            <a href={`https://basescan.org/token/${release.address}`} target="_blank" rel="noreferrer">Verify on Basescan</a>
            {release.metadataUrl ? <a href={publicUrl(release.metadataUrl)} target="_blank" rel="noreferrer">Metadata</a> : null}
          </nav>
          <p className={styles.address}>Contract · {release.address}</p>
        </div>
      </article>
    </main>
  );
}
