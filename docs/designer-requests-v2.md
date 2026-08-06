# End-of-Game Script v2 — Requests for the Design Team

> **ANSWERED 2026-08-05** (Erin + team follow-up): solar still = U5.C4 with
> reworked one-chance points; CC0 trophy models offered; star bands completed
> and the star pop-up added to the script; title references removed. One item
> remains open: which searches U2.C3 aggregates (Tera only vs Tera+Aryn) —
> ceremony logic is unaffected. Consequences and the change plan:
> `docs/script-v3-plan.md`. Kept for reference.

*2026-08-04. Follow-ups after reviewing "End of Game Script v2.md" and the current
"MHS 2.0 Embedded Assessment Working Doc.md" (both in designer-content/). Each item
shows the technical note first, then a plain-language version to send.*

---

1. **Solar-still checkpoint ID and points.** The v2 script conditions the
   solar-still lines on **U5.C5**, but the current EA doc has no U5.C5 — Unit 5
   runs U5.C1–C4, and the solar still is **U5.C4**, still with the retry-based
   points (2 pts first attempt / 1 pt 2–3 attempts / 0 otherwise) that predate
   the one-chance rebuild. Need: (a) the checkpoint's final ID, (b) the revised
   point values, (c) the ceremony threshold for Aryn's happy variant (script
   currently says ≥ 1). FYI: the grader's rule for this activity (u5p4) is
   already success-with-zero-tolerance, matching the one-chance build.

The script's solar-still lines are keyed to "U5.C5", but the assessment document
doesn't have a U5.C5 — the Solar Still Activity is listed there as U5.C4, and its
point values still assume players get multiple attempts. We know the point revision
for the one-chance version is in progress. When that lands, could you tell us three
things: which ID the solar-still checkpoint will finally use (C4 or C5), what the
new point values are, and what score should earn Aryn's more enthusiastic line
(the script currently says 1 point or more)? Until then we'll implement it exactly
as the script reads, so it's a small switch once you confirm.

---

2. **Medal asset for the finale.** The script ends with "Toppo presents players
   with a medal." No medal image/model exists in the delivered assets. v0.2.0
   will show a holographic "PLANETARY WATER STEWARD" award card during the
   clap/cheer + fade-out instead.

The conclusion says Toppo presents the player with a medal, but we don't have a
medal image or 3D asset. For the next build we'll celebrate the moment with a big
holographic award card ("Planetary Water Steward") plus the team clapping,
cheering, and confetti, then fade to black. If you'd like an actual medal shown —
on the holo screen or handed over in 3D — send us the artwork and we'll work it
in; otherwise let us know if the award card treatment works for you.

---

3. **Star bands for Unit 5 (and 6).** The EA doc's "Unit Summary Scores for
   Dashboard" star table defines 1/2/3-star point bands for Units 2–4 but the
   Unit 5 and 6 rows are empty. If the outro's star system (Eric) draws on these,
   we'll need those bands — and the outro placeholder text replaced.

Heads-up for whenever the star system gets designed into the outro: the star
table in the assessment document currently has point ranges for Units 2–4 only —
the Unit 5 and 6 rows are blank. When Eric works out how stars appear in the
ending, we'll need those missing ranges too (or confirmation that stars only
cover Units 2–4), along with the final outro wording where the placeholder text
sits now.

---

4. **U2.C5 scoring form (low priority, affects grading more than dialog).** The
   EA doc's U2.C5 row is internally inconsistent: the points column says raw
   "+1 per correct, −⅓ per incorrect" while the formula column describes a
   proportional version (correct/total − 0.33·incorrect/total). The game's
   grader computes the raw form, and the script's "≥ 2 on U2.C5" only makes
   sense against the raw form. Confirm raw is authoritative, and what the
   intended max is (the doc says "need 6 correct for completion").

One small inconsistency to flag in the assessment document itself: for U2.C5
(classifying argument components), the "points" column describes a simple
running score (+1 per correct placement, −⅓ per incorrect), but the "formula"
column describes a percentage-style calculation instead. The game currently
scores it the simple way, and Jasper's dialog threshold (2 or more points) only
works with the simple way — so we plan to treat that as the official version.
Could you confirm, and correct whichever column is wrong so the document and
the game agree?

---

## Already resolved / awaiting — no new ask needed

- **Intro images** (CopernicusSpaceShipImage.png, WAT247.png): received in
  `Screenshots/Intro- Unit 1/` — thank you, nothing further needed.
- **Unit 5 image filenames**: the script says "Aryn's plant…" while the files are
  "Aryn_s plant…" (underscore for apostrophe) — treated as the same images per
  the established rule; no action needed.
- **Titles** ("Planetary Water Steward" etc.): awaiting Joshua's verification —
  a wording change later is a one-line edit + single-clip voice regeneration.
- **U2.C2 + U2.C3 combined threshold**: awaiting Eric's double-check; implemented
  as the sum meanwhile.
