import { getTickerBeatReleases } from "./clanker-api";
import { ReleaseGrid } from "./release-grid";
import styles from "./release-board.module.css";

export async function ReleaseBoard() {
  const items = await getTickerBeatReleases();

  return (
    <section id="board" className={styles.board}>
      <header>
        <div>
          <span>Confirmed on Base</span>
          <h2>Sound board</h2>
        </div>
        <p>Listen first. Every card is a verified token with its immutable audio attached.</p>
      </header>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <span>Empty crate</span>
          <strong>The first slot is open.</strong>
          <p>Open Make, write a loop, and finish it. The board fills only after a confirmed Base deployment.</p>
        </div>
      ) : (
        <ReleaseGrid items={items} />
      )}
    </section>
  );
}
