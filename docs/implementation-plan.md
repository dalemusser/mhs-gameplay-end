# End-of-Game Experience — Implementation Plan

*Drafted 2026-08-03. Decisions confirmed with Dale: stratahub-hosted page + CDN assets;
client-side condition resolution; EA scores computed in mhsgrader; voice audio generated now.*

## 1. Architecture at a Glance

```
Unity game ──ends──▶ window.mhsEndGame()
                        │  (play page, stratahub)
                        ▼
        GET /missionhydrosci/ceremony            ← session-authenticated page (stratahub feature)
                        │
                        ├──▶ GET /missionhydrosci/api/ea-scores   ← member's own EA scores (JSON)
                        │        (stratahub reads mhsgrader.progress_point_grades server-side)
                        │
                        └──▶ MHS CDN (CloudFront/S3)              ← GLBs, voice clips, screenshot
                                                                     images, JS bundle
   Ceremony page (browser):
     script definition + resolver (JS)  +  EA scores  ──▶  linear beats[]  ──▶  Babylon player
```

Division of responsibility:

| Component | Responsibility |
|---|---|
| **mhsgrader** | Computes EA checkpoint scores (`U2.C2`-style points) at grade time; stores them in the grade docs. One grading brain. |
| **stratahub** | Serves the ceremony page (session auth, same gate pattern as the play page); exposes a small JSON endpoint returning the signed-in member's own EA scores. No secrets ever reach the browser. |
| **Ceremony front-end** (this repo) | Script definition (transcribed designer script), condition resolver (pure JS), Babylon player (walk/speak/holo — largely exists in `ceremony.html`). |
| **Test harness** (this repo) | Launcher page listing fixture student profiles; clicking one runs the identical ceremony code against a fixture score JSON instead of the API. |
| **mhsaudiotools** | Batch-generates ElevenLabs clips + word timings for every line variant, keyed by stable line ID. |

The pivotal design property: **the resolver consumes the same EA-scores JSON whether it
came from a fixture file or the stratahub endpoint.** Test and production share one code path.

## 2. Data Contracts (freeze these first)

### 2.1 EA scores (`GET /missionhydrosci/api/ea-scores` and fixture files)

```json
{
  "game": "mhs",
  "user_id": "665f1a2b3c4d5e6f7a8b9c0d",
  "generatedAt": "2026-08-03T12:00:00Z",
  "currentUnit": "unit5",
  "items": {
    "U2.C2": { "score": 1.0, "max": 1.0 },
    "U2.C3": { "score": 0.5, "max": 1.5 },
    "U2.C5": { "score": 4.3, "max": 7.0 },
    "U2.C7": { "score": 2.0, "max": 3.0 },
    "U3.C1": { "score": 3.0, "max": 3.0 },
    "U3.C4": { "score": 2.0, "max": 3.0 },
    "U4.C6": { "score": 3.0, "max": 3.0 }
  }
}
```

- Key = EA checkpoint ID exactly as the designer script references it.
- An item **absent** from `items` = never attempted / not yet graded. The resolver must
  handle this explicitly (see open question Q3).
- Scores are numeric (halves and thirds occur in the EA rubric), `max` included so the
  UI could later show proportions without re-reading the rubric.

### 2.2 Script definition (replaces the linear `CEREMONY_SCRIPT`)

The current `window.CEREMONY_SCRIPT` (flat `beats[]`) becomes the *output* of resolution,
not the authored artifact. The authored artifact is a definition organized the way the
designers write it — units → sections → variants:

```js
window.CEREMONY_DEFINITION = {
  layout: { mc: 'Toppo', group: ['Jasper', 'Anderson', 'Aryn', 'Tera'] },
  intro: [ /* beats — Toppo welcome (placeholder until designers deliver) */ ],
  units: [
    {
      id: 'unit2', speaker: 'Jasper',
      sections: [
        { id: 'u2.crash', always: {
            text: "TK, After the Copernicus crash-landed…",
            expression: 'happy',
            holo: null } },
        { id: 'u2.find-team',
          conditions: [
            { when: { sum: ['U2.C2', 'U2.C3'], op: '>=', value: 2 },
              beat: { lineId: 'u2.find-team.a', expression: 'happy',
                      text: "but you found our missing team members quickly…",
                      holo: { images: ['unit2/Find Toppo.png', 'unit2/Find Tera.png',
                                       'unit2/Find Aryn.png', 'unit2/Find Team.png'] } } },
            { otherwise: true,
              beat: { lineId: 'u2.find-team.b', expression: 'slightly-sad',
                      text: "but you found the missing team members…",
                      holo: { images: [/* same list */] } } }
          ] },
        // … u2.dani (U2.C5), u2.water-source (U2.C7), u2.thanks (always)
      ]
    },
    // unit3 (Tera), unit4 (Anderson), unit5 (Aryn — script TBD)
  ],
  celebration: { /* confetti beat (placeholder until designers deliver) */ },
  finale: [ /* Toppo signoff (placeholder) */ ],
};
```

- **Conditions are declarative objects** (`{ sum|item, op, value }`), not code strings —
  trivially testable, serializable, and safe.
- **`lineId` is the stable key** joining a line to its voice clip and word timings. It
  survives beat reordering (the old manifest was keyed by beat index, which breaks the
  moment conditional variants exist).
- The resolver is a pure function: `resolve(definition, eaScores) → beats[]` in the
  existing player schema (`speaker/text/expression/holo/advance`). The Babylon player
  keeps performing a linear script exactly as it does today.

### 2.3 Audio manifest (`ceremony_audio.json` v2)

```json
{
  "items": {
    "u2.find-team.a": {
      "audio": "assets/audio/u2.find-team.a.mp3",
      "durationSec": 6.2,
      "words": [[0.0, "but"], [0.18, "you"], …],
      "textHash": "sha1-of-line-text"
    }
  }
}
```

`textHash` lets the generation tool detect which lines changed since the last ElevenLabs
run and regenerate only those (script is still evolving; regeneration churn is expected).

## 3. Workstreams

### Phase 0 — Designer clarifications (blocking for content, not for engineering)

Send to the designers now; everything else can proceed against provisional answers:

1. **U3.C4 numbering.** The script conditions garden plots on "U3.C4", but the EA
   working doc says U3.C4 = "Glyph: Dissolved Particles" and U3.C**5** = "Plant
   Superfruit Seeds." The semantics and threshold ("3 correct plots") match the
   grader's u3p5 rule. Which ID is authoritative?
2. **Combined threshold.** "EA score of ≥ 2 points on U2.C2 and U2.C3" — U2.C2 maxes
   at 1 pt and U2.C3 at 1.5, so ≥2 is only reachable as the **sum** (≥2 of 2.5).
   Confirm sum is intended (plan assumes yes).
3. **Missing scores.** If a student never attempted an item (skipped content, grader
   lag), which variant plays? Proposal: Condition B (the gentler line), since both
   variants assert the activity happened; confirm, or supply neutral fallback lines.
4. **Missing bookends.** No Toppo intro, celebration beat, Unit 5 (Aryn — the
   screenshots exist), or finale in the script yet. The demo script's versions will be
   used as placeholders until delivered.
5. **U4.C6 wording.** EA doc says "3 cameras," script says "soil locations" — grader
   u4p6 logs `cameraPlaced` with a `soilType`, so these appear to be the same task.
   Confirm.

**Resolved (Dale, 2026-08-03) — image lists.** The filenames referenced in the script
are authoritative; the files themselves come from `designer-content/Screenshots/`.
Verified: all 26 referenced images exist in the folder. Two resolve via a
trailing-space filename typo ("U3 Garden Task Correct Updated .png",
"U3 Garden Task Incorrect Updated .png") — treat as typos (rename when staging assets).
Unreferenced extras (U3 Garden Box1/2/3, empty `OLD/`) are ignored. Unit 5 images await
the Unit 5 script (question 4).

### Phase 1 — Ceremony engine rework (this repo, no external dependencies)

1. Split the `ceremony.html` monolith: `lib/player.js` (Babylon scene, characters,
   walking, holo — existing code), `lib/resolver.js` (new, pure), `ceremony.html`
   (bootstrapping + data loading).
2. Author `ceremony-definition.js` transcribing the designer script (Units 2–4 now;
   demo-script placeholders for intro/celebration/finale; Unit 5 slot ready).
3. **Holo image slides.** Replace/augment the procedural title-card `DynamicTexture`
   with screenshot textures: preload each beat's images, cross-fade through multi-image
   lists paced across the line's duration. Keep the materialize wipe and scanline shader.
4. **`slightly-sad` expression.** Map to a new EXPR preset + `TalkSad` delivery clip
   (`MOOD_CLIP` already has a sad entry; `EXPR` needs one).
5. Resolver unit tests (plain Node script or test page): every condition in the script,
   boundary values (exactly 2.0), missing items, empty scores.

Exit criterion: full ceremony plays end-to-end from a hardcoded fixture.

> **Status 2026-08-03: Phase 1 complete.** Split landed (`lib/player.js`,
> `lib/resolver.js`, slim `ceremony.html`); Units 2–4 transcribed into
> `ceremony-definition.js` (17 beats, demo placeholders for intro/Unit 5/celebration/
> finale); holo image slides implemented (script screenshots staged to `assets/holo/`
> as 1280px JPEGs, 4.5 MB total, crossfade paced across each line); `slightly-sad`
> expression added; 17 resolver tests green; browser-verified with the
> `?profile=all-high` / `all-low` fixtures in `test-profiles/` (Phase 2 got a head
> start: fixtures + `?profile=` wiring exist; the launcher page and remaining
> profiles are still to do). Voice clips remain index-keyed demo bookends only
> (`beat.audioIndex`) until Phase 3.

### Phase 2 — Test harness (this repo)

1. `index.html` launcher: cards for fixture profiles — **All High**, **All Low**,
   **Mixed A**, **Mixed B**, **Boundary** (every score exactly at threshold),
   **Partial** (played through Unit 3 only), **No Data**.
2. `test-profiles/*.json` matching the §2.1 contract byte-for-byte.
3. `ceremony.html?profile=all-high` → fetch fixture; no param → fetch
   `/missionhydrosci/api/ea-scores` (production mode). Nothing else differs.
4. Runs under any static server (`python3 -m http.server`), as the prototype does today.

Exit criterion: clicking each profile visibly changes lines/images per the script.

> **Status 2026-08-03: Phase 2 complete.** `index.html` launcher with seven profile
> cards (All High, All Low, Mixed A/B, Boundary, Partial, No Data) — each card's
> variant chips are computed live by the real resolver, so the card shows exactly
> which A/B lines that profile will play. All seven fixtures in `test-profiles/`
> match the §2.1 contract; 22 resolver tests pin each fixture's expected variants
> (boundary ≡ all-high, no-data ≡ empty). Browser-verified: launcher renders, chips
> correct, card click-through resolves the right variants. Next demo-able milestone
> reached — ready for the Phase 2.5 CDN preview whenever we want to share it.

### Phase 2.5 — Shared CDN preview (before any stratahub work)

The Phase 1–3 build is 100% static (page, JS, script definition, images, GLBs, audio,
fixture JSONs) — no server logic — so it can be shared from the existing MHS
CloudFront/S3 CDN long before stratahub integration. The preview exercises exactly the
production code path; only the score source differs (fixture JSON vs. API).

1. **Upload** the bundle to the MHS S3 bucket under a versioned prefix
   (`mhs/ceremony-preview/v1/`, `v2/`, …) reachable via `mhs_cdn_base_url`. A fresh
   prefix per iteration sidesteps CloudFront cache invalidation — each shared link
   always shows exactly that build. (Same versioned-prefix habit production assets
   will use in Phase 5.)
2. **Public-URL rule:** the preview path is public to anyone with the link. Fixture
   profiles only — fictional students, made-up scores; never real `user_id`s or
   grade data.
3. **Review loop** against the launcher's profile sweep:
   - Designers click through all profiles (All High/Low, Mixed, Boundary, Partial,
     No Data) and give feedback on lines, images, pacing, expressions.
   - Voice takes reviewed here too; a line edit regenerates only that clip
     (`textHash` diffing) and ships in the next prefix.
   - **Chromebook device testing** on actual classroom hardware via the shared URL —
     load time and frame rate on ~46 MB of GLBs is the riskiest unknown.
4. External CDN dependencies (Babylon.js, env textures) work as-is from the preview;
   vendoring them into the bundle is deferred to the Chromebook/offline work (Phase 6).

Exit criterion: designer sign-off on content + acceptable Chromebook performance —
the go signal for Phases 4–5.

> **Status 2026-08-03: v0.1.0 live.** Preview URL:
> `https://cdn.adroit.games/mhs/end/v0.1.0/index.html` (bucket `adroit-cdn`,
> uploaded by Dale). Layout decision: the end experience lives at
> `/mhs/end/vX.Y.Z/` matching the units' version-folder convention (`/mhs/unitN/
> vX.Y.Z/`) so it can later join the same collection-pinning/precache machinery;
> `0.x` = preview line, `v1.0.0` reserved for the first student-facing build;
> never re-upload into an existing version folder — every change mints a new one.
> The runtime bundle is 74 files / ~52 MB (staging excludes designer-content,
> docs, tools, tests, and mhsaudio regeneration state). Verified live end-to-end:
> launcher chips, profile click-through, voice clips streaming (206 range
> requests). Gotcha for future uploads: S3 returns 403 (not 404) for missing
> keys — v0.1.0 initially missed the two root files besides index.html
> (ceremony.html, ceremony-definition.js), which broke every profile card until
> they were added.
>
> **v0.1.1 (2026-08-03, current):** audio-review fixes after Dale auditioned the
> clips — u4.well re-rolled (bad "TK" take), demo.intro re-rolled several times
> and its text changed from "Cadet — you made it" to "Cadet, you made it": an
> opening vocative + em-dash made the voice clip/glide the word ("Cadeta",
> "Kahdet"); mid-sentence em-dashes are fine. If "Cadet" drifts again on a future
> regeneration, the deterministic fix is a pronunciation-dictionary alias rule.
> Full-bundle sweep verified; manifest carries the comma-version intro.

### Phase 3 — Voice audio (parallel with 1–2; decision: generate now)

1. Assign `lineId`s to every line variant in the definition (both A and B variants —
   the conditional structure roughly doubles line count vs. the demo).
2. Export a lines manifest (`lineId`, speaker, text, mood) for **mhsaudiotools**;
   batch-generate ElevenLabs clips + word timings; emit the §2.3 manifest.
3. Wire the player's audio lookup from beat-index to `lineId`.
4. Regeneration workflow: `textHash` diffing so script edits only re-bill changed lines.

> **Status 2026-08-03: Phase 3 complete.** All 22 lines (every A/B variant + the
> demo bookends) voiced via the mhsaudio CLI (built from mhsaudiotools; voices
> imported from the team's VoiceAssignments.csv — Toppo→Amy, Tera→Hannah,
> Anderson→Gwen, Aryn→Haseeb, Jasper→Ian). Pipeline:
> `node tools/export-lines.cjs > tools/ceremony-lines.txt`, then
> `mhsaudio generate -in tools/ceremony-lines.txt -voices tools/voices.json
> -layout babylon-manifest -timestamps -no-cleanup -out assets/audio`.
> `-no-cleanup` is required — cleanup stripped em-dashes / split hyphenated words,
> desyncing karaoke token counts on 3 lines; without it all 22 match exactly.
> Manifest re-keyed by lineId (player lookup is `LINE_AUDIO[beat.lineId]`), old
> index-keyed demo mp3s deleted, `audioIndex` mechanism removed. Regeneration is
> incremental via mhsaudio's own resume manifest (verified: the -no-cleanup rerun
> re-billed only 3 of 22 lines). 23 tests green incl. manifest coverage of every
> variant; browser-verified clips fetch per beat. Audio total: 3.2 MB.

### Phase 4 — mhsgrader EA extension (decision: grader computes EA scores)

1. **Crosswalk doc** (in mhsgrader `docs/`): EA checkpoint ↔ grader rule ↔ banding
   formula, sourced from the EA working doc
   (`mhscurriculum/docs/curriculum/Game Wide Docs/MHS 2.0 Embedded Assessment Working Doc.md`).
   For the ceremony's seven items: U2.C5, U3.C1, U3.C4(→u3p5), U4.C6 already store a
   usable `score`/`count` metric; **U2.C2, U2.C3, U2.C7 store only `mistakeCount`** and
   need the EA banding applied (e.g. U2.C2: ≤1 triggers → 1 pt, 2 → ½, >2 → 0).
2. Extend rule output: an `eaScores` map on `UserGrades` (or per-`Grade` field)
   `{"U2.C2": {"score": 1.0, "max": 1.0}}`, written alongside existing status/metrics.
   No JSON tags needed — BSON-only, read by stratahub like the rest of the doc.
3. **Backfill**: a reprocess command that re-runs rules over historical `logdata`
   (grader is a cursor-driven poll daemon; backfill = reset cursor scoped per-user or
   recompute-in-place). DocumentDB constraints apply (no `$facet`; compound-sort
   indexes as needed).
4. Later units: EA doc defines 23 checkpoints; only the ceremony's items are required
   initially, but the mechanism should be general.

### Phase 5 — stratahub integration

1. **Feature**: extend `internal/app/features/missionhydrosci/` (ceremony is part of
   the MHS app, not a separate feature) following the standard checklist:
   - `GET /missionhydrosci/ceremony` — serves the page. `RequireSignedIn` +
     `RequireApp("missionhydrosci")`, same gates as `/play/{unit}`.
   - `GET /missionhydrosci/api/ea-scores` — reads `mhsgrader.progress_point_grades`
     for the **session's own user_id** (pattern: `mhsdashboard/summary.go
     loadPlayerGrades`, but member-facing and self-only). Returns §2.1 JSON.
     No tokens in the page; the browser authenticates with its session cookie
     (`/api/`-style subdomain exemption if needed).
2. **Entry point**: change `window.mhsEndGame()` in `missionhydrosci_play.gohtml`
   (currently redirects to `/missionhydrosci/units`) to redirect to
   `/missionhydrosci/ceremony`.
3. **Assets to CDN**: upload GLBs, audio, screenshot images, and the JS bundle under a
   versioned prefix (`mhs/ceremony/v1/…`) in the existing MHS S3 bucket, referenced
   via `mhs_cdn_base_url`. Versioned paths replace the prototype's `?v=` cache-busters.
4. **Pending-grade state**: if the score fetch returns incomplete data (grader lag),
   show a brief "compiling mission records…" hold + retry; on persistent absence, fall
   back per the Phase-0 Q3 answer. Never block the celebration on grading.
5. **QA hook**: mount the Phase-2 profile launcher behind a leader/admin-gated route
   (e.g. `/missionhydrosci/ceremony/test`) so QA can preview all variants in production
   without fabricating grade data.

### Phase 6 — Polish & rollout

- Replay: ceremony should be revisitable from the units page after completion.
- Chromebook load: ~46 MB of GLBs over CDN; evaluate meshopt/Draco compression and
  (later) PWA precache via the mhs-chromebook-distribution design.
- Accessibility pass: captions are inherent (speech bubble), verify contrast/font size,
  add a skip control.
- Analytics: log ceremony start/complete + resolved variant set to stratalog for
  research (which conditions students actually hit).

## 4. Sequencing & Dependencies

```
Phase 0 (designer Qs)   ──answers──▶ content finalization (any time)
Phase 1 (engine)        ──▶ Phase 2 (harness) ──▶ demo-able milestone ★
Phase 2.5 (CDN preview) ──▶ shared review/refine loop; iterate with 1–3 until sign-off
Phase 3 (audio)         ──parallel with 1–2 (needs lineIds from 1.2)
Phase 4 (grader EA)     ──independent; needs only the §2.1 contract
Phase 5 (stratahub)     ──needs contract; gated on Phase 2.5 sign-off; page/route can
                           ship before Phase 4 lands (endpoint returns partial items
                           gracefully)
Phase 6                 ──last
```

Phases 1–3 are fully local to this repo and produce a clickable, voiced, conditional
ceremony via the test harness — visible progress with zero production risk. Phase 2.5
puts that build on the public MHS CDN for shared review and Chromebook testing, and
the team iterates there until content sign-off. Phase 4 can start in parallel any time
since the §2.1 contract is what it builds against; Phase 5 waits for preview sign-off.

## 5. Risks

| Risk | Mitigation |
|---|---|
| Designer script incomplete (Unit 5, intro/finale) | Placeholder beats from the demo script; definition structure has slots ready. |
| EA numbering drift (U3.C4/C5) | Phase-0 Q1; crosswalk doc is the single source of truth once written. |
| Grader metrics insufficient for some EA bands | Identified precisely (U2.C2/C3/C7); banding formulas exist in the EA doc. |
| Audio regeneration cost as script evolves | `textHash` diffing; only changed lines re-billed. |
| Grading lag at ceremony time | Pending-grade hold + graceful fallback (Phase-0 Q3). |
| Chromebook performance/load | Existing prototype already tuned (small shadow maps); CDN + compression + precache path planned. |
