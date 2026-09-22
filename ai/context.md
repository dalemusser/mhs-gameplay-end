# mhs-gameplay-end — Context for Claude Code

## What this repo is

The **end-of-game ceremony** for Mission HydroSci (MHS): a static web bundle
(HTML + plain-script JS + GLB characters + voice/music/images) that plays after
a student finishes Unit 5. Babylon.js renders a TV-style award show; the five
characters recap the units; eight lines have a warmer (A) and gentler (B)
variant chosen from the student's Embedded Assessment (EA) checkpoint scores;
the ending shows a per-unit star board and the Planetary Water Steward award.

It is consumed by **stratahub** through a host page
(`/missionhydrosci/ceremony`) that loads `lib/embed.js` from the bundle's
version folder on the CDN and calls `MHSCeremony.mount` with a same-origin
scores endpoint. Contract: `docs/embed-api.md`. Integration plan:
`stratahub/docs/mission-hydrosci/mhs-end-ceremony-plan.md`.

## Layout

- `ceremony.html` — the current show, standalone (`?profile=<fixture>`, `?dev=1`).
- `index.html` — launcher listing the sample students in `test-profiles/`.
- `lib/embed.js` — the host-page entry: DOM + CSS, loads the bundle, scores
  (static / fixture / polled URL), late binding, events, Exit control.
- `lib/resolver.js` — pure: definition + scores → linear beats; `rebindUnit`,
  `rebindStars` for late binding. Tests: `tests/resolver.test.cjs`.
- `lib/player.js` — the Babylon show (v7 lineage). `lib/aliveface.js`,
  `gaze.js`, `headlook.js` — facial life layers. `lib/vendor/` — pinned Babylon.
- `ceremony-definition_v6.js` — the content (designers' script v4); every
  text beat has a `lineId` joining it to `assets/audio_v6/ceremony_audio.json`.
- `assets/` — characters (GLB), holo images, logo, music, sfx, env textures.
- `ceremony_v1…v6.html`, `lib/player_v1…v6.js`, `ceremony-definition.js`,
  `assets/audio/` — frozen comparison archive (repo only, not shipped).
- `tools/` — `stage-dist.sh` (release staging), `export-lines.cjs` +
  `voices.json` (voice generation input for `mhsaudiotools`).
- `docs/` — plans and decisions per release; `designer-content/` — the
  designers' scripts and the EA working doc (vendored copies).
- `dist/` — staged release folders (git-ignored; `dist/v0.1.7` is what is live).

## Conventions

- No build step, no npm: plain scripts, IIFEs, globals. Node only for tests
  and the line exporter. Bump `EMBED_V` in `lib/embed.js` on any edit to
  `lib/*.js` or the definition (the only cache buster for those files).
- The plain names (`ceremony.html`, `lib/player.js`) are the current show; at
  each ship, snapshot them to `ceremony_vN.html` + `lib/player_vN.js`.
- A/B: A is always the best case, B the generic one; missing scores play B;
  never fabricate a 0. Stars come from the grader (unit totals).
- Version folders on the CDN (`mhs/end/vX.Y.Z/`) are immutable; stage with
  `tools/stage-dist.sh`, never re-upload into an existing version.
- No public CDN at runtime (Babylon and its textures are vendored).

## Status (2026-09-21)

v0.1.8 built (embed, late binding, vendored runtime, exit control, garden
bar 2.5): `docs/v0.1.8-plan.md`. Live on the CDN: v0.1.7. Next: stage/upload
v0.1.8, then the size work (animation clips, normal maps, audio bitrates).
Grader-side EA scores and open team questions:
`mhsgrading/docs/ea-scores-team-questions-2026-09.md`.
