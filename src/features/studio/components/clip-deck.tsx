import type { SoundClipController } from "../recording/types";
import { SoundClipPanel } from "../recording/sound-clip-panel";
import styles from "../studio.module.css";

export function ClipDeck({ control }: { control: SoundClipController }) {
  return (
    <section className={styles.clipDeck} aria-label="Recorded sound deck">
      <header className={styles.sectionHeading}>
        <div>
          <span>Optional input</span>
          <strong>Capture a sound</strong>
        </div>
        <small>Microphone or audio file</small>
      </header>
      <SoundClipPanel control={control} />
    </section>
  );
}
