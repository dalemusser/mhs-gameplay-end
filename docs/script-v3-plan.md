# Script v3 Update Plan

*2026-08-05. Sources: `designer-content/End of Game Script v3.md`,
`designer-content/MHS 2.0 Embedded Assessment Working Doc v2.md` (both vendored),
Erin's answers to `docs/designer-requests-v2.md`, and the teammate's follow-up
notes. Supersedes the pending items in `docs/script-v2-plan.md`. These changes
fold into the **still-unpublished v0.2.0** bundle (v0.1.1 remains the live CDN
preview).*

## 1. What the responses resolved

| Item | Resolution | Effect |
|---|---|---|
| Solar-still checkpoint | **U5.C4** (script's "C5" was a typo). EA points reworked for the one-chance build: three ½-point selections (Tilted Out, X for no extra converting, cold glass roof) — **max 1.5**. Script conditions: A `> 0`, B `== 0` | re-key + threshold change; grader brief un-hold |
| Medal/trophy | Toppo now presents a **trophy**; CC0 models offered: opengameart.org/content/trophy and poly.pizza/m/fLy8KmmD1t | new 3D presentation feature (§5) |
| Star system | EA star-band table complete for Units 2–5 (U5: 0–5.99 / 6–8.99 / 9–10.5). Script adds a **star pop-up UI** after the trophy: "Congratulations! You completed the mission." + per-unit star rows, then fade | new contract field + popup UI (§4) |
| Titles | All "title"/"Cadet" references removed: intro opens "TK!", conclusion opens "TK,", award line is "…the Planetary Water Steward award!" | 3 lines re-voiced; award-card subtitle tweak |
| U3.C5 / U4.C6 | Re-confirmed by the teammate | no change (already implemented) |

**Open (asked, not blocking):** the teammate reads U2.C3 as covering the Tera
AND Aryn searches (1.5 each, combined max 3, so C2+C3 max = 4), but the EA doc's
row still says "Find Tera", max 1.5 — and U2.C4 is the watershed glyph, not an
Aryn search, so the doc as written has no Aryn-finding checkpoint. Eric/Erin to
confirm which components U2.C3 aggregates — send-ready ask:
`docs/designer-question-u2c3.md`. **Ceremony logic is unaffected either way**
(the condition sums C2+C3 against 2); only the fixture `max` values and the
grader's banding would change. Implement per the doc (max 1.5) and revisit.

## 2. Definition changes (text/keys)

| Beat | Change | Audio |
|---|---|---|
| `u1.intro` | "Cadet, TK! I want…" → **"TK! I want…"** — drop the `speakText` comma workaround (obsolete with "Cadet" gone). Keep the stability 0.60 override. Watch the bare "TK!" opener in audition — if it garbles like "Hey, TK-" did, the speakText comma tool is ready | regen |
| `u5.still` conditions | key `U5.C5` → **`U5.C4`**; op `>= 1` → **`> 0`** (B is `== 0` = otherwise; missing still falls to B, consistent with the one-chance rework) | none (texts unchanged) |
| `end.skills` | "Cadet. Throughout this mission…" → **"TK, throughout this mission…"** | regen |
| `end.award` | "…award you the title Planetary Water Steward!" → **"…award you the Planetary Water Steward award!"** | regen |
| celebration holo | subtitle "Awarded to Cadet TK — Mission HydroSci" → "Awarded to TK — Mission HydroSci" (card title stays — it's the award's name, not a title reference) | — |

Only 3 lines re-bill; everything else keeps its approved take (the two "Cadet"
sagas are moot — both openers are gone).

## 3. Contract addition — per-unit stars

The popup needs star counts, and the ceremony **cannot compute them**: unit
totals sum ALL of a unit's checkpoints (e.g. Unit 2 = C1–C7), not just the nine
the ceremony receives. Stars are therefore computed upstream and delivered in
the scores JSON:

```json
"stars": { "unit2": 2, "unit3": 3, "unit4": 1, "unit5": 2 }
```

- Values 0–3 (band table implies min 1 star for any played unit; absent key =
  unit unplayed → popup shows that row with zero filled stars).
- Resolver: passes `eaScores.stars` through onto the ending celebration beat
  (`beat.stars`) so the player stays data-driven; tests cover the passthrough.
- Fixtures: every profile gains a `stars` map (all-high 3/3/3/3, all-low
  1/1/1/1, mixed varied, partial omits unit4/unit5 keys, no-data omits all).
- Band table (for the grader): U2 0–8.9/9–12.49/12.5–15 · U3 0–6.9/7–9.9/10–12
  · U4 0–8.4/8.5–12.4/12.5–16 · U5 0–5.99/6–8.99/9–10.5.

## 4. Star pop-up UI (player)

New ending phase between the celebration hold and the fade: a DOM overlay
(game-UI style, not holo) per the script's reference image
(`designer-content/star-popup-reference.png` — filled yellow / dark empty stars):

> **Congratulations! You completed the mission.**
> Topography ★★☆ · Surface Water ★★★ · Ground Water ★☆☆ · Water Cycle ★★☆

- Row labels from the script: Topography, Surface Water, Ground Water, **Water
  Cycle** (script's name for Unit 5, not the EA doc's "Atmospheric Water").
- Sequence: celebration (fanfare + applause + confetti + cheer) → hold → popup
  appears (applause continues underneath) → holds ~8s, Next skips → fade to
  black → Restart. Stars animate in one at a time (small pop) for ceremony feel.
- Restart hides the popup; the `ending` flag machinery extends to a two-phase
  ending (celebrate → stars → fade).

## 5. Trophy presentation (player + asset)

- Fetch and evaluate the two CC0 models (poly.pizza serves GLB directly; check
  the opengameart format/poly count). Pick the better fit, downscale/re-export
  if heavy, stage as `assets/models/trophy.glb` with license noted in a README.
- v1 presentation: the trophy **materializes at center stage** in front of
  Toppo during the celebration — rises from the floor with a slow spin, warm
  spotlight, subtle emissive rim so it reads on Chromebooks. The award card
  stays on the holo behind it. (A hand-off animation into Toppo's hands is out
  of scope — no rig for it.)
- Fallback: if both models disappoint, ship card-only (current behavior) and
  ask the designers to pick/commission; the ending works without it.

## 6. Fixtures / launcher / tests

- `U5.C5` → `U5.C4` everywhere; max 1.5; new values: all-high 1.5, boundary
  **0.5** (smallest passing `> 0` under ½-point granularity), all-low/others 0
  or per pattern; partial omits it.
- `stars` maps per §3; tests: star passthrough to the ending beat, popup data,
  re-keyed conditions, updated beat texts, boundary-still 0.5 → A.
- Launcher chips unchanged (labels/letters identical).

## 7. Grader brief (`mhsgrader/docs/updates/ea-scores.md`)

- **Un-hold the solar still**: checkpoint U5.C4 confirmed; EA scoring is now
  per-selection (3 × ½ pt, max 1.5). Note: the existing `u5p4` rule only
  detects overall success/failure — computing the EA score needs the three
  selection events (the doc lists the correct/incorrect feedback node IDs);
  flag as new detection work, not a metrics passthrough.
- **Add stars**: grader (or the stratahub reader) computes per-unit totals
  across ALL that unit's checkpoints and bands them per §3's table; contract
  gains the `stars` map. (This also serves the dashboard — the teammate is
  updating dashboard grading logic from the same answers.)
- **U2.C3 note**: record the open composition question (Tera-only 1.5 vs
  Tera+Aryn 3.0) and that ceremony logic is agnostic to it.

## 8. Sequencing

1. Definition/key/text changes + fixtures + tests + 3-line voice regen +
   audition (small; do first — restores a fully consistent build).
2. Star popup (player) + contract/fixture stars + resolver passthrough.
3. Trophy asset evaluation + presentation.
4. Grader brief update; mark `docs/designer-requests-v2.md` answered.
5. Full verify (tests + browser incl. ending sequence) → refresh staged
   **v0.2.0** → Dale auditions the 3 new takes + plays the ending → upload.
