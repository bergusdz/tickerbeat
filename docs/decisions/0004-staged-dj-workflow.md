# ADR 0004: Stage TickerBeat as one persistent DJ instrument

**Status:** Accepted

## Context

The first TickerBeat interface exposed sequencing, mixing, recording, export,
publishing and token launch in one tall machine. The controls worked, but the
screen did not establish a clear first action and placed advanced release work
too close to music creation.

Research across browser drum machines, DAWs, waveform editors and hardware
grooveboxes found a consistent model: transport remains stable, the sequencer
dominates creation, one selected track drives local controls, and advanced
tasks are separated into modes. The source and license review is recorded in
[`open-source-music-ui-patterns.md`](../research/open-source-music-ui-patterns.md).

## Decision

Render one persistent TickerBeat workspace with four keyboard-accessible tabs:

1. **Make** — transport, track selection, 16-step ticker tape and accents.
2. **Mix** — voice, volume, filter, echo, performance pads and recorded clip.
3. **Finish** — title, deterministic render, IPFS publication and reviewed
   Clanker v4 transaction.
4. **Board** — verified playable releases and Base market links.

Make is the default. Wallet and token-launch controls are never shown in Make.
Changing stages must not unmount or reset the canonical project, clip, history
or audio engine. On small screens, the stage rail scrolls horizontally and all
primary targets remain at least 44 pixels high.

The visual system is original and intentionally specific: an industrial
broadcast sampler, warm black chassis, off-white typography, signal-lime
activity, thin calibration lines and a horizontally travelling playhead. It
must not imitate a branded drum machine or reuse third-party CSS/assets.

## Consequences

- A new workspace component owns only stage selection and semantics; studio
  state remains in the Studio owner.
- Studio sections become focused components instead of another state or audio
  abstraction.
- The first viewport answers "what can I make?" before "what can I launch?".
- The staged flow is easier to test at mobile, tablet and desktop widths.
- Board discovery remains accessible without forcing a wallet connection.

## Acceptance criteria

- The tabs expose correct `tab`, `tablist` and `tabpanel` semantics and support
  arrow-key navigation.
- Project edits and recorded clips survive stage changes.
- The first viewport at 390, 768 and 1440 pixels contains brand, transport and
  enough of the sequencer to begin composing.
- Make contains no wallet prompt, deploy button or token-price language.
- Reduced-motion users receive a static playhead/entry presentation.

