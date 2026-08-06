# End-of-Game Script — Open Question: U2.C3 Composition

*2026-08-05. One clarification needed to finish the Unit 2 scoring behind
Jasper's "found our missing team members" line. Technical note first, then a
plain-language version to send.*

---

**U2.C3 composition and the combined threshold.** The end-of-game condition
sums U2.C2 + U2.C3 against a 2-point threshold. Two interpretations of U2.C3
are now in circulation and they disagree with each other:

- The **EA doc (v2)** row for U2.C3 is titled "Find Tera" with banding
  1½ / 1 / ½ / 0 by help-dialog triggers — **max 1.5** — making the combined
  C2+C3 maximum **2.5**, so the 2-point threshold demands a near-perfect
  performance (80%).
- The **teammate's gameplay reading** is that U2.C3 covers the later searches
  for **both Tera and Aryn**, each worth up to 1.5 — max **3** — making the
  combined maximum **4**, so the same 2-point threshold is a much more
  attainable bar (50%).

The doc as written has no Aryn-finding checkpoint anywhere: U2.C4 is the
Watershed Size/Flow Rate glyph activity. Needed to implement the grading:
(a) does U2.C3 score the Tera search only, or Tera + Aryn aggregated?
(b) if it aggregates, the per-search banding and confirmed max (3?); and
(c) confirmation that the 2-point threshold is intended against whichever
maximum results — the same number is a strict bar out of 2.5 and a lenient one
out of 4. If Aryn's search should be scored, the EA doc needs its row (or an
updated U2.C3 banding) so the document and the grader agree.

The ceremony itself is agnostic — it just sums the two scores it receives and
compares to 2 — so this only affects the grading implementation and how strict
Jasper's happier line effectively is.

---

There's one loose end on Unit 2 scoring we'd like to close. Jasper's warmer
"you found our missing team members quickly" line plays when the player earns
at least 2 points across the team-finding tasks (U2.C2 + U2.C3 combined). The
assessment document describes U2.C3 as covering just the search for Tera, worth
up to 1½ points — which would make the combined maximum 2.5, so a player would
need a nearly perfect performance to hear the warmer line. But from gameplay,
our understanding is that there are three finding tasks (Toppo, Tera, and
Aryn), and that U2.C3 may be meant to cover both the Tera and Aryn searches at
up to 1½ points each — which would make the maximum 4, and the same 2-point
bar much easier to clear. Those are two pretty different experiences for
students, so could you confirm three things: does U2.C3 include the Aryn search
or not; if it does, how is each search scored and what's the true maximum; and
is the 2-point threshold still what you want once the maximum is settled? If
the Aryn search should count, it would also help to update the assessment
document so it and the game's grading stay in agreement. Nothing about the
dialog itself changes — this only determines how generous or strict the warmer
line is in practice.
