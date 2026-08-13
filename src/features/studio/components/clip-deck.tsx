import type { SoundClipController } from "../recording/types";
import { SoundClipPanel } from "../recording/sound-clip-panel";
import styles from "../studio.module.css";

export function ClipDeck({ control }: { control: SoundClipController }) {
  return (
    <section className={styles.clipDeck} aria-label="Recorded sound deck">
      <header className={styles.sectionHeading}>
        <div>
          <span>Deck B / live input</span>
          <strong>CAPTURE A SOUND</strong>
        </div>
        <small>MICROPHONE OR AUDIO FILE</small>
      </header>
      <SoundClipPanel control={control} />
    </section>
  );
}

