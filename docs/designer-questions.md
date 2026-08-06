# End-of-Game Script — Questions for the Design Team

> **ANSWERED 2026-08-04.** All five resolved alongside the updated script
> (`designer-content/End of Game Script v2.md`). Answers and their consequences
> are recorded in `docs/script-v2-plan.md` §1. Kept for reference.

*2026-08-03 — five clarifications needed on the "End of Game Script." Each item shows the
technical note first, followed by a plain-language explanation.*

---

1. **U3.C4 numbering.** The script conditions garden plots on "U3.C4", but the EA
   working doc says U3.C4 = "Glyph: Dissolved Particles" and U3.C**5** = "Plant
   Superfruit Seeds." The semantics and threshold ("3 correct plots") match the
   grader's u3p5 rule. Which ID is authoritative?

In the end-of-game script, Tera's superfruit garden line is tied to
checkpoint "U3.C4." But in the Embedded Assessment document, U3.C4 is the "Glyph:
Dissolved Particles" task, and planting the superfruit seeds is listed as U3.C**5**.
Since the script describes "3 correct garden plots" — which matches the planting task —
we believe the script means U3.C5 and the "C4" is a typo. Can you confirm which
checkpoint the garden line should be based on, so we score the right activity?

---

2. **Combined threshold.** "EA score of ≥ 2 points on U2.C2 and U2.C3" — U2.C2 maxes
   at 1 pt and U2.C3 at 1.5, so ≥2 is only reachable as the **sum** (≥2 of 2.5).
   Confirm sum is intended (plan assumes yes).

Jasper's "you found our missing team members quickly" line plays when
the student earns at least 2 points on U2.C2 (finding Toppo) and U2.C3 (finding Tera).
Here's the wrinkle: U2.C2 is worth at most 1 point and U2.C3 at most 1.5 points, so
neither one can reach 2 points on its own. We're assuming you mean the two scores
**added together** — the student gets the happier line when their combined total is 2 or
more out of a possible 2.5. Is that the intent?

---

3. **Missing scores.** If a student never attempted an item (skipped content, grader
   lag), which variant plays? Proposal: Condition B (the gentler line), since both
   variants assert the activity happened; confirm, or supply neutral fallback lines.

Sometimes we simply won't have a score for a task — maybe the student
skipped that part of the game, or their results haven't finished processing yet. The
tricky part is that both the Condition A and Condition B lines talk as if the student
*did* the activity, so neither is a perfect fit when they didn't. Our suggestion is to
play the gentler Condition B line in that case, but if you'd rather, you could write a
short neutral version of each line that works when we don't know how (or whether) the
student did the task. Which would you prefer?

---

4. **Missing bookends.** No Toppo intro, celebration beat, Unit 5 (Aryn — the
   screenshots exist), or finale in the script yet. The demo script's versions will be
   used as placeholders until delivered.

The script currently covers Units 2–4 (Jasper, Tera, and Anderson).
We're still missing a few pieces to make the full ceremony: Dr. Toppo's opening
welcome, the big group celebration moment, Aryn's Unit 5 section (we already have your
Unit 5 screenshots, so it looks like that's planned), and Toppo's closing send-off. No
action needed right away — we'll fill those spots with the lines from our earlier demo
so the whole experience can be watched start to finish — but you should send those sections whenever they're ready and we'll drop them in.

---

5. **U4.C6 wording.** EA doc says "3 cameras," script says "soil locations" — grader
   u4p6 logs `cameraPlaced` with a `soilType`, so these appear to be the same task.
   Confirm.

Anderson's line about seedlings and soil is tied to checkpoint U4.C6.
The Embedded Assessment document describes that checkpoint as placing "3 cameras,"
while the script talks about choosing the best "soil locations." Looking at the game
data, these appear to be the same activity — when the player places a camera, the game
records which soil type it was placed on, so the camera placements *are* the soil
choices. We just want to confirm that's right, so the "3 cameras" checkpoint is the
correct thing to base Anderson's soil line on.
