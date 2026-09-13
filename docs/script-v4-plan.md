# Script v4 Update Plan (final script → ceremony v6)

> **Status 2026-09-10 (late): v0.1.7 LIVE** at
> `https://cdn.adroit.games/mhs/end/v0.1.7/index.html` — post-upload CDN sweep
> 139/139 = 200 (sizes match local), live launcher chips + `ceremony_v6.html`
> (cold open → Toppo → first hand-off, clips from `audio_v6/`) verified in the
> browser with zero console errors. v6 is frozen as shipped. **Round closed
> and committed + pushed as 871d14e** (2026-09-10).
>
> **Working pair after this round = the PLAIN pair `ceremony.html` +
> `lib/player.js` (lineage v7, `?v=100`)**, per the naming convention adopted
> the same night (docs/visual-v2-plan.md, "v7 round"): the plain names are the
> current show and what every release ships at `…/vX.Y.Z/ceremony.html`; the
> `_vN` pairs are the frozen archive (v1 renamed to `ceremony_v1.html` +
> `lib/player_v1.js`). Next ship: stage dist/v0.1.8, then SNAPSHOT the plain
> pair to `ceremony_v7.html` + `lib/player_v7.js` and keep working on the
> plain pair. Content for the plain pair is still `ceremony-definition_v6.js`
> + `assets/audio_v6/`.
>
> **2026-09-13: work ON HOLD** — the Partial / No-Data question is with the
> designers (docs/partial-nodata-plan.md); nothing changes until they answer.
>
> Earlier status (staging): STAGED as dist/v0.1.7 — awaiting Dale's upload.
> 139 files (v0.1.6's 105 + the v5 pair, the v6 pair, `ceremony-definition_v6.js`,
> `audition_v6.html`, `assets/audio_v6/` ×28). `diff -rq` vs v0.1.6 = exactly
> those + `index.html` (launcher → v6) + `test-profiles/boundary.json`
> (U2.C5 → 4.0); zero stray sidecars/manifests/candidates. Local curl sweep
> 139/139 = 200; staged launcher (chips, footer links), `ceremony_v6.html`
> (cold open → Toppo → first hand-off, clips from `audio_v6/`, player ?v=3)
> and `audition_v6.html` (29 rows, 12 NEW) smoke-tested from the staged
> folder with zero console errors. Post-audition additions in v6 before
> staging: cold-open + hand-off captions (player ?v=2/?v=3, see
> docs/visual-v2-plan.md v6 log). Upload:
> `aws s3 sync dist/v0.1.7/ s3://adroit-cdn/mhs/end/v0.1.7/` then the curl
> sweep against `https://cdn.adroit.games/mhs/end/v0.1.7/`. v7 is NOT cloned
> yet — clone it before the next presentation change (after upload is
> confirmed), so v6 stays frozen as shipped.
>
> Earlier status (implementation): built exactly as planned below: `ceremony_v6.html`
> + `lib/player_v6.js` (?v=1, clone of v5 ?v=2 + the `AUDIO_DIR` remap),
> `ceremony-definition_v6.js` (?v=1, script v4 text, U2.C5 ≥ 4, "to identify"),
> `assets/audio_v6/` (27 clips: 15 copied, **12 generated — 2,775 characters
> billed, 0 failed**, word parity 27/27), `tools/ceremony-lines_v6.txt`,
> `audition_v6.html` (NEW badges = the 12), launcher → v6 with v5 as the
> prior-script link, `boundary.json` U2.C5 → 4.0, `export-lines.cjs` takes a
> definition path, tests run BOTH definitions (40 green; a test pins that the
> two differ only in the 12 texts + the DANI bar). Browser-verified on a scratch
> port (no served-file swaps): v6 loads `…_v6.js?v=1` + `assets/audio_v6/`
> manifest and clips, the Partial profile plays the new DANI B line from
> `audio_v6/Jasper/u2.dani.b.mp3`, the new award sentence karaoke-syncs and
> auto-flows into the celebration (fanfare + zing fire), zero console errors;
> frozen `ceremony_v5.html` still loads `ceremony-definition.js?v=5` +
> `assets/audio/…?v=3` with the old text; launcher chips Partial = DANI·B,
> Boundary all A; `assets/audio/` untouched (git clean).
> **Next:** Dale auditions `audition_v6.html` (▶ Play new) → re-rolls per §6
> step 6 → stage dist/v0.1.7 (§7) → clone v7 as the next working pair.
> Uncommitted: all of the above + the v4 script itself — Dale commits at the
> milestone.

*Sources: `designer-content/End of Game Script v4.md` vs `…v3.md`
(whitespace-normalized diff — the v4 file is the same document re-exported
with `&nbsp;` padding, so the raw diff is 90% noise), the EA doc v2 row for
U2.C5, `mhsgrader/docs/updates/ea-scores.md` note 1, and the current
`ceremony-definition.js` (script v3 content, shipped in v0.1.3 → v0.1.6).
Precedents: `docs/script-v2-plan.md`, `docs/script-v3-plan.md`.*

## 1. What changed in the script (v3 → v4)

Dialogue only. No stage directions, holo image references, highlight bullets,
star pop-up labels, or section order changed. Twelve lines were rewritten
(every rewrite works a curriculum concept into the line — topography, claims/
evidence/reasoning, watersheds, elevation, porosity, evaporation/condensation,
argumentation) and one scoring threshold moved.

| Section (lineId) | Speaker | Change | Audio |
|---|---|---|---|
| `u2.find-team.a` | Jasper | "but you found our missing team members quickly…" → **"but you demonstrated your knowledge of topography and used the map to find our missing team members quickly and helped us get the mission back on track."** | regen |
| `u2.dani` condition | — | U2.C5 threshold **≥ 2 → ≥ 4** (B is `< 4`). Matches the EA doc's own band for this checkpoint ("On-track: 4–6 pts, Concern: < 4"), which the v3 script had ignored. Raw points, max ≈ 6 (grader note 1). | — |
| `u2.dani.a` | Jasper | → **"After DANI's argumentation system was broken, you were able to successfully identify claims, evidence and reasoning in arguments and got him back online in no time."** | regen |
| `u2.dani.b` | Jasper | → **"When DANI's argumentation system was broken, you worked hard to identify claims, evidence and reasoning."** — the script reads "toidentify" (missing space); implement as "to identify" | regen |
| `u2.water.a` | Jasper | "evaluating the available water sources and selecting the best location" → **"evaluating the available watersheds and topography to select the best location"** (rest unchanged) | regen |
| `u2.water.b` | Jasper | "evaluating the available water sources." → **"evaluating the available watersheds."** (rest unchanged) | regen |
| `u3.crates.a` | Tera | "…what you knew about surface water flow to safely float them…" → **"…what you knew about surface water flowing from upper to lower elevations and topography to safely float them down the river."** | regen |
| `u3.crates.b` | Tera | "…help float them down the river." → **"…help float them from higher to lower elevations down the river."** (second sentence unchanged) | regen |
| `u3.garden.b` | Tera | "…best places to plant superfruit." → **"…best places to plant superfruit downstream from the super nutrient."** (second sentence unchanged) | regen |
| `u4.flood` | Anderson | "you analyzed the evidence and convinced me" → **"you analyzed the porosity of the ground at the different floors and convinced me"** (rest unchanged) | regen |
| `u5.still.a` | Aryn | "properly set up the solar still to convert sea water" → **"properly set up the solar still to use your knowledge of evaporation and condensation to convert sea water"** (rest unchanged) | regen |
| `u5.still.b` | Aryn | same insertion: "help set up the solar still **to use your knowledge of evaporation and condensation** to convert sea water…" | regen |
| `end.award` | Toppo | first sentence → **"Most importantly, you've shown how your understanding of water systems allowed you to make good arguments that helped us all make better decisions that ultimately affected people, ecosystems, and our entire community."** (award sentences unchanged) | regen |

Unchanged (15 lines keep their approved takes): `u1.intro`, `u2.crash`,
`u2.find-team.b`, `u2.thanks`, `u3.pollution`, `u3.garden.a`, `u3.thanks`,
`u4.well`, `u4.soil.a`, `u4.soil.b`, `u4.thanks`, `u5.plant.a`, `u5.plant.b`,
`u5.handoff`, `end.skills`. None of the 12 rewritten lines contain "TK", so
the Amy opening-vocative quirk and the `speakText` parity guard are not in
play this round; `u5.plant.*` keep their existing `speakText`.

Regen bill: **12 lines** (Jasper 5, Tera 3, Aryn 2, Anderson 1, Toppo 1).

## 2. Versioning — how "keep the prior version" actually works here

Dale's requirement: the update lands in a **new version** so the prior one
stays available to return to. The catch is that the ceremony pairs
(`ceremony_vN.html` + `lib/player_vN.js`) share ONE content layer: every pair
loads `ceremony-definition.js` and every player fetches
`assets/audio/ceremony_audio.json`. Editing either in place would silently
re-script v1–v5 too (new text, and — since regenerated clips keep their
filenames — new audio under the old pairs). So the content layer must be
versioned alongside the pair:

| Layer | Prior (frozen) | New |
|---|---|---|
| Page | `ceremony_v5.html` | `ceremony_v6.html` (cloned from v5) |
| Player | `lib/player_v5.js` (`?v=2`) | `lib/player_v6.js` (`?v=1`, cloned from v5 ?v=2 — presentation unchanged) |
| Definition | `ceremony-definition.js` (`?v=5`, script v3) | `ceremony-definition_v6.js` (`?v=1`, script v4) |
| Voice clips + manifest | `assets/audio/` | `assets/audio_v6/` (full 27-clip set: 15 copied, 12 regenerated) |
| Exported lines | `tools/ceremony-lines.txt` | `tools/ceremony-lines_v6.txt` |
| Audition page | `audition.html` | `audition_v6.html` (points at the v6 definition + folder; `NEW_THIS_ROUND` = the 12) |

The `_v6` suffix names the unit of release — everything suffixed `_v6`
belongs together — and avoids inventing a third numbering (the designers'
script v4 ≠ visual v4; see the "v3 overloaded" caution). The new definition's
header comment states "content = designer script v4".

**Player change needed for the folder split (the one real code edit):** the
mhsaudio babylon-manifest layout hardcodes every item's `audio` path as
`assets/audio/<Speaker>/<id>.mp3` regardless of `-out`
(`mhsaudiotools/engine/output/output.go`, `ceremonyManifest`). So
`player_v6.js` gets an `AUDIO_DIR = 'assets/audio_v6/'` constant, fetches
`AUDIO_DIR + 'ceremony_audio.json'`, and remaps each item's `audio` prefix
on load. `audition_v6.html` does the same remap. No change to mhsaudiotools.

Resolver, holo images, characters, music, SFX, logo, test profiles: shared
and unchanged (only `boundary.json` moves, §4).

Cost: ~4.2 MB of duplicated clips in the repo and in each dist bundle from
here on. Accepted for a clean side-by-side; if that ever matters, the fallback
is one shared folder with new lineIds for rewritten lines, which is messier
in tooling and tests.

## 3. Definition (`ceremony-definition_v6.js`)

Copy of `ceremony-definition.js` with: the 12 texts from §1, `u2.dani`'s
`when` → `{ item: 'U2.C5', op: '>=', value: 4 }` (B stays `otherwise`, so a
missing U2.C5 still plays B), and a rewritten header (script v4, 2026-09-10,
this plan, the "toidentify" note). Everything else — lineIds, expressions,
holo image lists, highlights, celebration card, `startAtMark` — verbatim.

## 4. Fixtures and tests

- `test-profiles/boundary.json`: `U2.C5` 2.0 → **4.0** (its story is "exactly
  at threshold"). Still ≥ 2, so the frozen v3-script definition still resolves
  it to A — no old-version test changes.
- `test-profiles/partial.json` stays at `U2.C5` 3.0: it now plays **B** under
  the v6 definition (was A). Keep the score and pin the flip in the test — it
  is the one fixture that demonstrates the threshold move; the launcher's
  Partial card will show "DANI · B".
- `tests/resolver.test.cjs`: run the real-definition block against BOTH
  definitions (load `../ceremony-definition.js`, capture the global, then
  `../ceremony-definition_v6.js`, capture again) with their own manifest
  paths. Expected differences for v6: partial suffixes
  `['b','b','a','a','b','b','b','b']`; plus a new explicit case:
  `U2.C5 = 3` → B under v6, A under v3 (and `= 4` → A under both). Beat count
  (20), speaker order, stars passthrough, image sets, lineId coverage: same
  assertions for both.
- `tests/resolver.test.cjs`'s "every line has a clip" check runs per
  definition against its own folder's manifest.

## 5. Tooling

- `tools/export-lines.cjs`: accept an optional definition path
  (`node tools/export-lines.cjs ceremony-definition_v6.js > tools/ceremony-lines_v6.txt`);
  default unchanged so the old lines file can still be regenerated.
- `audition_v6.html`: copy of `audition.html` loading
  `ceremony-definition_v6.js` and `assets/audio_v6/ceremony_audio.json`
  (prefix remap), `NEW_THIS_ROUND` = the 12 ids, footer note updated.
- `index.html` (launcher): cards + "Production default" → `ceremony_v6.html`;
  load `ceremony-definition_v6.js` so the chips reflect the v6 threshold;
  footer keeps `ceremony_v5.html` ("v5 — script v3 text, restart replays the
  cold open") above v4/v3/v2/v1; add the `audition_v6.html` link beside the
  old audition link.

## 6. Audio regeneration (12 lines billed)

1. Build the CLI fresh: `cd ../mhsaudiotools && GOWORK=off go build -o <scratch>/mhsaudio ./cmd/cli`.
2. `cp -R assets/audio assets/audio_v6` — brings the 15 unchanged clips, their
   `.words.json` sidecars, and `.mhsaudio-manifest.json` (per-file text
   fingerprints, keyed relative to the out dir), so the resume check sees them
   as up to date.
3. Export: `node tools/export-lines.cjs ceremony-definition_v6.js > tools/ceremony-lines_v6.txt`
   (27 lines; the parity/lineId guards run as before).
4. Generate into the new folder:
   ```
   mhsaudio generate -in tools/ceremony-lines_v6.txt -voices tools/voices.json \
       -voice-overrides tools/voice-overrides.json \
       -layout babylon-manifest -timestamps -no-cleanup -out assets/audio_v6
   ```
   Expect "files written: 12, up to date: 15". The emitted
   `assets/audio_v6/ceremony_audio.json` will carry `assets/audio/…` paths —
   that is the prefix the player remaps (§2); do not hand-edit it.
5. Sanity: 27 items, every item `durationSec > 0` with words; word counts
   equal the definition's display tokens (the audition page falls back to
   spoken tokens if they ever disagree — a visible tell).
6. Stop and hand Dale `audition_v6.html` (▶ Play new). Re-rolls per the
   established procedure: delete the line's `.mp3` + `.words.json` in
   `assets/audio_v6/`, rerun step 4 (only that line re-bills). Batch auditions
   of alternates under throwaway ids in a scratch folder as before. The old
   `assets/audio/` is never touched.

Delivery watch-list from the new text: "porosity", "watersheds",
"super nutrient", the long `end.award` sentence (Amy). All plain prose —
no dictionary additions expected.

## 7. Release (dist/v0.1.7)

Stage per the CDN rules (`docs`-side memory: patch bump, new immutable
folder, rsync from repo root, curl sweep). Delta vs `dist/v0.1.6` should be
exactly: `ceremony_v5.html` + `lib/player_v5.js` (first shipping of v5 —
the prior version Dale can return to; its only delta from v4 is the full
Restart), `ceremony_v6.html` + `lib/player_v6.js`, `ceremony-definition_v6.js`,
`assets/audio_v6/` (27 mp3 + `ceremony_audio.json`; exclude `*.words.json`
and `.mhsaudio-manifest.json` as for `assets/audio/`), `audition_v6.html`,
`index.html`. After staging, clone the next working pair (v7) so v6 is frozen
as shipped — same convention as v4 → v5.

## 8. Verification before handing over

- `node tests/resolver.test.cjs` green for both definitions.
- Isolated mock on a scratch port (never swap served files): all seven
  profiles through `ceremony_v6.html`, zero console errors; spot-check
  `?profile=partial` shows the new DANI B line and `?profile=boundary` the A
  line at exactly 4.0; `?dev=1` jump to `end.award` and confirm the new first
  sentence karaoke-syncs and still auto-flows into the celebration.
- `ceremony_v5.html?profile=all-high` still plays the v3-script text and the
  old clips (proves the split).
- Launcher chips: Partial shows DANI · B, Boundary all A.

## 9. For the designers (non-blocking; forward if useful)

- **Typo:** Unit 2 Condition B for DANI reads "worked hard toidentify" —
  implemented as "to identify"; please fix the doc.
- **U2.C5 threshold** moved to 4 points. Implemented as raw points (+1 per
  correct placement, −⅓ per incorrect, ≈6 max) per the EA doc's own
  "On-track: 4–6" band — so the happy line now needs the on-track band, where
  before 2 points was enough. Flagging only because it is the one behavioral
  (not wording) change in v4.
- Still open from earlier rounds: U2.C3 composition
  (`docs/designer-question-u2c3.md`) — unaffected by v4.

## 10. Follow-ups outside this repo

- `mhsgrader/docs/updates/ea-scores.md` note 1 says "the ceremony conditions
  on U2.C5 ≥ 2" — update to ≥ 4 when this ships. Grader code is unaffected
  (it supplies raw scores; the ceremony thresholds client-side).
