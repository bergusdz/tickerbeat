# Open-source music interface patterns

Checked on 2026-08-13. This note records interaction patterns, not a plan to
copy another product's appearance. Repositories are pinned to the revisions
reviewed so later design decisions remain auditable.

## Sources

| Project | Revision | License | Useful evidence | TickerBeat use |
| --- | --- | --- | --- | --- |
| [Drumhaus](https://github.com/mxfng/drumhaus/tree/6b3f1856a6878167954f408349b6e4297e628cb7) | `6b3f185` | CC BY-NC-SA 4.0 | A 16-step, sample-based instrument that puts live sequencing first, keeps per-voice sound controls close to the grid, and uses one timing model for live playback and WAV export. | Interaction reference only. Use the principle that the primary surface should feel like an instrument, with immediate visual playhead feedback. Do not copy code, styling, samples, or hardware-inspired graphics. |
| [GridSound DAW](https://github.com/gridsound/daw/tree/18a41e031885d44a7f456f306515c90ea80976f7) | `18a41e0` | AGPL-3.0 | A dense browser DAW organizes transport, tracks, mixer, effects and arrangement as distinct work areas rather than one scrolling form. | Interaction reference only. Adopt progressive disclosure and persistent transport; do not copy AGPL implementation or visual assets. |
| [Waveform Playlist](https://github.com/naomiaro/waveform-playlist/tree/fb81b68d66f678ef2489a93655841f8e7add61c0) | `fb81b68` | MIT | Separates reusable audio state from transport and waveform presentation. Recording, playback, effects and WAV export are presented around an audio artifact. | Use the product pattern of treating the recorded clip as a first-class deck with explicit load, preview and removal states. No source code was copied. |
| [Beatcraftery](https://github.com/jeco123/beatcraftery/tree/b799a0ce39d4d1d6a723ec388aaa5b69cee44b5b) | `b799a0c` | MIT | A clear 16-step grid, visible current-step indicator, per-track mute/solo, accent editing and responsive controls make the core loop understandable without a tutorial. | Use semantic buttons for every step, explicit track selection and a separate accent lane. No source code was copied. |
| [audio](https://github.com/raphaelsalaja/audio/tree/3a9fe941c589d26d3487db17f5183eb9cecf3258) | `3a9fe94` | MIT | Models synthesis declaratively: sound descriptions are data and playback is an adapter. | Confirms the existing TickerBeat boundary between `SoundPlan` and Tone.js. It informs architecture, not appearance. |
| [OTTO](https://github.com/bitfieldaudio/OTTO/tree/a43e03943416a510fdcb7245680c705f49a45c7f) | `a43e039` | CC BY-NC-SA 4.0 | A hardware-oriented sampler, sequencer, multi-engine synth and effects box treats mode changes as part of a single instrument. | Interaction reference only. Use a stable chassis with staged modes and consistent transport; do not copy enclosure, branding, assets or source. |

## Repeated patterns

1. **Creation starts at the sequencer.** The grid and transport are the first
   meaningful controls, not wallet connection, token metadata or a marketing
   hero.
2. **Transport remains stable.** Play/stop, tempo, swing and playhead state do
   not move when the user changes from pattern editing to sound shaping.
3. **One selected track drives local controls.** Track selection connects the
   grid, mixer and sound controls without duplicating a full editor per track.
4. **Dense tools still need modes.** Advanced controls work when grouped into
   small, named stages instead of being presented as one long panel.
5. **State is visible.** Active steps, the current playhead, mute/solo, loaded
   audio and release readiness all require more than color alone.
6. **The artifact precedes distribution.** Recording and export belong to the
   music workflow; wallet review and token deployment belong to a later release
   workflow.

## License boundary

- MIT sources were inspected for architectural and interaction evidence. No
  code has been pasted or adapted, so no third-party notice is currently
  required in the application bundle.
- AGPL and CC BY-NC-SA sources are references only. Their source, samples,
  screenshots, logos, distinctive panels and CSS are not used.
- TickerBeat's layout, component structure, visual language, copy and assets
  are original. If code is adapted later, its exact source and required notice
  must be recorded before merge.

## Resulting direction

TickerBeat will be an **industrial broadcast sampler**: a compact black desk
with warm off-white labels, one high-energy signal-lime accent and oversized
performance controls. The memorable object is a 16-step "ticker tape" whose
playhead travels across the machine. The workflow is staged as **Make, Mix,
Finish, Board**, while project and playback state remain mounted across stages.

