import Image from "next/image";
import Link from "next/link";

import { getTickerBeatReleases } from "./clanker-api";
import styles from "./release-board.module.css";

const FALLBACK_GATEWAY = "https://ipfs.io/ipfs/";

function playableUrl(uri: string | null): string | undefined {
  if (!uri) return undefined;
  return uri.startsWith("ipfs://") ? `${FALLBACK_GATEWAY}${uri.slice(7)}` : uri;
}

export async function ReleaseBoard() {
  const items = await getTickerBeatReleases();

  return (
    <section id="board" className={styles.board}>
      <header>
        <div>
          <span>LIVE ON BASE / CLANKER V4</span>
          <h2>THE SOUND BOARD</h2>
        </div>
        <p>Listen before you trade. Every card resolves to a real Base token and its immutable audio.</p>
      </header>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <span>NO. 000</span>
          <strong>THE FIRST SLOT IS OPEN.</strong>
          <p>Finish a loop above. The board fills only after a confirmed Base deployment.</p>
          <a href="#studio">MAKE THE FIRST SOUND ↑</a>
        </div>
      ) : (
        <div className={styles.grid}>
          {items.map((release, index) => (
            <article key={release.address}>
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
              <audio controls preload="none" src={playableUrl(release.audioUrl)} />
              <nav>
                <Link href={`/track/${release.address}`}>LISTEN ↗</Link>
                <a href={`https://base.app/coin/base-mainnet/${release.address}`} target="_blank" rel="noreferrer">TRADE ↗</a>
                <a href={`https://basescan.org/token/${release.address}`} target="_blank" rel="noreferrer">VERIFY ↗</a>
              </nav>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
