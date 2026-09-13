# Partial and No-Data Players — Open Design Question (ON HOLD)

> **Status 2026-09-13: ON HOLD.** Dale raised the issues with the designers on
> 2026-09-12 and is waiting for their answers; nothing is to change until
> then. The shipped behaviour (v0.1.7) stands: every profile plays the whole
> show, with missing scores falling to the B variants per the original
> designer decision (script-v2 Q3). This doc records the analysis so the work
> can resume without re-deriving it.

## The problem (Dale, 2026-09-12)

The ceremony walks through every NPC, and each NPC recaps one game unit. A
player who stopped after Unit 3 is nevertheless told about Units 4 and 5 by
Anderson and Aryn. A player with no data at all gets the full show on B
variants, which makes no sense. Both profiles exist on the launcher
(`partial`, `no-data`) and both are realistic in production: a class may end
mid-game, and the grader may not have run yet.

## Direction discussed (not implemented)

### Partial — play only the completed units

- **Completion must be explicit, not inferred from scores.** The scores JSON's
  `currentUnit` is ambiguous (in progress vs finished) and a unit can have
  some checkpoints scored without being finished. Extend the contract with an
  explicit `completedUnits` list from stratahub; the resolver drops any NPC
  unit not in it. Unit 1 has no NPC segment — the intro plays whenever
  anything is complete. Implementation lives in `lib/resolver.js` (pure,
  unit-tested) plus a fixture per case.
- **Continuity breaks in two places.** `u2.thanks` ends "…Tera's been waiting
  to thank you too." — wrong if Unit 3 isn't complete → needs a Unit-2-only
  variant (designer wording + a new voiced line), OR designer approval to cut
  the existing clip after "TK." using its word timings (no new audio). Aryn's
  `u5.handoff` is the only spoken hand-off to Toppo; a Unit-3/Unit-4 finale
  goes straight from Tera's/Anderson's thanks into Toppo's walk-up — the
  walk-up coverage works without a spoken hand-off, so this needs no line.
- **The award is a designer decision.** Toppo's close says "throughout this
  mission" and confers the Planetary Water Steward award. Does a partial
  player receive it, or a "the mission continues" close (new lines)?
- **Star rows for unattempted units.** Erin's Aug-5 rule (unearned = present
  but unfilled) was written for played units; four rows of dark stars for a
  Unit-3 finisher may read as failure rather than "not yet". Possible: dim or
  omit rows for unattempted units — designer call.
- **Edge:** Unit 1 only → intro then nothing. Treat as "nothing completed"
  unless the designers want a one-unit close.

### No Data — two situations hiding under one profile

The endpoint doesn't exist yet (Phase 4/5), so the page can't tell "never
played" from "played, grading not run". The contract should say which
(e.g. `status: "pending" | "ready"`), and each gets its own screen:

- **Grading lag:** holding screen "Your results are being prepared" with an
  automatic retry. Prevents a student ever seeing a hollow ceremony.
- **Nothing completed:** Dale's idea — an image saying no units were
  completed. Mount it on the existing cold-open stage (dark set, company
  mingling, lower-third caption) with a "No mission units completed yet" card
  on the wall screen and no Begin button — looks intentional, costs almost
  nothing (`drawBootTitle`/`drawSlide` already draw wall cards; `setStatus`
  captions the lower-third).
- **Best fix is upstream:** stratahub should not offer the ceremony link
  before Unit 2 is complete; the screen above is the safety net.

## Waiting on the designers

1. Jasper's Unit-2-only thanks wording (or approval to cut after "TK.").
2. Award vs "mission continues" close for partial players.
3. Star rows for unattempted units (dark slots / dimmed / omitted).
4. Copy for the "nothing completed" card (and whether Toppo says anything).

## When work resumes

Contract change (`completedUnits`, `status`) → resolver unit filtering +
tests + new fixtures (`unit3-only`, `unit1-only`, `pending`) → any new lines
through the usual mhsaudio round (Dale auditions) → holding/no-data screens
in the plain player (`ceremony.html` + `lib/player.js`, bump `?v=`) →
launcher cards for the new fixtures → ship as dist/v0.1.8 (then snapshot the
plain pair to `_v7`). Grader brief (`mhsgrader/docs/updates/ea-scores.md`)
gains the two new fields.
