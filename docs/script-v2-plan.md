# Script v2 Update Plan (next ceremony version)

> **2026-08-05: superseded for pending items** — the designers delivered
> Script v3 + EA doc v2 answering §6's open questions. Work continues from
> `docs/script-v3-plan.md`; this doc records the v2 implementation as built.

> **Status 2026-08-04: implemented.** Definition rewritten to v2 (20 beats,
> 27 lines incl. variants); player gained highlights holo, ending sequence
> (award card + cheer + confetti + fade-to-black + guarded Restart), startAtMark
> intro staging, and shrink-to-fit slide titles; intro + Unit 5 images staged
> (33 total, 5.5 MB); fixtures/launcher/tests updated (23 green — U3.C5 key,
> 8 conditional sections, boundary ≡ all-high); 17 lines voiced/re-voiced,
> 3 demo clips pruned, manifest 27/27 with exact word parity; grader brief
> updated (U3.C5 resolved, U5.C3 added, solar still on hold). Browser-verified:
> startAtMark immediate delivery, highlight build, award/fade/Restart, all-high
> resolution, launcher 7×8 chips. **Awaiting: Dale's audition of the 17
> new/changed clips, then upload of the staged bundle to
> `s3://adroit-cdn/mhs/end/v0.2.0/`.**

*2026-08-04. Source: `designer-content/End of Game Script v2.md` + the designers'
answers to `docs/designer-questions.md`. Target release: **v0.2.0** on the CDN
(minor bump — content drop, per the version convention in the implementation plan).*

## 1. What the designers resolved

| Question | Answer | Effect |
|---|---|---|
| Q1 garden checkpoint | **U3.C5** (script's "C4" was a typo, doc corrected) | re-key definition, fixtures, tests, grader brief |
| Q2 combined threshold | Sum of U2.C2+U2.C3 vs 2, confirmed (Eric may double-check) | none — already implemented as sum |
| Q3 missing scores | Condition B on missing info, confirmed. **A/B standardized: A is always best-case, B generic. B's emotion is now `neutral` (not "slightly sad")** so it also fits students who never attempted | swap two sections' A/B ids; replace `slightly-sad` with `neutral` everywhere |
| Q4 bookends | Real intro, Unit 5 (Aryn), and conclusion delivered in v2 (with pending sub-items, §6) | replace all three demo placeholders |
| Q5 U4.C6 wording | Same task; script wording aligned to EA doc ("camera placements") | none |

## 2. Definition diff (section by section)

Legend: **regen** = text new/changed → mhsaudio regenerates that clip (incremental);
**keep** = existing clip stays valid. Emotion changes alone never touch audio
(v2 voices; emotion tags aren't applied).

| Section | Change | Audio |
|---|---|---|
| intro (`u1.intro`, replaces `demo.intro`) | NEW real text ("Cadet TK! I want to personally congratulate…"); images: CopernicusSpaceShipImage, WAT247 (§5) | regen |
| `u2.crash` | "After" → "after" (case only; keep faithful) | regen |
| `u2.find-team.a` | unchanged | keep |
| `u2.find-team.b` | emotion slightly-sad → neutral | keep |
| `u2.dani` | **A/B ids swap** (A = happy now). `.a` = "**After** DANI's… restored it faster than expected…" (text changed); `.b` = neutral, text = old `.a` text | both regen (id↔text pairing changed) |
| `u2.water` | **A/B ids swap**. `.a` = "**One of your biggest decisions was** evaluating… and selecting…!"; `.b` = neutral, "One of your biggest decisions was evaluating… Even though it took a few tries…" | both regen |
| `u2.thanks` | unchanged | keep |
| `u3.crates.a` | unchanged | keep |
| `u3.crates.b` | emotion → neutral | keep |
| `u3.pollution` | unchanged | keep |
| `u3.garden` | key **U3.C4 → U3.C5**; `.a` "you **figured out** the best places…"; `.b` neutral, "you **worked to help us** identify…" | both regen |
| `u3.thanks` | unchanged | keep |
| `u4.well`, `u4.flood` | unchanged | keep |
| `u4.soil.a` | "Because of you**,** we have…" (comma) | regen |
| `u4.soil.b` | neutral, "You even **worked with me to** help identify…" | regen |
| `u4.thanks` | unchanged | keep |
| unit 5 (NEW, replaces `demo.unit5.aryn`) | `u5.plant.a/.b` (U5.C3 > 0 / == 0), `u5.still.a/.b` (U5.C5 ≥ 1 / < 1, **provisional** §6), `u5.handoff` ("I think Captain Toppo has one final thing to show you.") — Condition-A/B image sets differ for the still (after vs before) | 5 regen |
| conclusion (NEW, replaces `demo.finale` + standalone celebration) | `end.skills` ("Cadet. Throughout this mission…"), `end.award` ("Most importantly… I hereby award you the title Planetary Water Steward!") + highlights holo + medal moment + cheer + fade to black (§4) | 2 regen |
| `demo.intro`, `demo.unit5.aryn`, `demo.finale` | deleted | prune old clips (`-prune`) |

Net: ~16 lines regenerate, ~10 keep their clips. New beat count: 1 intro + 5 U2 +
4 U3 + 4 U4 + 5 U5 + 2 conclusion + 1 end-celebration ≈ 22.

Known voice-risk: `end.skills` opens with "Cadet." — the period variant auditioned
fine during the v0.1.1 fixes, but listen for the "Cadet" pronunciation drift on
every regeneration (fallback: pronunciation-dictionary alias).

## 3. Contract surface changes (checkpoints)

- Rename `U3.C4` → `U3.C5` everywhere (definition, all 7 fixtures, tests,
  `mhsgrader/docs/updates/ea-scores.md`).
- Add **U5.C3** (EA: "Argumentation: What happened to the water?", 3/2/1/0 by
  attempts; script condition `> 0`) and **U5.C5 (provisional)** (solar still;
  script condition `≥ 1`) to fixtures, launcher chips, and tests.
  - Boundary profile: U5.C3 = smallest passing value (1); U5.C5 = 1.
  - Partial profile (through U3): both U5 items absent → B variants.
- Update the grader brief (`ea-scores.md`): mark U3.C5 resolved; add the two U5
  rows. Tentative crosswalk (verify at implementation): U5.C3 ↔ `u5p3.go`
  ("What Happened Here?" — counts negative dialogues); solar still ↔ `u5p4.go`
  ("Water Problems Require Water Solutions" — success + zero tolerance, which
  already matches the one-chance rebuild; see §6.1).

## 4. New player capabilities

1. **Highlights holo** — `holo: { highlights: ['Investigated evidence', …] }`:
   a procedural slide where bullet items materialize one at a time (same shader
   treatment), paced across the beat's line like image slides. Used by `end.award`
   (script shows the five highlights building before/while Toppo's final lines).
2. **Ending sequence** — after `end.award`: NPCs clap/cheer (existing celebration
   machinery), confetti, an award title-card on the holo ("PLANETARY WATER
   STEWARD"), then **fade to black** with a Restart affordance. The scripted
   *medal presentation* has no asset — v0.2.0 ships the award card; medal
   image/3D is an open asset request (§6.5).
3. **Intro staging** — script says Toppo "stands at front of stage" for the intro
   (vs. walking out): spawn the MC at the speak mark, state `speak`, for beat 0;
   he walks home when Jasper is called up. Conclusion keeps the normal walk-out.
4. Emotion mapping needs no new work (`neutral` preset exists; `slightly-sad`
   becomes unused — leave the preset in place for future scripts).

## 5. Assets

- **Unit 5 screenshots** (5 files, already in `designer-content/Screenshots/Unit 5/`):
  stage → `assets/holo/unit5/` as 1280px JPEGs like the others. Filename drift to
  normalize: local files use `Aryn_s plant….png` where the script says
  `Aryn's plant….png` — same images (underscore-for-apostrophe), keep the local
  names and reference them in the definition.
- **Intro images**: ~~missing locally~~ **received 2026-08-04** in
  `Screenshots/Intro- Unit 1/` (CopernicusSpaceShipImage.png, WAT247.png) —
  stage → `assets/holo/unit1/` like the others.

## 6. Pending designer items (tracked; none block v0.2.0)

> **2026-08-04:** re-verified against the designers' current EA doc (now vendored
> at `designer-content/MHS 2.0 Embedded Assessment Working Doc.md`): U5.C5 still
> does not exist — solar still is still U5.C4 with pre-rework retry points — and
> the dashboard star table has empty Unit 5/6 rows. The asks below are compiled
> send-ready in `docs/designer-requests-v2.md`. Item 6 (intro images) is resolved.

1. **Solar-still EA rework** — the EA doc's solar still is **U5.C4** (2/1/0 by
   attempts, assumes retries) but the current game gives ONE chance; Wenyi/Eric
   will fix the points, then the script updates. Note the script references
   "U5.C5", which doesn't exist in the EA doc today — the checkpoint **key and
   threshold are both provisional**. v0.2.0 implements the script as written
   (`U5.C5 ≥ 1`); re-key/re-band in one place each (definition + fixtures +
   brief) when the docs settle. The grader's `u5p4` zero-tolerance rule already
   matches the one-chance build.
2. **Star system in the outro** — Eric to design; current outro text is
   placeholder for it. Expect an `end.award` text/beat change later.
3. **Titles** — "Planetary Water Steward" (and any in-game title references)
   pending Joshua; textHash diffing makes the eventual change a one-line edit +
   single-clip regen.
4. **Eric's double-check** on the C2+C3 sum reading.
5. **Medal asset** (image or model) for the ending — or designer sign-off on the
   award-card approach.
6. **Intro images** delivered into `Screenshots/` (§5).

## 7. Work sequence

1. Rewrite `ceremony-definition.js` to v2 (structure, texts, keys, ids, emotions,
   highlights/ending beats) + update fixtures, launcher labels, tests.
2. Player: highlights slide type, ending sequence (award card + cheer + fade),
   intro staging. Resolver needs no changes.
3. Stage Unit 5 images (+ intro images if available).
4. `node tools/export-lines.cjs > tools/ceremony-lines.txt` →
   `mhsaudio generate … -no-cleanup -prune` (incremental; ~16 lines re-billed) →
   audition pass on new/changed clips (especially both "Cadet…" openers).
5. Update `mhsgrader/docs/updates/ea-scores.md` (§3).
6. Tests + local browser pass on all 7 profiles → stage → upload
   `s3://adroit-cdn/mhs/end/v0.2.0/` → full-bundle live sweep.
