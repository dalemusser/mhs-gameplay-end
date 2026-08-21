# Ceremony Visual v2 — Presentation Redesign Plan

*Status: Stage 1 IMPLEMENTED (2026-08-05, Playwright-verified, awaiting Dale's
audition); Stages 2–4 pending. Implementation happens in `ceremony_v2.html` +
`lib/player_v2.js` only; `ceremony.html` + `lib/player.js` stay untouched as the
v1 rollback. Content (`ceremony-definition.js`, resolver, audio manifest) is
shared and unchanged.*

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
