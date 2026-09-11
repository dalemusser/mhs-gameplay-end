# Ceremony Visual v2 — Presentation Redesign Plan

*Status (2026-09-10): ALL STAGES SHIPPED. The full arc (Stages 1–4 plus the
rounds Dale's auditions added) went out as visual v4 (`player_v4.js?v=30`) in
**dist/v0.1.6**, launcher flipped to v4; the final-script v6 pair shipped as
**dist/v0.1.7** (live 2026-09-10), launcher → v6. The WORKING pair is now the
PLAIN pair `ceremony.html` + `lib/player.js` (lineage v7) — all new changes go
there (bump `lib/player.js?v=N` on every edit; busters start at 100). v1–v6
are frozen archives under `_vN` suffixes (v1 was renamed to `ceremony_v1.html`
+ `lib/player_v1.js` on 2026-09-10). Only remaining unbuilt idea
from this plan: per-unit signature colours (Stage 3's second half), parked.
Content was unchanged through v1–v5; v6 introduced VERSIONED content
(`ceremony-definition_v6.js` + `assets/audio_v6/`, the designers' final
script v4 — see docs/script-v4-plan.md). History below is the round-by-round
log.*

## Why

The v1 presentation works but has four problems (screenshots + discussion, 2026-08-05):

1. **Holo legibility** — the holo shader stack (chromatic split, scanlines, cyan tint,
   bloom push) destroys screenshot detail; the speaker occludes the panel center.
2. **Dialogue collision** — the top-center bubble overlays the holo top in most shots;
   the one clean framing (Tera) is a camera-angle accident.
3. **Visually flat** — one frontal camera axis, empty black void, total symmetry,
   nothing changes state for minutes at a time.
4. **NPC presence** — waiting NPCs are parked upstage at half size; distance is the
   only depth arrangement in use.

## Design direction

TV award-show staging (The Voice as reference, at ~40% of its density): a set built
from **light, not architecture**. The project director's back-wall idea is the anchor.

**Design pillars:**

- **The wall is the display.** A wide LED-wall backdrop with a clean 16:9 hero panel
  for screenshots; surrounding tiles carry low-key animated patterns tinted from the
  current image's palette. The image pays no holo-fuzz tax; the "holo-ness" lives in
  the surround.
- **Light pretending to be architecture.** Everything added is emissive/unlit:
  light blades, podium rings, wall tiles, faked beam cones, faked floor reflections.
  **No new real lights, no render-target reflections, no volumetric post.** The
  darkness between elements is part of the design.
- **A place of honor.** The speaker stands on a circular lit podium (concentric
  emissive rings) — the walk-out becomes stepping up to be recognized.
- **Foreground, not background, NPCs.** Waiting NPCs stand at shallow
  downstage-side positions near the frame edges, angled in toward the podium —
  large in frame, framing the shot like presenters, out of the wall's sightline.
- **TV camera grammar.** A small vocabulary of named shots plus hard cuts;
  one motion event per beat.
- **Color states.** One tint system drives all set emissives; a signature color per
  speaking unit, crossfaded at speaker changes, shifting warm gold for the award.
- **No dead air.** Ambient bed (ducked under voice), transition whooshes, walk-on
  stings, a riser into the award, on top of the existing fanfare + applause.

## Layout decisions

- **Dialogue → lower third.** A full-ish-width bar near the bottom: speaker name
  chip, karaoke text (~17px — slightly smaller than the game's 19px, still
  comfortable for ages 11–14), with **Replay / Next integrated** into the bar's right
  end. Kills the collision problem permanently; matches TV convention. This is a
  deliberate departure from the in-game top-center box — we show the designers the
  finished form rather than describing it.
- **Wall** ~18×6.5 at z≈−5: center hero panel 8×4.5 (16:9), flanking tile fields.
  Hero content = screenshot, contain-fit, minimal treatment (slight edge glow/seam,
  no scanlines/chromatic split/tint).
- **Podium** at the speak mark (nudged upstage to ~z 2.6): flat disc + 2–3 emissive
  rings, subtle pulse while the speaker talks.
- **Blades**: 2–3 angled emissive blades per side framing the stage; mirrored
  low-alpha copies below floor level fake the reflection (optional polish, cheap).
- **Holo panel demoted, not deleted.** A smaller center panel (~4×2.25, y≈3) that
  *appears only* for the conclusion highlights list and the award card — the moments
  the holo treatment actually flatters. Materialize/spin transitions live here.
  Screenshots never touch it again.
- **NPC marks** (start point; iterate on sight): Toppo alone near-camera screen-right
  (MC position); Jasper+Anderson screen-left pair, Aryn+Tera screen-right pair, all
  downstage of the wall at frame edges, angled toward the podium. Walks to the
  podium become short, visible, and mostly straight — the two-lane crossing system
  simplifies or goes away.

## Stages (each auditionable before the next starts)

### Stage 1 — Set & layout (the big restructure)
- Build wall (hero panel + tile fields w/ animated DynamicTexture or shader),
  podium, blades; retire the big holo backdrop; add the small special-moment holo.
- Route `holo.images` beats to the wall hero; `holo.highlights` / award card to the
  small holo; palette extraction at image load (downsample to canvas, dominant hue)
  drives the tile tint.
- New NPC stage marks + walk targets; recompose the wide shot for the new blocking.
- Lower-third dialogue bar with integrated controls.
- Reduce grain; keep vignette/bloom (bloom now only catches set emissives + holo).

### Stage 2 — Camera grammar
- Extend `SHOTS`: high wide (opening), side three-quarters L/R, podium push-in,
  angled image-beat shot (speaker off-center lower third, wall clear behind), orbit.
- Add `cut()` alongside the existing ease; per-beat selection: walk-out = wide or
  side; during line = slow push-in, alternating sides between beats; image beats =
  angled shot; speaker change = cut to wide; award/finale = slow orbit.
- Keep the continuous drift layer.

### Stage 3 — Color states & opening
- Global set-tint uniform with per-unit signature colors; crossfade at speaker
  changes; warm gold takeover for award → celebration.
- Opening boot-up (~8s, on Begin): dark stage → sting → blades ignite in sequence →
  podium rings sweep alight → wall boots MHS logo → camera cranes down from high
  wide → Toppo's first line.

### Stage 4 — Sound layers
- Suno ambient bed wired into the existing `MUSIC.bed` slot, ducked while a voice
  line plays; whoosh on wall/holo transitions; short walk-on sting at speaker
  changes; riser into the award. Assets via the existing mhsaudiotools/ElevenLabs/
  Suno pipeline; Dale auditions all takes per the established workflow.

## Guardrails

- Target: smooth on low-end Chromebooks. Emissive-only set, no added real lights,
  no RTT mirrors, bounded additive overdraw (blades/cones kept few and thin).
- Characters remain the most expensive draw; set dressing must stay cheap.
- Presentation-only change: resolver, definition, tests, audio manifest untouched.
- Audition checkpoints end every stage (`ceremony_v2.html?profile=...` with the
  existing test profiles; Playwright captures of each named shot for review).

## Open items

- NPC arrangement is a first guess — iterate after seeing Stage 1.
- Seated Voice-judge staging rejected for now (no chairs/seated clip coverage);
  revisit only if standing presenters don't read well.
- Designer sign-off on the lower-third happens by *showing* the finished v2.
- Bed-music track choice (Suno) deferred to Stage 4.

## v3 round — dimensional stage (2026-08-13)

Dale's v2 audition: light blades "start out of nowhere", stage still boring vs
The Voice, everything flat except the characters. v3 (`ceremony_v3.html` +
`lib/player_v3.js`, cloned from v2 — v2 frozen as rollback) rebuilds the
environment as connected 3D structure: overhead truss w/ fixture dots + a
droplet-ring mission emblem; blades became floor-to-truss columns with base
fixtures; angled LED side wings fold the wall into a three-sided room (shared
`ledwall` shader, now with a travelling column + a radial `pulse` wave fired on
image changes/celebration); the flat podium became a two-tier edge-lit platform
the speaker physically steps onto (holder.y ramps by distance to the platform
centre); LED floor arcs with an angular chase circle the platform; a 6-cone
additive beam rig sweeps overhead (flares on speaker hand-offs, livens in the
celebration); ambient motes fill the air; the default wide is a gentle
three-quarter angle so the depth reads. All additions unlit/additive — no new
real lights, no RTT. Verified at 16:9 and 4:3, zero console errors. Launcher
still points at v2; v3 auditions via `ceremony_v3.html?profile=…`. On approval:
launcher flip + `dist/v0.1.5`.

Audition fixes (same day): wings re-hung on hinge pivots FLUSH at the wall
edges with dark backing slabs + plinth feet (they'd floated with a seam and
read paper-thin edge-on); beam cones rebuilt capless (`cap: NO_CAP` — the
default end-cap discs were the glowing "ovals" splashed on the wall/screen),
lengthened to terminate below the floor so shafts visibly land on the floor,
and moved outboard beside the columns with a narrower sweep so no beam ever
crosses the hero screen.

Round 2 audition fixes: beams got a vertical opacity gradient (shaft dissolves
toward its lower end — no rim can ever read as an oval) plus per-beam FLOOR
POOLS that track the sweep every frame (Vector3.TransformNormal of the pivot →
floor intersection), and a steeper downstage lean — the "spotlight lands on
the stage floor" read Dale asked for. Multi-image beats now pace across the
first 80% of the line (the intro's WAT247 planet slide landed at the exact
midpoint of a 24s line and was easy to skip past). NOTE: bump the
`player_v3.js?v=N` query in ceremony_v3.html on EVERY player edit — the HTML
is no-cache but the JS is not, and a stale cached player silently shows the
previous build (likely why the oval fix "didn't take" on first audition).

Round 3 (wrong diagnosis, reverted): briefly blamed the wall shader's radial
`pulse` ripple and replaced it with a dot surge — Dale corrected this: he LIKES
the ripple, and the ovals persisted without it. Ripple restored verbatim.

Round 4 (the real fix): the ovals were the BEAM CONES' silhouettes against the
wall — a wide, soft-edged, taper-faded translucent cone seen in front of a wall
inevitably reads as a glowing oval blob (silhouette edges accumulate the most
additive alpha). Beams rebuilt as THIN near-vertical shafts (diameters
0.18→0.55, tilt 0.14, no opacity gradient, constant alpha, NO_CAP, running past
the floor so the opaque floor cuts each shaft off exactly at its tracking floor
pool). Thin crisp lines read as rig light; the landing pools carry the
"spotlight on the stage floor" story. Lesson: never put wide soft additive
volumes between the camera and a wall.

Round 5: beam MOTION moved from side-sway into the downstage NOD (rz ±0.09,
rx 0.42±0.16) — big sideways sweeps smeared diagonal streaks across the wall;
nodding walks each pool metres across the floor instead. Shafts thinned/dimmed
(α 0.035), pools enlarged + brightened (they carry the effect). Emblem finally
water-blue after TWO Babylon traps: StandardMaterial's emissiveTexture is not
tinted by emissiveColor (paint colour INTO the texture), and emissiveColor ADDS
to the texture (must be black when the texture carries the colour).

Round 6: beam shafts briefly deleted entirely (wrong conclusion — see below).

Round 7 — ACTUAL ROOT CAUSE of the entire spotlight saga, found by dumping the
cones' world bounding boxes in the live scene: `pivot.rotation.x = +0.42` tilts
a hanging cone UPSTAGE in this scene's frame, not downstage. Every "downstage
lean" since the rig was built aimed the beams INTO and THROUGH the wall — the
reported "ovals at the landing point on the wall" were literally the ellipses
where the cones pierced the wall plane, and the tracked floor pools were
landing BEHIND the wall where no one could see them. Dale's description was
accurate the whole time. Fix: negate the tilt (rotation.x = −0.42, sweep
−(0.42±0.16)); shafts restored (slim cone, NO_CAP, constant alpha, pierces the
floor) + bright pools — beams now visibly hang from the truss and land in
moving pools on the stage floor, wall untouched. The round-4/5/6 "lessons"
about translucent volumes were artifacts of this inverted tilt. Real lesson:
when a spatial effect repeatedly reads wrong, dump world-space bounds and CHECK
the orientation empirically — don't reason from assumed rotation signs.

Round 8: the mid-stage holo panel (highlights/award card) parallax-slid across
the backdrop as the camera moved between shots — physically correct for a
floating panel 3.4m in front of the wall, but it read as a wandering display.
Retired the floating holo entirely: MISSION HIGHLIGHTS and the award card now
draw directly on the WALL hero screen (drawHighlights/drawSlide retargeted to
heroTex at 1280×720, layouts rescaled). One display surface, no parallax. The
holo machinery (shader/bezel/cone/dust) remains in code but never enables.

## v4 round — camera grammar, transitions, intro, music (2026-08-20)

Dale's scope for the round after v0.1.5 (`ceremony_v4.html` + `lib/player_v4.js`,
cloned from v3; ships as v0.1.6): (1) more camera movement — side/top-down/panning
TV coverage; (2) speaker walk-up/walk-back transitions feel like dead time — fix
with camera coverage AND transition music; (3) an overall music plan on the
awards-show grammar (voice dry, music everywhere else) — see docs/music-plan.md
(cue sheet + Suno prompts; style: teen-friendly instrumental electronic pop);
(4) an intro/cold open before Toppo's first line (= Stage 3's boot-up, pulled
forward; per-unit signature colours stay parked).

Order: music plan doc first (unblocks Dale's Suno generation lead time) → Stage 2
camera grammar incl. walk-up coverage → intro cold open → wire music/SFX as
approved tracks land (every cue degrades to silence while missing).

Round log (shipped at ?v=30 in dist/v0.1.6 — all four goals COMPLETE, plus
ending/results/intro/logo rounds from Dale's audition feedback): camera grammar landed ?v=3 (cuts, shot cycling, follow coverage);
music wired ?v=4 (cues from Dale's Suno picks, docs/music-plan.md); ?v=5 arrival
grammar (pre-arrival groove fade, welcome applause, settle beat — Dale: the old
duck-at-line-start was abrupt); ?v=6–8 ending rebuild (Dale: silent cheering over
Toppo's walk home + stars covering the trophy): the ending celebration launches
everything AT ONCE on beat entry, the announcer stays at the podium, the trophy
rises beside them, and the stars moment cuts to a locked near-frontal `results`
shot with the pop-up pinned left — trophy centre, presenter right. Lesson: the
results view axis must run perpendicular to the presenter→trophy line, verified
with Vector3.Project, not assumed (an angled shot stacked them behind the panel).
Later same arc: results moved AGAIN — onto the wall hero screen as a game-style
results board (star slots pop row-by-row, trophy icon zings into an AWARD EARNED
badge; DOM pop-up deleted, camera freed to a continuous pendulum sweep); award
line auto-flows into the celebration; end screen text + Replay-the-award.
COLD OPEN landed (?v=19, Stage 3's opening realised + Dale's company-tableau
idea): pre-Begin the stage waits DARK with the whole cast in a centre-stage
FORMATION; Begin → m1 build under a high crane while the set ignites by element
group (columns → podium/floor → rig → wall) and the real lights come up last so
the company emerges from darkness; at the impact (7s) the MISSION HYDROSCI
title blooms with a wall pulse and the group disperses to their marks (Toppo
steps up to the podium) under the crane-down; the first line gates on everyone
being placed, then m1 fades + settle. R/dev-jumps skip the intro
(first-impression piece). startAtMark pre-placement superseded by the tableau.

Final rounds to ship (?v=20–30): tableau MINGLE — statues read as broken, so
until the dispersal the pairs face each other trading Talking1/2/3/TalkUpbeat
vs Listen/Idle/Fidget clips on independent drifting clocks, every clip started
at a random phase, while Toppo works the room. **GestureUp is BANNED from group
mingling** — its raised-arm point, done in unison, read as a fascist salute
(Dale's catch). Wall-inheritance fix: jumps (dev panel / end-Replay) into a
no-holo beat reconstruct the inherited wall at its finished state via
`wallHolo` staleness detection (the stars board had been bleeding under the
award line). Award announcement now holds on the lower-third through the WHOLE
celebration; mid-intro dev-jumps duck m1 immediately. MHS LOGO dressing
(assets/logo/mhs-logo.png, `EMBLEM_LOGO` const gates all of it; droplet code
kept): overhead above the truss (replacing the drawn water drop), both LED
wings, the podium top (floor decal needs rotation.z π or it reads upside-down
from the house), and a fade-up end card out of the final black. Shipped
2026-08-21 as dist/v0.1.6 (105 files; + music cues, trophy-zing, re-cut unit1
images; launcher→v4).

## v5 (working) — post-ship log

- ?v=2 `restartShow()`: the end screen's ↺ Restart replays the FULL show incl.
  the cold open (skipping to Toppo felt like starting mid-show — Dale); Begin
  shares the same path. The R key stays the quick intro-skipping restart.

## v6 (working) — final-script content round (2026-09-10)

Cloned from v5 (?v=2) for the designers' FINAL script (v4): presentation
untouched; the only player delta is `AUDIO_DIR = 'assets/audio_v6/'` with an
on-load remap of the manifest's hardcoded `assets/audio/` prefix, so v6 plays
the script-v4 clip set while v1–v5 keep the script-v3 set. Content details,
tests, and the release checklist: docs/script-v4-plan.md. v5 is now the
frozen "previous script" version (launcher footer link).

- ?v=2 cold-open captions: the lower-third sat EMPTY through the tableau
  mingle + dispersal (Dale). Now `introStatus()` → "The ceremony is about to
  begin." with a smaller "♪ Music playing" note (only while the m1 cue is
  actually loaded — TV-caption honesty), set from `restartShow()` so Begin
  and ↺ Restart both get it; Toppo's first line replaces it as before.
  `walkStatus()` now shares the `setStatus(text, note)` helper.
- ?v=3 hand-off captions (Dale's follow-up): "Walking to the stage." now carries
  the same audio notes — "♪ Music playing · Applause" during the walk (groove +
  welcome applause), dropping to "Applause" at arrival since the groove has
  faded by then (`walkNote(arrived)`, re-set from the arrival block); each part
  is listed only while its sound is actually available. Verified sequence:
  walk 0–6.7s both notes → arrival "Applause" → line at +1.3s settle.

## v7 round (working) — 2026-09-10, after v0.1.7 went live

Clone of v6 (?v=3): presentation and content identical (still
`ceremony-definition_v6.js` + `assets/audio_v6/`). v6 is frozen as shipped in
dist/v0.1.7.

**First item — the naming fix.** v0.1.7's student-facing URL was
`…/v0.1.7/ceremony_v6.html`: three unrelated counters (release folder,
player lineage `_vN`, designers' script vN) had leaked into one path, and the
first two only ever looked related by coincidence (v5 never shipped alone).
New convention: the plain names `ceremony.html` + `lib/player.js` ARE the
current show and are what every release ships at `…/vX.Y.Z/ceremony.html`;
the `_vN` pairs are the frozen comparison archive. Mechanics: the original v1
files moved to `ceremony_v1.html` + `lib/player_v1.js` (its include updated,
buster kept at ?v=5); the v7 working pair took the plain names with
`lib/player.js?v=100` (a buster the retired v1 player never used, so no
cached collision); the launcher's cards + Production default point at
`ceremony.html`, footer lists v6 → v1. At each future ship, right after
staging, SNAPSHOT the plain pair to `ceremony_vN.html` + `lib/player_vN.js`
(N = the lineage number in the player header) and keep working on the plain
pair — the inverse of the old "clone the working pair after staging". Frozen
players v2–v6 still say "v1 lives in lib/player.js" in their headers; they
were deliberately not touched (byte-identical to what shipped). Safe because
each CDN folder is immutable and self-contained — `ceremony.html` = v1 in
v0.1.3–v0.1.7 forever, = the current show from v0.1.8 on.
