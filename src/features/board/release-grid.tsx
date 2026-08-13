"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

import styles from "./release-board.module.css";
import type { BoardRelease } from "./types";

const FALLBACK_GATEWAY = "https://ipfs.io/ipfs/";

function playableUrl(uri: string | null): string | undefined {
  if (!uri) return undefined;
  return uri.startsWith("ipfs://") ? `${FALLBACK_GATEWAY}${uri.slice(7)}` : uri;
}

export function ReleaseGrid({ items }: { items: BoardRelease[] }) {
  const players = useRef(new Map<string, HTMLAudioElement>());
  const [playingAddress, setPlayingAddress] = useState<string | null>(null);

  const markPlaying = (address: string) => {
    for (const [otherAddress, player] of players.current) {
      if (otherAddress !== address) player.pause();
    }
    setPlayingAddress(address);
  };

  const markStopped = (address: string) => {
    setPlayingAddress((current) => current === address ? null : current);
  };

  return (
    <div className={styles.grid}>
      {items.map((release, index) => (
        <article key={release.address} data-playing={playingAddress === release.address}>
          <span>NO. {String(index + 1).padStart(3, "0")}</span>
          {release.imageUrl ? (
            <Image
              src={playableUrl(release.imageUrl) ?? ""}
              alt={`${release.name} cover`}
              width={640}
              height={400}
              unoptimized
            />
          ) : <div className={styles.cover}>{release.symbol.slice(0, 2)}</div>}
          <h3>{release.name}</h3>
          <strong>${release.symbol}</strong>
          <audio
            ref={(player) => {
              if (player) players.current.set(release.address, player);
              else players.current.delete(release.address);
            }}
            aria-label={`Play ${release.name} preview`}
            controls
            preload="none"
            src={playableUrl(release.audioUrl)}
            onPlay={() => markPlaying(release.address)}
            onPause={() => markStopped(release.address)}
            onEnded={() => markStopped(release.address)}
          />
          <nav>
            <Link href={`/track/${release.address}`}>LISTEN ↗</Link>
            <a href={`https://base.app/coin/base-mainnet/${release.address}`} target="_blank" rel="noreferrer">TRADE ↗</a>
            <a href={`https://basescan.org/token/${release.address}`} target="_blank" rel="noreferrer">VERIFY ↗</a>
          </nav>
        </article>
      ))}
    </div>
  );
}
