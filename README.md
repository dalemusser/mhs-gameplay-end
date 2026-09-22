# mhs-gameplay-end

The end-of-game ceremony for Mission HydroSci: after Unit 5 the five characters
take the stage in a short Babylon.js award show, recap the student's journey
unit by unit (each of eight lines has a warmer and a gentler version chosen by
the student's Embedded Assessment scores), and finish with a star board and the
Planetary Water Steward award.

- **Run locally:** serve the repo root (`python3 -m http.server 8765`) and open
  `index.html` (sample students) or `ceremony.html?profile=all-high`.
- **Host page contract:** `docs/embed-api.md` — one script (`lib/embed.js`),
  one call (`MHSCeremony.mount`), scores from a same-origin endpoint with late
  binding, an Exit control, events for logging.
- **Content:** `ceremony-definition_v6.js` (the designers' script v4) +
  `assets/audio_v6/` (ElevenLabs voice, generated with `mhsaudiotools`; see
  `tools/export-lines.cjs`).
- **Tests:** `node tests/resolver.test.cjs`; `tests/late-binding.html` is the
  Playwright harness for the embed.
- **Assets:** `tools/optimize.sh <originals>` re-derives the shipped assets (clips,
  textures, audio, images) from the originals (git tag `assets-original`);
  see `docs/v0.2.0-plan.md`.
- **Release:** `tools/stage-dist.sh <version>` stages `dist/v<version>/`
  (current show only); upload to the CDN's `mhs/end/v<version>/` folder;
  folders are immutable. History and decisions: `docs/`.
- **Integration:** `stratahub/docs/mission-hydrosci/mhs-end-ceremony-plan.md`;
  grader-side scoring: `mhsgrader/docs/updates/ea-scores.md` and
  `mhsgrading/docs/ea-scores-team-questions-2026-09.md`.
