# Ceremony Music Plan — Cue Sheet & Suno Sourcing

*Status: SHIPPED in dist/v0.1.6 (2026-08-21) — all five cues live, plus the
arrival grammar below and the trophy zing (assets/sfx/README.md). Originally
wired 2026-08-20 at `player_v4.js?v=4`. Dale generated + picked one take
per cue (Suno lottery done on his side); excerpts staged in `assets/music/` and
wired into the player, behavior verified via an instrumented audio log (see the
provenance table below for exact source offsets). Awaiting Dale's in-show
audition. See `docs/visual-v2-plan.md` (v4 round) for where this sits in the arc.*

## Staged excerpts — provenance (source files in assets/music/candidates/)

Chosen by RMS-energy profiling of Dale's picks; re-cut by adjusting these offsets
if a boundary sounds wrong in audition. All gained to ≈ −16 LUFS integrated, then
per-cue playback volumes (in `CUES`, player_v4.js) set the mix.

| Staged file | Source offset | Length | Gain | Notes |
|---|---|---|---|---|
| m1-cold-open.mp3 | 6.0s | 40s | −2.0dB | build peaks ~7s in → `INTRO_HOLD = 8.5` |
| m2a-walkup.mp3 | 41.3s | 90s | −3.5dB | chorus-energy groove section |
| m2b-walkup.mp3 | 15.8s | 90s | −3.1dB | post-intro groove |
| m4-riser.mp3 | 153.5s | 8.8s | +0.5dB | the track's FINALE accent run; sharpest hit at ~7.5s → `M4_HIT = 7.5` |
| m5-celebration.mp3 | 33.6s | 60s | −3.0dB | starts at the track's big drop (+7.5dB jump) |

## The grammar (awards-show rule)

Modeled on how the Emmys / MTV awards use music: **the voice is always dry — music
covers everything else.** Concretely:

- **No underscore while a character is speaking.** Any playing cue ducks out
  (~0.4s fade) the moment a line's voice clip starts.
- Music covers: the opening, every speaker transition (walk-off/walk-up), the
  build into the award, the celebration, and the ending (stars + fade to black).
- The existing SFX layer (award fanfare, applause loop) stays and interlocks with
  the cues (see M4/M5 below).

## Style direction

Audience is **young teens (11–14) in a classroom**. Direction agreed 2026-08-20:

- **Instrumental only, no vocals** — lyrics would fight the voice lines and add
  content risk; instrumental also stays timeless.
- **Modern electronic pop** — future-bass / EDM-lite / bright synth-pop; the sound
  of game trailers and kids' award-show broadcast packages. Energetic but clean:
  major keys, no dark or aggressive drops.
- **Watery, glassy synth textures** where possible — nods to the water-science
  subject and the set's blue-neon look.
- **Mix for Chromebook speakers**: mid-forward, not sub-bass dependent, ~100–128 BPM.

## Cue sheet

| Cue | Name | Type | Target length | Plays when | Out |
|-----|------|------|--------------|------------|-----|
| M1 | Cold Open | one-shot | 10–15s | On Begin click, under the boot-up intro (v4 intro round); builds to an impact as the wall/emblem lights, tail hands off to Toppo's first line | ends naturally before the line |
| M2a | Walk-up Groove A | seamless loop | 15–25s loop | Speaker hand-offs: fades in as the previous speaker turns away, loops while the next speaker walks to the podium | ducks out when the line starts |
| M2b | Walk-up Groove B | seamless loop | 15–25s loop | Same as M2a — the two grooves alternate across the show's ~10 hand-offs so transitions don't wear one track out | ducks out when the line starts |
| M4 | Award Riser | one-shot | 6–8s | Builds into the award card reveal; ends on a clean hit exactly where the existing fanfare sting fires | hard end into fanfare |
| M5 | Celebration | seamless loop | 30–60s loop | Under the finale: fanfare tail, applause, confetti, trophy, star pop-up | fades with the fade-to-black |

Considered and rejected per the grammar: an always-on ambient bed (the `MUSIC.bed`
slot) and an underscore beneath the MISSION HIGHLIGHTS list — Toppo speaks through
both, and the rule is voice-dry. The walk-up grooves effectively *are* the bed; they
just only exist when nobody is talking. (M3 was the rejected highlights underscore —
the number is retired, not renumbered, so takes stay traceable.)

## Suno prompts (paste-ready)

Generate with **Instrumental ON**. Suno produces ~2–4 minute tracks and two takes
per run; 2–3 runs per cue gives a good lottery. I'll excerpt/trim/loop the winners —
you don't need to worry about exact lengths, just overall vibe. Loop cues want a
steady groove section; one-shots want a clear build.

**M1 — Cold Open**
> cinematic electronic intro for a futuristic awards show, dark shimmering pad
> opening into a rising synth build, glassy water-like textures, big bright uplifting
> impact, modern game-trailer energy, clean and youthful, instrumental, no vocals,
> 112 BPM

**M2a — Walk-up Groove A**
> upbeat future bass groove, bright synth plucks and punchy drums, confident TV
> award-show walk-on music, sparkling water-drop textures, fun and energetic,
> clean, youthful, major key, instrumental, no vocals, 118 BPM

**M2b — Walk-up Groove B**
> funky electro-pop groove, four-on-the-floor, bright synth-brass stabs, bouncy
> bassline, TV award-show house-band vibe, playful and confident, clean, major key,
> instrumental, no vocals, 124 BPM

**M4 — Award Riser**
> electronic tension riser, snare build-up and rising filter sweep, anticipation
> before a big award reveal, accelerating pulse, bright not scary, ends on one clean
> hit, instrumental, no vocals

**M5 — Celebration**
> triumphant celebration anthem, euphoric future bass, soaring bright synths,
> festival-finale energy, family-friendly victory music, glittering arpeggios,
> major key, uplifting, instrumental, no vocals, 124 BPM

## Workflow

1. **Dale generates** candidates in Suno per the prompts above and drops the MP3s in
   `assets/music/candidates/` named `m1-take1.mp3`, `m2a-take3.mp3`, etc. (any
   take numbering is fine as long as the cue id leads).
2. **I edit**: trim to cue length, find seamless loop points for M2a/M2b/M5,
   normalize loudness across cues, and stage the results as
   `assets/music/m1-cold-open.mp3`, `m2a-walkup.mp3`, `m2b-walkup.mp3`,
   `m4-riser.mp3`, `m5-celebration.mp3`.
3. **Dale auditions** in the show (the wiring round adds the cue table to
   `player_v4.js`; every cue degrades to silence if its file is missing, so cues
   can land one at a time).

**Staging note:** `assets/music/candidates/` must be EXCLUDED when staging a
`dist/vX.Y.Z` bundle (like the audio `.words.json` sidecars); only the five named
cue files ship.

## Arrival grammar (added 2026-08-20 after Dale's audition note)

The first wiring ducked the music 0.35s AFTER the voice started — an abrupt
collision. Rebuilt as the real awards-show sequence (all constants at the top of
player_v4.js next to `CUES`):

1. Hand-off: walk-up groove + soft welcome applause (`APPLAUSE_WALK` 0.26) start
   together under the walk.
2. Walk's last quarter: the groove fades out over `WALK_FADE` 1.6s — the band
   sees the speaker coming; it's silent right as they step up.
3. Arrival: welcome applause decays over `APPLAUSE_TAIL` 1.8s.
4. `SETTLE` 1.3s: the speaker stands at the podium composing themselves.
5. The line starts — over the applause's last whisper, voice otherwise dry.

The opening mirrors it: m1 build (`INTRO_HOLD` 8.5s) → 1.5s fade →
`INTRO_SETTLE` 1.7s quiet gap → Toppo's first line.

## Wiring notes (for the sound round)

- Hand-off detection already exists: `enterBeat` fires `sendBack`/`startOut` — M2
  starts there; `showText` is the duck point (voice starts).
- The M2 grooves resume-loop rather than restart on each hand-off (restarting the
  same 4 bars every transition reads as a broken record); alternate a/b per hand-off.
- M4 needs a lead-in: the award beat is known one beat ahead (`beats[idx+1]`), or
  fires on the award beat's entry with the fanfare delayed to M4's hit.
- Volumes (first guess, tune by ear): M1 0.55 · M2 0.4 · M4 0.6 · M5 0.5 under
  applause 0.6. All fades use the existing `fadeAudio` helper.
