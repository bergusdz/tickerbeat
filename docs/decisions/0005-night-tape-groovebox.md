# ADR 0005: Night Tape Groovebox visual system

**Status:** Accepted  
**Date:** 2026-08-24

## Context

ADR 0004 staged TickerBeat as one persistent DJ instrument. The shipped
presentation still opened on a marketing hero (`YOUR SOUND. YOUR TICKER.`)
that pushed the sequencer below the first viewport at 390, 768 and 1440
pixels. Native range sliders, 9–11px labels, a BASE network pill on Make,
and repeated “token workstation” chrome made the product read as a crypto
dashboard wrapped around a drum machine.

Open-source interaction research in
[`open-source-music-ui-patterns.md`](../research/open-source-music-ui-patterns.md)
remains the source for behaviour: sequencer first, stable transport, one
selected track, staged advanced work. No third-party CSS, samples or branded
enclosure is copied. Drumhaus and OTTO stay CC BY-NC-SA pattern references
only. GridSound stays AGPL pattern reference only.

## Decision

Replace the landing-page chassis with a **Night Tape Groovebox**:

1. The first viewport is the instrument: brand, stage rail, transport, track
   select and enough of the 16-step tape to write a beat.
2. Transport stays mounted across Make and Mix so play, tempo and swing do
   not disappear when shaping sound.
3. Wallet, network and deploy language appear only in Finish, Board and the
   public track page.
4. Signal lime is reserved for live playback, the primary play control and
   focus. Track colour is an LED, not a page wash. Playhead position uses a
   cyan column marker plus `aria-current`, not colour alone.
5. Body type is IBM Plex Sans. Unbounded is limited to brand and section
   titles. IBM Plex Mono is reserved for tempo, step numbers and addresses.
6. Primary controls are at least 44px. Range inputs are styled. The 16-step
   tape may scroll internally on 390px; the page itself must not overflow.

Canonical project state, SoundPlan, clip persistence, ReleaseSession and
Clanker v4 are unchanged.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| `--void` | `#070605` | Page ground |
| `--chassis` | `#12100c` | Instrument body |
| `--well` | `#0c0b09` | Recessed control wells |
| `--raised` | `#1c1914` | Raised pads |
| `--paper` | `#f3eee4` | Primary text |
| `--muted` | `#9a9386` | Secondary text |
| `--signal` | `#d8ff3c` | Live / play / focus |
| `--playhead` | `#7ed9ff` | Current step |
| `--warn` | `#ff5d3d` | Record / error |
| `--base` | `#0052ff` | Finish/Board network only |

## Consequences

- Make no longer contains a hero, promise strip or Base pill.
- Mix, Finish, Board and `/track/[address]` share the same tokens and control
  anatomy.
- Existing tests continue to address controls by accessible name.
- Reduced-motion users get a static playhead and no signal pulse.
