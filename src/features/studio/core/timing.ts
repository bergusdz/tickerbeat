const STEPS_PER_BAR = 16;

export function stepDurationSeconds(tempo: number, swing: number, step: number): number {
  const sixteenth = 60 / tempo / 4;
  return sixteenth * (step % 2 === 0 ? 1 + swing : 1 - swing);
}

export function stepStartTimes(tempo: number, swing: number): number[] {
  const starts: number[] = [];
  let cursor = 0;

  for (let step = 0; step < STEPS_PER_BAR; step += 1) {
    starts.push(cursor);
    cursor += stepDurationSeconds(tempo, swing, step);
  }

  return starts;
}

export function loopDurationSeconds(tempo: number): number {
  return (60 / tempo) * 4;
}
