import { getTickerBeatReleases } from "./clanker-api";
import { ReleaseGrid } from "./release-grid";
import styles from "./release-board.module.css";

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
          <p>Open Make to compose it. The board fills only after a confirmed Base deployment.</p>
        </div>
      ) : <ReleaseGrid items={items} />}
    </section>
  );
}
