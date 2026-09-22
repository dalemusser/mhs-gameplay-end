/*
 * MHSCeremonyPlayer — THE CURRENT SHOW. The plain names (ceremony.html +
 * lib/player.js) are what ships as `…/vX.Y.Z/ceremony.html`, so the student-
 * facing URL never carries an internal lineage number (Dale, 2026-09-10 —
 * v0.1.7 shipping `ceremony_v6.html` was the last straw). NAMING CONVENTION
 * from here: work on the plain pair; at each ship, right after staging,
 * SNAPSHOT it to `ceremony_vN.html` + `lib/player_vN.js` (frozen rollback /
 * comparison archive, listed in the launcher footer) and keep working here.
 * Bump the `lib/player.js?v=N` buster in ceremony.html on EVERY edit; it
 * started at 100 so it can never collide with the retired v1 player's
 * `?v=1…5` (that file is now lib/player_v1.js — older players' headers still
 * say "v1 in lib/player.js"; they are frozen and were not touched).
 *
 * v7 (v0.1.8): the EMBED release — docs/embed-api.md. start(script, opts) now
 * takes opts.base (prefix for every asset URL, so the bundle can be served
 * from any path, e.g. stratahub's /missionhydrosci/content/end/vX.Y.Z/),
 * opts.hooks (beforeUnit / beforeCelebration for LATE BINDING of the scores,
 * onStarted / onFinished / onFailed / onExit for the host page), opts.dev
 * (the beat selector without ?dev=1), and an Exit control (opts.returnUrl or
 * opts.onExit; #exitBtn, top-right, above the Begin overlay). Babylon and the
 * two playground textures are VENDORED (lib/vendor/, assets/env/) — nothing
 * is fetched from a public CDN any more. The DOM the player expects is built
 * by lib/embed.js; the cache buster for this file is EMBED_V there (the old
 * per-file ?v= busters are gone).
 *
 * Lineage: this is v7, cloned from v6 (?v=3, shipped in dist/v0.1.7 = live
 * 2026-09-10). Content is shared with v6 for now (ceremony-definition_v6.js +
 * assets/audio_v6/, the designers' FINAL script v4) — if the script ever
 * changes again, version the content layer alongside this pair, as v6 did
 * (docs/script-v4-plan.md §2).
 *
 * v6 was v5 + the versioned voice-clip folder: this player reads
 * assets/audio_v6/ (AUDIO_DIR below) so the v6/v7 pages +
 * ceremony-definition_v6.js play the FINAL script while v1–v5 keep the
 * script-v3 clips in assets/audio/.
 *
 * v5 was v4 + restartShow(): the end screen's ↺ Restart replays the FULL show
 * incl. the cold open; Begin shares the path; R stays the quick restart.
 * v6 ?v=2: cold-open captions — the lower-third reads "The ceremony is about
 * to begin." + "♪ Music playing" through the tableau/dispersal instead of
 * sitting empty (setStatus/introStatus; Dale's note, 2026-09-10).
 * v6 ?v=3: hand-off captions carry the same notes — "Walking to the stage."
 * + "♪ Music playing · Applause" during the walk, "Applause" once the speaker
 * arrives and the groove has faded (walkNote; Dale's follow-up).
 *
 * v4 (shipped) was the full presentation arc: TV camera grammar, awards-show
 * music grammar + arrival settle, immediate award celebration w/ pendulum
 * sweep, wall results board + trophy zing, end screen + end-card logo,
 * cold-open boot w/ company tableau + mingle, MHS logo dressing (overhead,
 * wings, podium, fade card), and the ?dev=1 beat selector. Details below.
 *
 * v4 round 1: TV CAMERA GRAMMAR — a shot vocabulary (crane high wide w/ orbit,
 * side ¾ B-cams, wall-forward shot), hard cuts + post-cut push-ins, per-line
 * shot cycling on same-speaker runs, and walk-up FOLLOW coverage so speaker
 * hand-offs play as content, not dead time.
 * v4 round 2: MUSIC CUES wired (docs/music-plan.md — awards-show grammar,
 * voice always dry): m1 opening build w/ hold, m2a/b walk-up grooves that
 * resume per hand-off and duck at each line, m4 riser gating the celebration
 * launch (fanfare/confetti/trophy/m5 fire together at the hit), m5 fading
 * with the black-out. Intro cold open (visuals) still to come.
 *
 * v3 was: the v2 TV-stage set rebuilt as a DIMENSIONAL stage:
 * overhead truss anchoring floor-to-rig light columns, angled LED side wings,
 * a tiered edge-lit podium platform the speaker steps onto, LED floor arcs,
 * sweeping beam rig, ambient motes, and an angled default wide shot so the
 * depth actually reads. See docs/visual-v2-plan.md (v3 round).
 * v2 lives on in lib/player_v2.js; v1 in lib/player.js.
 *
 * Usage: MHSCeremonyPlayer.start({ layout: {mc, group[]}, beats: [...] }, opts)
 * The script is the OUTPUT of MHSCeremonyResolver.resolve(definition, eaScores) —
 * this module knows nothing about conditions or EA scores; it just performs beats.
 * The embed may REPLACE beats in the array while the show runs (late binding);
 * the player always reads beats[i] fresh at beat entry.
 *
 * Expects the ceremony DOM (renderCanvas, bubble, controls, startOverlay, exitBtn)
 * and the Babylon + MHS helper libs (aliveface/gaze/headlook) to be loaded first
 * — lib/embed.js does both.
 */
(function () {
'use strict';

function start(script, opts) {
opts = opts || {};
const hooks = opts.hooks || {};
const BASE = opts.base || '';                    // prefix for every asset URL (embed passes the bundle's base)
const V3 = BABYLON.Vector3, Color3 = BABYLON.Color3, Q = BABYLON.Quaternion;
const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
const scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color4(0.02, 0.03, 0.05, 1);
scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
scene.fogColor = new Color3(0.03, 0.05, 0.09);
scene.fogDensity = 0.032;                              // bigger playing space than v1 (wall sits further back)

// ---------------------------------------------------------------- camera
// Cinematic: the camera eases toward a per-beat "shot", with a continuous gentle
// drift on top (slow orbit/dolly) for constant parallax → 3D/TV feel. beta > π/2
// looks slightly UP (see faces / under Tera's hat). Free-cam (F) for inspection.
const camera = new BABYLON.ArcRotateCamera('cam', Math.PI / 2 - 0.24, 1.578, 10.2,
  new V3(-0.4, 1.7, 0.9), scene);
camera.fov = 0.92;
camera.minZ = 0.05; camera.maxZ = 200;
camera.wheelDeltaPercentage = 0.01;
let freeCam = false;                                   // F toggles manual orbit for inspection
const FOOTLOCK = false;                                 // anti-slide foot-lock — OFF: the planted Idle clip handles resting; the lock lurched the high-motion talk/cheer clips
// Fixed "audience" point out in front — characters face it / address it (eye level so
// faces aim level, not down).
const AUDIENCE = new V3(0.2, 1.72, 14);
// v4 CAMERA GRAMMAR: a real shot vocabulary + hard cuts (TV coverage).
// Named shots the camera eases between. Per-shot `k` = ease speed (default 1.6;
// 0.15 on speaker shots so the settle after a cut reads as a slow push-in) and
// `orbit` = alpha drift in rad/s while the shot holds (celebration crane).
// speaker* frame the downstage mark; Tera's shot sits lower & looks further up
// so we see her face under the hat brim. The podium sits off-centre
// (screen-right); front speaker shots target BETWEEN the speaker and the wall
// centre, so the speaker rides the right third of frame and the hero image
// reads clear on the centre-left (no more head-over-the-image).
const SHOTS = {
  // v3: the wide is a gentle THREE-QUARTER view (alpha offset) so the wings,
  // tiers, truss, and beams read as 3D — a frontal wide flattened the set.
  // Speaker targets sit 0.12 higher: the speaker now stands on the platform.
  wide:        { alpha: Math.PI / 2 - 0.24, beta: 1.578, radius: 10.2, target: new V3(-0.4, 1.7, 0.9) },
  speaker:     { alpha: Math.PI / 2 - 0.05, beta: 1.60, radius: 4.4, k: 0.15, target: new V3(-1.4, 1.52, 2.6) },
  speakerTera: { alpha: Math.PI / 2 - 0.04, beta: 1.78, radius: 3.9, k: 0.15, target: new V3(-1.4, 1.38, 2.65) },
  // crane: high wide looking down across the whole set — the celebration orbits it
  wideHigh:    { alpha: Math.PI / 2 - 0.30, beta: 1.16, radius: 13.3, orbit: 0.045, target: new V3(-0.6, 0.9, 0.6) },
  // ending-celebration SWEEP: a lower, closer jib PENDULUM around the trophy +
  // presenter — swings π/2−0.35 ↔ π/2+0.45 and back, CONTINUOUSLY from the
  // party launch until the fade (Dale: the stars must not stop the camera; the
  // old one-way arc + hard cut to a locked results shot read as broken).
  // sway: alpha travels amp·(1−cos(speed·t)) from the cut point — starts at
  // zero velocity, so the cut lands and the swing builds with no jump. Rate at
  // mid-arc = amp·speed = 0.14 rad/s, same feel as the old one-way arc.
  celebArc:    { alpha: Math.PI / 2 - 0.35, beta: 1.35, radius: 8.6, sway: { amp: 0.40, speed: 0.35 }, target: new V3(-1.4, 1.3, 2.8) },
  // wall-forward: the speaker rides the right third small, the hero screen is the
  // star — for beats whose content lives on the wall (images / highlights / cards)
  imageWide:   { alpha: Math.PI / 2 - 0.20, beta: 1.56, radius: 7.4, k: 0.15, target: new V3(-0.9, 2.35, 0.2) },
};
// The wide shot must hold the WHOLE ensemble at any window shape. Vertical FOV is
// fixed, so a squarer window sees less horizontally — back the camera out until
// |x| ≤ WIDE_NEED at the NPC line stays in frame. Recomputed on every resize.
const WIDE_NEED = 6.8;                                 // half-width to keep visible at z≈4.4 (angled view needs margin)
function fitWide() {
  const aspect = engine.getRenderWidth() / Math.max(1, engine.getRenderHeight());
  const dist = WIDE_NEED / (Math.tan(camera.fov / 2) * aspect);
  SHOTS.wide.radius = Math.max(9.8, dist + 4.4 - SHOTS.wide.target.z);
  SHOTS.wideHigh.radius = SHOTS.wide.radius * 1.3;     // the crane backs out with the wide
}
fitWide();
let shot = SHOTS.wide, shotT0 = 0, followChar = null;
const camCur = { alpha: shot.alpha, beta: shot.beta, radius: shot.radius, target: shot.target.clone() };
const followTgt = new V3();                            // scratch — a follow shot's live target
// setShot EASES toward s (speed s.k); cutTo snaps there instantly — a TV hard
// cut. punchOut starts the cut slightly wide of s.radius, so the shot's slow
// ease then closes the gap: cut + creeping push-in, the standard line coverage.
function setShot(s) { shot = s; shotT0 = performance.now() / 1000; followChar = s.follow || null; }
function cutTo(s, punchOut) {
  setShot(s);
  camCur.alpha = s.alpha; camCur.beta = s.beta; camCur.radius = s.radius + (punchOut || 0);
  if (followChar) { camCur.target.copyFrom(followChar.holder.position); camCur.target.y += 1.45; }
  else camCur.target.copyFrom(s.target);
}
// Side ¾ B-cameras on the podium for consecutive lines from one speaker.
// s=+1 swings the camera toward screen-right — that ray passes the MC/NPC
// downstage marks, so it rides HIGH (over their heads, a touch of the top-down
// look); s=-1 has clear floor downstage-centre and stays at eye level.
function sideShot(name, s) {
  const b = (name === 'Tera') ? SHOTS.speakerTera : SHOTS.speaker;
  if (s > 0) return { alpha: Math.PI / 2 + 0.5, beta: 1.32, radius: 5.2, k: 0.15, target: new V3(-2.15, b.target.y + 0.05, 2.5) };
  return { alpha: Math.PI / 2 - 0.66, beta: b.beta - 0.02, radius: b.radius + 0.6, k: 0.15, target: new V3(-2.15, b.target.y + 0.05, 2.5) };
}
// Per-line shot selection. Wall-content beats keep the wall in frame (alternate
// wall-forward and front push-in); talk-only beats cycle front / high-right /
// side-left, so a long same-speaker run cuts between angles like live coverage.
function chooseSpeakerShot(name, beat, run) {
  const base = (name === 'Tera') ? SHOTS.speakerTera : SHOTS.speaker;
  let s;
  if (beat && beat.holo) s = (run % 2) ? base : SHOTS.imageWide;
  else { const v = run % 3; s = v === 0 ? base : sideShot(name, v === 1 ? 1 : -1); }
  // never cut to the shot already on air (a same-framing cut = jump cut) —
  // only the shared refs (base/imageWide) can repeat; side shots are fresh objects
  if (s === shot) s = (s === SHOTS.imageWide) ? base : ((beat && beat.holo) ? SHOTS.imageWide : sideShot(name, 1));
  return s;
}
// Walk-up coverage: camera planted ahead of the walker's path on the podium
// side, tracking them (live target — see the render loop) as they cross. The
// hand-off becomes content instead of dead time. Side chosen so the walker
// moves TOWARD the camera, like an award-show winner walk.
function followShot(c) {
  const fromLeft = c.home.x > PODIUM_X;                // +x = screen-left
  return { alpha: Math.PI / 2 + (fromLeft ? 0.52 : -0.52), beta: 1.54, radius: 5.8, k: 2.2, follow: c };
}

// ---------------------------------------------------------------- lighting
scene.environmentTexture = new BABYLON.CubeTexture(BASE + 'assets/env/environment.env', scene);   // vendored (was playground.babylonjs.com)
scene.environmentIntensity = 0.55;
// Brighter, more even lighting so faces read clearly (the dramatic-but-too-dark
// version blew out the white coats and hid faces). Keep some directionality.
const hemi = new BABYLON.HemisphericLight('hemi', new V3(0, 1, 0), scene);
hemi.intensity = 0.55; hemi.diffuse = new Color3(0.7, 0.78, 0.95); hemi.groundColor = new Color3(0.08, 0.1, 0.16);
// soft front fill from the audience side → lights faces (no harsh blowout)
const fill = new BABYLON.DirectionalLight('fill', new V3(0, -0.25, -1), scene);
fill.intensity = 0.7; fill.diffuse = new Color3(0.95, 0.97, 1);
// gentler key spotlights for shape (lower so white clothing doesn't bloom)
const keyL = new BABYLON.SpotLight('keyL', new V3(2.4, 7, 6), new V3(-0.05, -1, -0.6), Math.PI / 2.6, 10, scene);
keyL.intensity = 110; keyL.diffuse = new Color3(1, 0.97, 0.92);
const keyR = new BABYLON.SpotLight('keyR', new V3(-2.6, 7, 6), new V3(0.1, -1, -0.6), Math.PI / 3, 12, scene);
keyR.intensity = 95; keyR.diffuse = new Color3(0.95, 0.97, 1);
// cool rim from behind for separation
const rim = new BABYLON.DirectionalLight('rim', new V3(0.2, -0.4, 1), scene);
rim.intensity = 0.4; rim.diffuse = new Color3(0.4, 0.6, 1);
// holo spill light (cyan), sits at the display
const holoLight = new BABYLON.PointLight('holoLight', new V3(0, 3.0, -2.2), scene);
holoLight.intensity = 8; holoLight.diffuse = new Color3(0.3, 0.75, 1); holoLight.range = 13;

const shadow = new BABYLON.ShadowGenerator(1024, keyL);   // modest for low-end Chromebooks
shadow.useBlurExponentialShadowMap = true; shadow.blurKernel = 16; shadow.darkness = 0.45;

// ---------------------------------------------------------------- floor
const floor = BABYLON.MeshBuilder.CreateGround('floor', { width: 40, height: 40 }, scene);
floor.position.z = 14.5;                               // floor ENDS at the wall (z −5.5) — behind it, black void, not fogged grey
const fmat = new BABYLON.PBRMaterial('fmat', scene);
fmat.albedoColor = new Color3(0.015, 0.02, 0.032);     // near-BLACK (The Voice floor) — the white spot-pool wash was boring grey
fmat.metallic = 0.4; fmat.roughness = 0.32;
fmat.environmentIntensity = 0.3;
floor.material = fmat; floor.receiveShadows = true;

// ---------------------------------------------------------------- post FX
const pipe = new BABYLON.DefaultRenderingPipeline('fx', true, scene, [camera]);
// Bloom only catches the bright holo (its emissive is boosted past the threshold),
// not the lit characters → keeps faces crisp.
pipe.bloomEnabled = true; pipe.bloomThreshold = 1.1; pipe.bloomWeight = 0.45; pipe.bloomKernel = 64; pipe.bloomScale = 0.6;
pipe.fxaaEnabled = true;
pipe.imageProcessingEnabled = true;
pipe.imageProcessing.vignetteEnabled = true; pipe.imageProcessing.vignetteWeight = 3.0;
pipe.imageProcessing.vignetteColor = new BABYLON.Color4(0, 0, 0, 0);
pipe.imageProcessing.contrast = 1.1; pipe.imageProcessing.exposure = 1.05;
pipe.imageProcessing.toneMappingEnabled = true;
pipe.grainEnabled = true; pipe.grain.intensity = 1.2; pipe.grain.animated = true;   // lighter than v1 — the hero screen must stay clean
// NOTE: global chromatic aberration is OFF — it fringed the whole scene (fuzzy
// characters). The holo keeps its OWN local chromatic split inside its shader.
pipe.chromaticAberrationEnabled = false;

// ================================================================ DISPLAYS (v2)
// Two tiers. (1) The LED WALL upstage carries the screenshots on a clean hero
// screen — no holo treatment, legibility first — flanked by a tile field tinted
// from each image's palette. (2) A SMALL holo panel (this shader: scanlines,
// chromatic split, fresnel, materialize wipe) appears ONLY for the conclusion
// highlights and the award card — the content the holo treatment flatters.
BABYLON.Effect.ShadersStore['holoVertexShader'] = `
precision highp float;
attribute vec3 position; attribute vec3 normal; attribute vec2 uv;
uniform mat4 worldViewProjection; uniform mat4 world;
varying vec2 vUV; varying vec3 vPositionW; varying vec3 vNormalW;
void main(){ vUV=uv; vec4 wp=world*vec4(position,1.0); vPositionW=wp.xyz;
  vNormalW=(world*vec4(normal,0.0)).xyz; gl_Position=worldViewProjection*vec4(position,1.0); }`;
BABYLON.Effect.ShadersStore['holoFragmentShader'] = `
precision highp float;
varying vec2 vUV; varying vec3 vPositionW; varying vec3 vNormalW;
uniform sampler2D contentTex; uniform float time; uniform float reveal;
uniform vec3 tint; uniform vec3 cameraPosition;
float hash(float n){ return fract(sin(n)*43758.5453); }
void main(){
  vec2 uv = vUV;
  // chromatic split
  float ca = 0.0035 + 0.0015*sin(time*2.0);
  float r = texture2D(contentTex, uv + vec2(ca,0.0)).r;
  vec4 cg = texture2D(contentTex, uv);
  float b = texture2D(contentTex, uv - vec2(ca,0.0)).b;
  vec3 content = vec3(r, cg.g, b);
  float ca_ = max(max(r, cg.a), b);
  float aSrc = cg.a;
  // scanlines + rolling bar + flicker
  float scan = 0.82 + 0.18*sin(uv.y*620.0 + time*5.0);
  float bar  = 0.93 + 0.07*smoothstep(0.0,0.6, sin(uv.y*2.5 - time*1.3));
  float fl   = 0.93 + 0.07*hash(floor(time*14.0));
  // fresnel edge glow
  vec3 Vd = normalize(cameraPosition - vPositionW);
  float fres = pow(1.0 - abs(dot(normalize(vNormalW), Vd)), 2.5);
  // HUD border frame
  float bw = 0.012; float fx = step(uv.x,bw)+step(1.0-bw,uv.x); float fy = step(uv.y,bw)+step(1.0-bw,uv.y);
  float frame = clamp(fx+fy, 0.0, 1.0);
  // faint background grid so empty areas still read as a panel
  float grid = (step(0.985, fract(uv.x*16.0)) + step(0.985, fract(uv.y*9.0))) * 0.08;
  vec3 col = content * tint * scan * bar * fl;
  col += tint * fres * 0.6;
  col += tint * frame * 1.1;
  col += tint * grid;
  float alpha = max(aSrc, frame);
  alpha = max(alpha, fres*0.22 + grid);
  // materialize: vertical wipe bottom->top with a bright leading edge + noisy fringe
  float edge = reveal;
  float n = hash(floor(uv.x*140.0))*0.05;
  float vis = step(uv.y, edge + n);
  float lead = smoothstep(0.0, 0.06, edge - uv.y) * (1.0 - smoothstep(0.06, 0.12, edge - uv.y));
  col += tint * lead * 1.5 * step(uv.y, edge+0.12);
  alpha *= vis; col *= vis;
  col *= 1.5;                                  // push above bloom threshold so it glows
  gl_FragColor = vec4(col, alpha);
}`;

const holoContent = new BABYLON.DynamicTexture('holoContent', { width: 1024, height: 576 }, scene, false);
holoContent.hasAlpha = true;
// v3: the title/award card and the highlights list draw on the WALL hero screen
// (1280×720) — the floating mid-stage holo panel parallax-slid across the
// backdrop as the camera moved and read as a wandering display.
function drawSlide(title, subtitle) {
  const ctx = heroTex.getContext(); const W = 1280, H = 720;
  ctx.fillStyle = '#050b14'; ctx.fillRect(0, 0, W, H);
  // subtle inner panel wash
  ctx.fillStyle = 'rgba(20,90,150,0.10)'; ctx.fillRect(40, 40, W - 80, H - 80);
  // corner brackets
  ctx.strokeStyle = 'rgba(150,225,255,0.95)'; ctx.lineWidth = 4; const m = 56, L = 90;
  const corner = (x, y, dx, dy) => { ctx.beginPath(); ctx.moveTo(x, y + dy * L); ctx.lineTo(x, y);
    ctx.lineTo(x + dx * L, y); ctx.stroke(); };
  corner(m, m, 1, 1); corner(W - m, m, -1, 1); corner(m, H - m, 1, -1); corner(W - m, H - m, -1, -1);
  // title — shrink-to-fit so long titles (e.g. PLANETARY WATER STEWARD) stay inside the frame
  ctx.textAlign = 'center'; ctx.fillStyle = '#dffaff';
  const t = (title || '').toUpperCase();
  let fs = 92;
  ctx.font = '700 ' + fs + 'px Segoe UI, sans-serif';
  while (fs > 40 && ctx.measureText(t).width > W - 200) { fs -= 4; ctx.font = '700 ' + fs + 'px Segoe UI, sans-serif'; }
  ctx.fillText(t, W / 2, H / 2 - 8);
  // underline
  ctx.strokeStyle = 'rgba(120,210,255,0.8)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(W / 2 - 280, H / 2 + 42); ctx.lineTo(W / 2 + 280, H / 2 + 42); ctx.stroke();
  // subtitle
  ctx.fillStyle = 'rgba(170,225,255,0.85)'; ctx.font = '400 42px Segoe UI, sans-serif';
  ctx.fillText(subtitle || '', W / 2, H / 2 + 104);
  heroTex.update();
}
// ---- screenshot image slides on the WALL hero screen ----
// A beat's holo can be { images: ['unit2/Find Toppo.jpg', …] } instead of a procedural
// {title, subtitle} card. v2: these draw CLEAN into the hero screen's DynamicTexture
// (contain-fit on a dark letterbox) — the holo shader never touches them. Multi-image
// lists pace across the spoken line with a short crossfade (see showText, which arms
// the schedule, and the render loop, which advances it). Each image also carries a
// dominant-colour tint (extractTint) that the whole set inherits when it shows.
const HOLO_BASE = BASE + 'assets/holo/';
// bump HOLO_V whenever a holo image is re-cut/resized — same trap as the GLBs:
// these are JS-initiated fetches with no Cache-Control, so even a hard refresh
// can serve the stale cached copy without a changed URL
const HOLO_V = 2;
const holoImageCache = new Map();          // rel path -> {img, ready}
function holoImage(rel) {
  let e = holoImageCache.get(rel);
  if (!e) {
    const img = new Image();
    e = { img, ready: false, tint: null };
    img.onload = () => { e.ready = true; e.tint = extractTint(img); };
    img.src = HOLO_BASE + rel + '?v=' + HOLO_V;
    holoImageCache.set(rel, e);
  }
  return e;
}
let slides = null;      // {entries, idx, per, fade:{from,to,p}|null, fresh} for the current beat
let hlSlide = null;     // {items, shown, per, fresh} — progressive bullet list (conclusion highlights)
let holoToken = 0;      // guards a late image load from clobbering a newer holo
let wallHolo = null;    // the holo object the wall currently REPRESENTS (null when the
                        // stars board / boot title own it) — lets a jump detect staleness

// Progressive highlight list for the conclusion — items materialize one at a time
// (holo: {highlights: [...]}), paced across the line like image slides.
function drawHighlights(items, upto) {
  const ctx = heroTex.getContext(); const W = 1280, H = 720;
  ctx.fillStyle = '#050b14'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(20,90,150,0.10)'; ctx.fillRect(40, 40, W - 80, H - 80);
  ctx.strokeStyle = 'rgba(150,225,255,0.95)'; ctx.lineWidth = 4; const m = 56, L = 100;
  const corner = (x, y, dx, dy) => { ctx.beginPath(); ctx.moveTo(x, y + dy * L); ctx.lineTo(x, y);
    ctx.lineTo(x + dx * L, y); ctx.stroke(); };
  corner(m, m, 1, 1); corner(W - m, m, -1, 1); corner(m, H - m, 1, -1); corner(W - m, H - m, -1, -1);
  ctx.textAlign = 'center'; ctx.fillStyle = '#dffaff';
  ctx.font = '700 58px Segoe UI, sans-serif';
  ctx.fillText('MISSION HIGHLIGHTS', W / 2, 142);
  ctx.strokeStyle = 'rgba(120,210,255,0.8)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(W / 2 - 265, 172); ctx.lineTo(W / 2 + 265, 172); ctx.stroke();
  ctx.textAlign = 'left'; ctx.font = '400 45px Segoe UI, sans-serif';
  for (let i = 0; i <= upto && i < items.length; i++) {
    const y = 260 + i * 85;
    ctx.fillStyle = 'rgba(150,225,255,0.95)'; ctx.fillText('◆', 212, y);
    ctx.fillStyle = 'rgba(190,235,255,0.92)'; ctx.fillText(items[i], 278, y);
  }
  heroTex.update();
}
function drawImageSlide(a, b, p) {
  const ctx = heroTex.getContext(); const W = 1280, H = 720;
  ctx.fillStyle = '#04080e'; ctx.fillRect(0, 0, W, H);      // letterbox stays a dark panel
  const put = (e, alpha) => {
    if (!e || !e.ready) return;
    const iw = e.img.naturalWidth, ih = e.img.naturalHeight;
    const s = Math.min(W / iw, H / ih);
    const dw = iw * s, dh = ih * s;
    ctx.globalAlpha = alpha;
    ctx.drawImage(e.img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  };
  put(a, b ? 1 - p : 1); if (b) put(b, p);   // true cross-dissolve — the outgoing image must GO,
  ctx.globalAlpha = 1;                        // or a wider previous image peeks out beside a narrower one
  heroTex.update();
}

const HOLO_W = 4.6, HOLO_H = 2.6, HOLO_Y = 3.15, HOLO_Z = -1.6;  // small special-moment panel, mid-stage between podium and wall
const holoGroup = new BABYLON.TransformNode('holoGroup', scene);  // panel + bezel + cone show/hide together
const holo = BABYLON.MeshBuilder.CreatePlane('holo', { width: HOLO_W, height: HOLO_H, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, scene);
holo.position.set(0, HOLO_Y, HOLO_Z); holo.parent = holoGroup;
holo.rotation.y = Math.PI;                 // face the front (camera) un-mirrored
const holoMat = new BABYLON.ShaderMaterial('holoMat', scene,
  { vertex: 'holo', fragment: 'holo' },
  { attributes: ['position', 'normal', 'uv'], uniforms: ['worldViewProjection', 'world', 'time', 'reveal', 'tint', 'cameraPosition'], samplers: ['contentTex'] });
holoMat.setTexture('contentTex', holoContent);
holoMat.setColor3('tint', new Color3(0.45, 0.85, 1.0));
holoMat.setFloat('reveal', 0.0);
holoMat.backFaceCulling = false;
holoMat.needAlphaBlending = () => true;
holoMat.alphaMode = BABYLON.Engine.ALPHA_COMBINE;
holo.material = holoMat;
let holoReveal = 0, holoRevealTarget = 0;  // hidden until a highlights/award beat (see holoVisible)

// --- physical presence: a glowing 3D bezel frame around the panel ---
const bezelMat = new BABYLON.StandardMaterial('bezelMat', scene);
bezelMat.emissiveColor = new Color3(0.5, 1.2, 1.6); bezelMat.disableLighting = true;
const bezelGroup = new BABYLON.TransformNode('bezel', scene);
bezelGroup.position.set(0, HOLO_Y, HOLO_Z + 0.02); bezelGroup.parent = holoGroup;
const bar = (w, h, x, y) => { const b = BABYLON.MeshBuilder.CreateBox('bz', { width: w, height: h, depth: 0.1 }, scene);
  b.material = bezelMat; b.position.set(x, y, 0); b.parent = bezelGroup; b.isPickable = false; return b; };
const fw = HOLO_W + 0.34, fh = HOLO_H + 0.34, th = 0.05;
bar(fw, th, 0, fh / 2); bar(fw, th, 0, -fh / 2); bar(th, fh, fw / 2, 0); bar(th, fh, -fw / 2, 0);

// projector cone from the floor up to the panel
const coneH = HOLO_Y - HOLO_H / 2 - 0.1;
const cone = BABYLON.MeshBuilder.CreateCylinder('cone', { height: coneH, diameterTop: 3.6, diameterBottom: 0.5, tessellation: 28, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, scene);
cone.position.set(0, coneH / 2, HOLO_Z); cone.isPickable = false; cone.parent = holoGroup;
const coneMat = new BABYLON.StandardMaterial('coneMat', scene);
coneMat.emissiveColor = new Color3(0.12, 0.42, 0.7); coneMat.disableLighting = true;
coneMat.alpha = 0.06; coneMat.alphaMode = BABYLON.Engine.ALPHA_ADD; coneMat.backFaceCulling = false;
cone.material = coneMat;

// rising holographic dust within the cone
const dust = new BABYLON.ParticleSystem('dust', 600, scene);
dust.particleTexture = new BABYLON.Texture(BASE + 'assets/env/flare.png', scene);
dust.emitter = new V3(0, 0.1, HOLO_Z);
dust.minEmitBox = new V3(-1.7, 0, -0.4); dust.maxEmitBox = new V3(1.7, 0, 0.4);
dust.color1 = new BABYLON.Color4(0.4, 0.8, 1, 0.5); dust.color2 = new BABYLON.Color4(0.6, 0.9, 1, 0.3);
dust.colorDead = new BABYLON.Color4(0.2, 0.5, 0.9, 0);
dust.minSize = 0.015; dust.maxSize = 0.05; dust.minLifeTime = 3; dust.maxLifeTime = 6;
dust.emitRate = 70; dust.direction1 = new V3(-0.05, 1, -0.05); dust.direction2 = new V3(0.05, 1, 0.05);
dust.minEmitPower = 0.15; dust.maxEmitPower = 0.4; dust.gravity = new V3(0, 0.05, 0);
dust.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
holoGroup.setEnabled(false);                            // the holo starts hidden; screenshots live on the wall
function holoVisible(on) {
  if (on) { holoGroup.setEnabled(true); holoReveal = 0; holoRevealTarget = 1; dust.start(); }
  else { holoRevealTarget = 0; dust.stop(); }
}

// ================================================================ SET (v2)
// TV-stage set built from LIGHT, not architecture: LED wall + hero screen, side
// light blades, podium rings, floor glow pools. Everything is emissive/unlit —
// no extra real lights, no render-target reflections (Chromebook budget). One
// tint drives every element; image beats retarget it from the screenshot palette.
const TINT_DEFAULT = new Color3(0.2, 0.75, 1.0);
let tintCur = TINT_DEFAULT.clone(), tintTarget = TINT_DEFAULT.clone();
const setSetTint = c => { tintTarget = c || TINT_DEFAULT; };

// dominant-colour extraction: saturation-weighted average of a downsampled copy,
// normalised so the tint stays luminous. Greyscale/near-dark → null (default tint).
const tintCanvas = document.createElement('canvas');
tintCanvas.width = 32; tintCanvas.height = 18;
function extractTint(img) {
  try {
    const c = tintCanvas.getContext('2d', { willReadFrequently: true });
    c.drawImage(img, 0, 0, 32, 18);
    const d = c.getImageData(0, 0, 32, 18).data;
    // 12 hue buckets weighted by chroma×brightness; the DOMINANT bucket wins, so a
    // mixed palette keeps a real hue instead of averaging out to grey/white
    const H = 12;
    const wsum = new Array(H).fill(0), rs = new Array(H).fill(0), gs = new Array(H).fill(0), bs = new Array(H).fill(0);
    for (let i = 0; i < d.length; i += 4) {
      const R = d[i] / 255, G = d[i + 1] / 255, B = d[i + 2] / 255;
      const mx = Math.max(R, G, B), mn = Math.min(R, G, B), ch = mx - mn;
      if (ch < 0.08 || mx < 0.15) continue;                // grey/near-black pixels don't vote
      let h;
      if (mx === R) h = ((G - B) / ch + 6) % 6; else if (mx === G) h = (B - R) / ch + 2; else h = (R - G) / ch + 4;
      const k = Math.floor(h / 6 * H) % H;
      const wt = ch * mx;
      wsum[k] += wt; rs[k] += R * wt; gs[k] += G * wt; bs[k] += B * wt;
    }
    let best = 0; for (let k = 1; k < H; k++) if (wsum[k] > wsum[best]) best = k;
    if (wsum[best] < 0.3) return null;
    const r = rs[best] / wsum[best], g = gs[best] / wsum[best], b = bs[best] / wsum[best];
    const mx2 = Math.max(r, g, b) || 1;
    return new Color3(0.08 + 0.92 * (r / mx2), 0.08 + 0.92 * (g / mx2), 0.08 + 0.92 * (b / mx2));
  } catch (e) { return null; }                             // tainted canvas (file://) etc.
}

// ---- LED wall: opaque tile field, sparse winking dots, edge falloff to darkness ----
BABYLON.Effect.ShadersStore['ledwallVertexShader'] = `
precision highp float;
attribute vec3 position; attribute vec2 uv;
uniform mat4 worldViewProjection; varying vec2 vUV;
void main(){ vUV=uv; gl_Position=worldViewProjection*vec4(position,1.0); }`;
BABYLON.Effect.ShadersStore['ledwallFragmentShader'] = `
precision highp float; varying vec2 vUV;
uniform float time; uniform vec3 tint; uniform float pulse;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
void main(){
  vec2 cells = vec2(72.0, 26.0);
  vec2 cell = floor(vUV*cells), f = fract(vUV*cells);
  float h = hash(cell);
  float tw = 0.5 + 0.5*sin(time*(0.2+0.6*h) + h*43.0);          // slow per-cell twinkle
  float lit = smoothstep(0.90, 0.995, h*0.72 + 0.28*tw);         // sparse population
  vec2 d = abs(f-0.5);
  float dotm = 1.0 - smoothstep(0.16, 0.4, max(d.x,d.y));        // soft square LED
  float rows = 0.025 + 0.02*sin(vUV.y*34.0 - time*0.5);          // faint banding drift
  // slow travelling brightness column (constant low-level life)
  float colw = 0.06*pow(0.5 + 0.5*sin(vUV.x*6.283 - time*0.21), 6.0);
  // radial pulse wave on image changes — Dale likes this one; the wall "ovals"
  // were the beam-cone silhouettes, not this ripple
  float rc = distance(vUV, vec2(0.5, 0.45));
  float band = exp(-pow((rc - (1.0 - pulse)*0.9)*7.0, 2.0)) * pulse * 0.9;
  float edge = smoothstep(0.0,0.10,vUV.x)*smoothstep(0.0,0.10,1.0-vUV.x)*smoothstep(0.0,0.16,1.0-vUV.y);
  vec3 col = (tint*0.03 + tint*rows + tint*colw + tint*lit*dotm*2.6 + tint*band) * edge;
  gl_FragColor = vec4(col, 1.0);
}`;
const WALL_Z = -5.0;
const wall = BABYLON.MeshBuilder.CreatePlane('wall', { width: 18, height: 6.6 }, scene);
wall.position.set(0, 3.3, WALL_Z - 0.08); wall.rotation.y = Math.PI; wall.isPickable = false;
const wallMat = new BABYLON.ShaderMaterial('wallMat', scene, { vertex: 'ledwall', fragment: 'ledwall' },
  { attributes: ['position', 'uv'], uniforms: ['worldViewProjection', 'time', 'tint', 'pulse'] });
wallMat.backFaceCulling = false;
wallMat.setColor3('tint', tintCur); wallMat.setFloat('time', 0); wallMat.setFloat('pulse', 0);
wall.material = wallMat;
let wallPulse = 0, beamFlare = 0;      // transients: image-change wave on the wall / beam flare on speaker change

// shared dark structural material (truss, plinths, wing backs, fixture bases) —
// unlit: lit Standard mats blow out white under the PBR-scaled spot intensities
const darkMat = new BABYLON.StandardMaterial('darkMat', scene);
darkMat.disableLighting = true; darkMat.emissiveColor = new Color3(0.02, 0.026, 0.042);
darkMat.diffuseColor = Color3.Black(); darkMat.specularColor = Color3.Black();

// The real MHS logo (assets/logo/, Dale 2026-08-21) — used by the wing decals
// below, the overhead emblem, and the podium-top decal. Set to null to strip
// all three back to the original look (overhead reverts to the drawn droplet).
// Bump the ?v= if the file is re-cut (same JS-fetch cache trap as holo images).
const EMBLEM_LOGO = { src: BASE + 'assets/logo/mhs-logo.png?v=1', aspect: 1378 / 1141 };
// wing logos: the mark on BOTH LED side walls (they read as plain grey at
// several camera angles) — unlit true-colour decals riding just proud of each
// wing face, igniting with the wall group during the boot
let wingLogoMat = null; const wingLogos = [];
if (EMBLEM_LOGO) {
  wingLogoMat = new BABYLON.StandardMaterial('wingLogoMat', scene);
  wingLogoMat.disableLighting = true; wingLogoMat.emissiveColor = Color3.Black();
  wingLogoMat.diffuseColor = Color3.Black(); wingLogoMat.specularColor = Color3.Black();
  const wlt = new BABYLON.Texture(EMBLEM_LOGO.src, scene);
  wlt.hasAlpha = true;
  wingLogoMat.emissiveTexture = wlt; wingLogoMat.opacityTexture = wlt;
  wingLogoMat.alphaMode = BABYLON.Engine.ALPHA_COMBINE;
}

// ---- angled LED side wings: the wall's edges fold downstage, closing the stage
// into a three-sided room (same shader/material — pulses travel onto the wings).
// Each wing HINGES flush at the wall edge (no seam) and carries a dark backing
// slab + plinth foot, so edge-on it reads as built structure, not a paper sheet.
const WING_A = 0.62;                                   // ~36° fold
[1, -1].forEach(s => {
  const hinge = new BABYLON.TransformNode('wingHinge' + s, scene);
  hinge.position.set(s * 9, 3.3, WALL_Z - 0.08);
  hinge.rotation.y = -s * WING_A;                      // fold the far edge downstage
  const wing = BABYLON.MeshBuilder.CreatePlane('wing' + s, { width: 7, height: 6.6 }, scene);
  wing.position.set(s * 3.5, 0, 0); wing.rotation.y = Math.PI;
  wing.parent = hinge; wing.isPickable = false; wing.material = wallMat;
  const back = BABYLON.MeshBuilder.CreateBox('wingBack' + s, { width: 7, height: 6.6, depth: 0.22 }, scene);
  back.position.set(s * 3.5, 0, -0.13); back.parent = hinge; back.isPickable = false; back.material = darkMat;
  const foot = BABYLON.MeshBuilder.CreateBox('wingFoot' + s, { width: 7.2, height: 0.42, depth: 0.72 }, scene);
  foot.position.set(s * 3.5, -3.09, 0.08); foot.parent = hinge; foot.isPickable = false; foot.material = darkMat;
  if (wingLogoMat) {
    const wl = BABYLON.MeshBuilder.CreatePlane('wingLogo' + s, { width: 4.2, height: 4.2 / EMBLEM_LOGO.aspect }, scene);
    wl.position.set(s * 3.5, 0.3, 0.06);               // centred on the wing face, just proud of the LED surface
    wl.rotation.y = Math.PI;                           // face downstage with the wing
    wl.parent = hinge; wl.isPickable = false; wl.material = wingLogoMat;
    wingLogos.push(wl);
  }
});

// ---- wall plinth: a low dark riser so the wall SITS on structure ----
const plinth = BABYLON.MeshBuilder.CreateBox('plinth', { width: 18.8, height: 0.42, depth: 0.9 }, scene);
plinth.position.set(0, 0.21, WALL_Z - 0.05); plinth.isPickable = false; plinth.material = darkMat;

// ---- overhead truss: the rig everything hangs from (blades run INTO it) ----
const truss = BABYLON.MeshBuilder.CreateBox('truss', { width: 20, height: 0.55, depth: 0.85 }, scene);
truss.position.set(0, 7.15, -3.1); truss.isPickable = false; truss.material = darkMat; truss.applyFog = false;
const fixtureMat = new BABYLON.StandardMaterial('fixtureMat', scene);
fixtureMat.disableLighting = true; fixtureMat.emissiveColor = tintCur.scale(1.3);
for (let i = 0; i < 14; i++) {
  const fx = BABYLON.MeshBuilder.CreateBox('fx' + i, { size: 0.14 }, scene);
  fx.position.set(-7.8 + i * 1.2, 6.83, -3.1); fx.isPickable = false;
  fx.material = fixtureMat; fx.applyFog = false;
}

// ---- beam rig: narrow additive cones hanging off the truss, slowly sweeping.
// Fake "light through haze" — no volumetric post. Flare on speaker changes,
// faster + brighter during the celebration. ----
// Spotlight SHAFTS from the truss + bright landing POOLS, moving as one light.
// The shaft is a slim clean cone (no caps, no fade-gradient, tiny side-sway —
// each of those produced "ovals on the wall" in past rounds); it runs past the
// floor so the opaque floor cuts it exactly where its pool sits. The bright
// pool anchors the read: this light lands HERE, on the stage floor.
const beamShaftMat = new BABYLON.StandardMaterial('beamShaftMat', scene);
beamShaftMat.disableLighting = true; beamShaftMat.emissiveColor = tintCur.clone();
beamShaftMat.alpha = 0.1; beamShaftMat.alphaMode = BABYLON.Engine.ALPHA_ADD; beamShaftMat.backFaceCulling = false;
const beams = [];
// Outboard only (beside the columns) so no beam ever crosses the hero screen's
// frame region; NO_CAP kills the glowing end-cap ovals; the cones run past the
// floor so the shaft visibly LANDS on the floor instead of ending mid-air.
// each beam also owns a floor POOL — the bright ellipse a real spotlight throws
// on the stage floor; it tracks the beam's sweep every frame
const poolTex = new BABYLON.DynamicTexture('poolTex', { width: 128, height: 128 }, scene, false);
{ const g = poolTex.getContext();
  const rad = g.createRadialGradient(64, 64, 4, 64, 64, 63);
  rad.addColorStop(0, 'rgba(255,255,255,0.85)'); rad.addColorStop(0.45, 'rgba(255,255,255,0.3)');
  rad.addColorStop(1, 'rgba(255,255,255,0)');
  g.clearRect(0, 0, 128, 128); g.fillStyle = rad; g.fillRect(0, 0, 128, 128); poolTex.update(); }
poolTex.hasAlpha = true;
const poolMat = new BABYLON.StandardMaterial('poolMat', scene);
poolMat.disableLighting = true; poolMat.emissiveColor = tintCur.scale(0.5);
poolMat.opacityTexture = poolTex; poolMat.alphaMode = BABYLON.Engine.ALPHA_ADD;
[-7.8, -6.4, -5.0, 5.0, 6.4, 7.8].forEach((bx, i) => {
  const pivot = new BABYLON.TransformNode('beamP' + i, scene);
  pivot.position.set(bx, 7.0, -3.0);
  pivot.rotation.x = -0.42;                            // NEGATIVE = downstage. (+x rotation leaned the shafts INTO the wall —
                                                       // the root cause of every "spotlight lands on the wall" report)
  const cone = BABYLON.MeshBuilder.CreateCylinder('beam' + i, { height: 10.5, diameterTop: 0.15, diameterBottom: 0.9, tessellation: 16, cap: BABYLON.Mesh.NO_CAP }, scene);
  cone.position.y = -5.25; cone.parent = pivot; cone.isPickable = false;   // pierces the floor at any sweep angle — the floor cuts it at the pool
  cone.material = beamShaftMat; cone.applyFog = false;
  const pool = BABYLON.MeshBuilder.CreatePlane('beamPool' + i, { size: 4.2 }, scene);
  pool.rotation.x = Math.PI / 2; pool.position.set(bx, 0.02, 0);
  pool.isPickable = false; pool.material = poolMat;
  beams.push({ pivot, pool, phase: i * 1.7, speed: 0.32 + (i % 3) * 0.07 });
});
const beamDown = new V3(0, -1, 0);

// ---- ambient motes: the air itself gets parallax ----
const motes = new BABYLON.ParticleSystem('motes', 220, scene);
motes.particleTexture = new BABYLON.Texture(BASE + 'assets/env/flare.png', scene);
motes.emitter = new V3(0, 3, 0);
motes.minEmitBox = new V3(-8, -2.8, -4); motes.maxEmitBox = new V3(8, 2.8, 4);
motes.color1 = new BABYLON.Color4(0.5, 0.75, 1, 0.22); motes.color2 = new BABYLON.Color4(0.7, 0.85, 1, 0.12);
motes.colorDead = new BABYLON.Color4(0.4, 0.6, 1, 0);
motes.minSize = 0.015; motes.maxSize = 0.05; motes.minLifeTime = 6; motes.maxLifeTime = 12;
motes.emitRate = 22; motes.direction1 = new V3(-0.04, 0.02, -0.04); motes.direction2 = new V3(0.04, 0.09, 0.04);
motes.minEmitPower = 0.1; motes.maxEmitPower = 0.3; motes.gravity = new V3(0, 0.01, 0);
motes.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD; motes.start();

// ---- mission emblem above the truss: the identity anchor (The Voice "V") ----
// EMBLEM_LOGO (declared up by darkMat — the wings need it first) selects the
// real logo; null → the drawn water-droplet below, kept for reuse.
// NOTE: StandardMaterial's emissiveTexture REPLACES emissiveColor (it is not
// tinted by it) — so the water-blue must be painted into the texture itself.
const emblemTex = new BABYLON.DynamicTexture('emblemTex', { width: 256, height: 256 }, scene, true);
{ const g = emblemTex.getContext(); g.clearRect(0, 0, 256, 256);
  g.strokeStyle = '#4da6ff'; g.lineWidth = 10;
  g.beginPath(); g.arc(128, 132, 96, 0, Math.PI * 2); g.stroke();          // ring — water blue
  const dropGrad = g.createLinearGradient(0, 52, 0, 222);
  dropGrad.addColorStop(0, '#9fd1ff'); dropGrad.addColorStop(1, '#2f7dd6');
  g.fillStyle = dropGrad;
  g.beginPath(); g.moveTo(128, 52);                                        // water droplet — blue gradient
  g.bezierCurveTo(168, 112, 186, 142, 186, 168);
  g.bezierCurveTo(186, 202, 160, 222, 128, 222);
  g.bezierCurveTo(96, 222, 70, 202, 70, 168);
  g.bezierCurveTo(70, 142, 88, 112, 128, 52);
  g.fill(); emblemTex.update(); }
emblemTex.hasAlpha = true;
const emblemMat = new BABYLON.StandardMaterial('emblemMat', scene);
emblemMat.disableLighting = true;
emblemMat.emissiveColor = Color3.Black();              // emissive colour ADDS to the texture — must be black or it washes it to white
let emblemW = 2.3, emblemH = 2.3;                      // droplet: square
if (EMBLEM_LOGO) {
  const logoTex = new BABYLON.Texture(EMBLEM_LOGO.src, scene);
  logoTex.hasAlpha = true;
  emblemMat.emissiveTexture = logoTex; emblemMat.opacityTexture = logoTex;
  emblemMat.alphaMode = BABYLON.Engine.ALPHA_COMBINE;  // true logo colours (additive washed them out)
  emblemW = 3.1; emblemH = 3.1 / EMBLEM_LOGO.aspect;
} else {
  emblemMat.emissiveTexture = emblemTex; emblemMat.opacityTexture = emblemTex;
  emblemMat.alphaMode = BABYLON.Engine.ALPHA_ADD;
}
const emblem = BABYLON.MeshBuilder.CreatePlane('emblem', { width: emblemW, height: emblemH }, scene);
emblem.position.set(0, 8.9, -3.6); emblem.rotation.y = Math.PI; emblem.isPickable = false;   // fully above the truss
emblem.material = emblemMat; emblem.applyFog = false;

// ---- hero screen: the screenshots, drawn CLEAN (no holo treatment) ----
const HERO_W = 8.0, HERO_H = 4.5, HERO_Y = 3.65;
const heroTex = new BABYLON.DynamicTexture('heroTex', { width: 1280, height: 720 }, scene, true);
const hero = BABYLON.MeshBuilder.CreatePlane('hero', { width: HERO_W, height: HERO_H }, scene);
hero.position.set(0, HERO_Y, WALL_Z); hero.rotation.y = Math.PI; hero.isPickable = false;
hero.applyFog = false;                                     // the image reads true, not fog-dimmed
const heroMat = new BABYLON.StandardMaterial('heroMat', scene);
heroMat.emissiveTexture = heroTex; heroMat.disableLighting = true;
heroMat.diffuseColor = Color3.Black(); heroMat.specularColor = Color3.Black();
hero.material = heroMat;
// glowing frame around the hero screen (same look as the holo bezel)
const heroFrameMat = new BABYLON.StandardMaterial('heroFrameMat', scene);
heroFrameMat.emissiveColor = new Color3(0.5, 1.2, 1.6); heroFrameMat.disableLighting = true;
const heroFrame = new BABYLON.TransformNode('heroFrame', scene);
heroFrame.position.set(0, HERO_Y, WALL_Z + 0.05);
{ const fw2 = HERO_W + 0.22, fh2 = HERO_H + 0.22, th2 = 0.06;
  const hbar = (w, h, x, y) => { const b = BABYLON.MeshBuilder.CreateBox('hf', { width: w, height: h, depth: 0.08 }, scene);
    b.material = heroFrameMat; b.position.set(x, y, 0); b.parent = heroFrame; b.isPickable = false; b.applyFog = false; };
  hbar(fw2, th2, 0, fh2 / 2); hbar(fw2, th2, 0, -fh2 / 2); hbar(th2, fh2, fw2 / 2, 0); hbar(th2, fh2, -fw2 / 2, 0); }

function heroIdle(dark) {  // between-image state: dark panel + faint grid; the mission
  const ctx = heroTex.getContext(); const W = 1280, H = 720;   // watermark is skipped when the holo is up in front (it bled through)
  ctx.fillStyle = '#050b14'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(80,160,230,0.07)'; ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  if (!dark) {
    ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(140,205,255,0.16)';
    ctx.font = '700 84px Segoe UI, sans-serif'; ctx.fillText('MISSION HYDROSCI', W / 2, H / 2 + 8);
    ctx.font = '400 30px Segoe UI, sans-serif'; ctx.fillStyle = 'rgba(140,205,255,0.11)';
    ctx.fillText('FINAL CEREMONY', W / 2, H / 2 + 58);
  }
  heroTex.update();
}
heroIdle(true);                            // pre-show standby: dark grid, no watermark (the boot title takes over)

// cold-open title card — blooms on the hero screen at m1's impact, full
// brightness (heroIdle's watermark is the faint between-images version)
function drawBootTitle() {
  wallHolo = null;                         // the title owns the wall — beat 0's holo (or a restore) replaces it
  const ctx = heroTex.getContext(); const W = 1280, H = 720;
  ctx.fillStyle = '#050b14'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(150,225,255,0.95)'; ctx.lineWidth = 4; const m = 56, L = 90;
  const corner = (x, y, dx, dy) => { ctx.beginPath(); ctx.moveTo(x, y + dy * L); ctx.lineTo(x, y);
    ctx.lineTo(x + dx * L, y); ctx.stroke(); };
  corner(m, m, 1, 1); corner(W - m, m, -1, 1); corner(m, H - m, 1, -1); corner(W - m, H - m, -1, -1);
  ctx.textAlign = 'center'; ctx.fillStyle = '#eaffff';
  ctx.font = '700 96px Segoe UI, sans-serif'; ctx.fillText('MISSION HYDROSCI', W / 2, H / 2 - 10);
  ctx.strokeStyle = 'rgba(120,210,255,0.8)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(W / 2 - 300, H / 2 + 40); ctx.lineTo(W / 2 + 300, H / 2 + 40); ctx.stroke();
  ctx.font = '400 44px Segoe UI, sans-serif'; ctx.fillStyle = 'rgba(170,225,255,0.9)';
  ctx.fillText('FINAL CEREMONY', W / 2, H / 2 + 104);
  heroTex.update();
}

// ---- light columns: floor-to-TRUSS (nothing terminates mid-air) — each rises
// from a small dark base fixture and runs up into the overhead truss ----
const bladeMat = new BABYLON.StandardMaterial('bladeMat', scene);
bladeMat.disableLighting = true; bladeMat.emissiveColor = tintCur.scale(1.5);
[ { x:  5.4, z: -2.7, tilt: -0.05 },
  { x:  6.6, z: -3.1, tilt: -0.03 },
  { x:  7.8, z: -3.5, tilt: -0.05 },
  { x: -5.4, z: -2.7, tilt:  0.05 },
  { x: -6.6, z: -3.1, tilt:  0.03 },
  { x: -7.8, z: -3.5, tilt:  0.05 },
].forEach((s, i) => {
  const b = BABYLON.MeshBuilder.CreateBox('blade' + i, { width: 0.15, height: 7.0, depth: 0.15 }, scene);
  b.position.set(s.x, 3.5, s.z); b.rotation.z = s.tilt;
  b.material = bladeMat; b.isPickable = false; b.applyFog = false;
  const base = BABYLON.MeshBuilder.CreateBox('bladeBase' + i, { width: 0.44, height: 0.22, depth: 0.44 }, scene);
  base.position.set(s.x, 0.11, s.z); base.isPickable = false; base.material = darkMat;
});

// ---- floor glow pools: fake the glossy-floor light catch (no RTT mirrors) ----
const glowTex = new BABYLON.DynamicTexture('glowTex', { width: 128, height: 128 }, scene, false);
{ const g = glowTex.getContext();
  const rad = g.createRadialGradient(64, 64, 4, 64, 64, 63);
  rad.addColorStop(0, 'rgba(255,255,255,0.55)'); rad.addColorStop(0.5, 'rgba(255,255,255,0.16)');
  rad.addColorStop(1, 'rgba(255,255,255,0)');
  g.clearRect(0, 0, 128, 128); g.fillStyle = rad; g.fillRect(0, 0, 128, 128); glowTex.update(); }
glowTex.hasAlpha = true;
const glowMat = new BABYLON.StandardMaterial('glowMat', scene);
glowMat.disableLighting = true; glowMat.emissiveColor = tintCur.scale(0.5);
glowMat.opacityTexture = glowTex; glowMat.alphaMode = BABYLON.Engine.ALPHA_ADD;
const glowAt = (x, z, size) => { const p = BABYLON.MeshBuilder.CreatePlane('glow', { size }, scene);
  p.rotation.x = Math.PI / 2; p.position.set(x, 0.015, z); p.material = glowMat; p.isPickable = false; };
glowAt(5.4, -2.7, 2.2); glowAt(-5.4, -2.7, 2.2);           // column feet (no podium pool —
glowAt(6.6, -3.1, 1.9); glowAt(-6.6, -3.1, 1.9);           // it washed the podium to white;
glowAt(7.8, -3.5, 2.2); glowAt(-7.8, -3.5, 2.2);           // dark floor + neon rims instead)

// ---- tiered podium platform: two shallow DARK tiers with edge-lit neon rims
// (The Voice island). Speakers physically step up — the per-frame character
// loop ramps holder.y by distance to the platform centre. All tier bodies are
// unlit (lit Standard mats blow out white under the PBR-scaled spots). ----
const PODIUM_X = -2.4, PODIUM_Z = 2.6;
const ringMat = new BABYLON.StandardMaterial('ringMat', scene);
ringMat.disableLighting = true; ringMat.emissiveColor = tintCur.scale(1.3);
const tierBody = (r, y0, h) => { const c = BABYLON.MeshBuilder.CreateCylinder('tier', { diameter: r * 2, height: h, tessellation: 64 }, scene);
  c.position.set(PODIUM_X, y0 + h / 2, PODIUM_Z); c.material = darkMat; c.isPickable = false; return c; };
const tierRim = (r, y, th2) => { const t = BABYLON.MeshBuilder.CreateTorus('rim', { diameter: r * 2, thickness: th2, tessellation: 64 }, scene);
  t.position.set(PODIUM_X, y, PODIUM_Z); t.material = ringMat; t.isPickable = false; return t; };
tierBody(2.6, 0, 0.10); tierBody(2.0, 0.10, 0.10);
tierRim(2.6, 0.10, 0.05); tierRim(2.0, 0.20, 0.045); tierRim(2.95, 0.02, 0.035);   // tier edges + floor skirt ring

// ---- podium logo: the MHS mark laid flat on the TOP tier surface, under the
// speaker (Dale 2026-08-21) — unlit alpha decal in true colours, own texture
// instance (floor orientation flips must not touch the overhead emblem);
// ignites with the floor group during the boot (visibility = fFloor) ----
let podiumLogo = null;
if (EMBLEM_LOGO) {
  const w = 2.8, h = 2.8 / EMBLEM_LOGO.aspect;
  podiumLogo = BABYLON.MeshBuilder.CreatePlane('podiumLogo', { width: w, height: h }, scene);
  podiumLogo.rotation.x = Math.PI / 2;                 // flat on the tier, face up (same as the glow pools)
  podiumLogo.rotation.z = Math.PI;                     // spin 180° in-plane — reads upright from the AUDIENCE side
  podiumLogo.position.set(PODIUM_X, 0.203, PODIUM_Z);  // 3mm above the tier top — no z-fighting
  podiumLogo.isPickable = false;
  const plm = new BABYLON.StandardMaterial('podiumLogoMat', scene);
  plm.disableLighting = true; plm.emissiveColor = Color3.Black();
  plm.diffuseColor = Color3.Black(); plm.specularColor = Color3.Black();
  const plt = new BABYLON.Texture(EMBLEM_LOGO.src, scene);
  plt.hasAlpha = true;
  plm.emissiveTexture = plt; plm.opacityTexture = plt;
  plm.alphaMode = BABYLON.Engine.ALPHA_COMBINE;
  podiumLogo.material = plm;
}

// ---- LED floor arcs: slow angular chase circling the platform — fills the
// dead foreground the way The Voice floor rings do (additive, set-tint) ----
BABYLON.Effect.ShadersStore['floorringVertexShader'] = `
precision highp float;
attribute vec3 position; attribute vec2 uv;
uniform mat4 worldViewProjection; varying vec2 vUV;
void main(){ vUV=uv; gl_Position=worldViewProjection*vec4(position,1.0); }`;
BABYLON.Effect.ShadersStore['floorringFragmentShader'] = `
precision highp float; varying vec2 vUV;
uniform float time; uniform vec3 tint;
void main(){
  vec2 p = (vUV - 0.5) * 16.0;
  float r = length(p); float ang = atan(p.y, p.x);
  float a = 0.0;
  a += smoothstep(0.14, 0.03, abs(r - 3.5)) * (0.5 + 0.5*sin(ang*3.0 - time*0.50));
  a += smoothstep(0.14, 0.03, abs(r - 4.7)) * (0.5 + 0.5*sin(ang*4.0 + time*0.38 + 2.1));
  a += smoothstep(0.14, 0.03, abs(r - 5.9)) * (0.5 + 0.5*sin(ang*5.0 - time*0.29 + 4.2));
  a *= 0.42;
  gl_FragColor = vec4(tint * a, a);
}`;
const floorRingMat = new BABYLON.ShaderMaterial('floorRingMat', scene, { vertex: 'floorring', fragment: 'floorring' },
  { attributes: ['position', 'uv'], uniforms: ['worldViewProjection', 'time', 'tint'] });
floorRingMat.backFaceCulling = false;
floorRingMat.alphaMode = BABYLON.Engine.ALPHA_ADD;
floorRingMat.needAlphaBlending = () => true;
floorRingMat.setColor3('tint', tintCur); floorRingMat.setFloat('time', 0);
const floorRing = BABYLON.MeshBuilder.CreatePlane('floorRing', { size: 16 }, scene);
floorRing.rotation.x = Math.PI / 2; floorRing.position.set(PODIUM_X, 0.016, PODIUM_Z);
floorRing.isPickable = false; floorRing.material = floorRingMat;

// confetti for the celebration (started on demand) — the emit box spans the
// FULL stage width incl. the screen-right cast marks (the old ±4 box centred
// at +0.2 left the world −x side, screen-right in the ending shots, bare)
const confetti = new BABYLON.ParticleSystem('confetti', 1800, scene);
confetti.particleTexture = new BABYLON.Texture(BASE + 'assets/env/flare.png', scene);
confetti.emitter = new V3(-0.5, 6.5, 2.3);
confetti.minEmitBox = new V3(-7, 0, -1.2); confetti.maxEmitBox = new V3(7, 0.5, 2.2);
confetti.color1 = new BABYLON.Color4(1, 0.6, 0.2, 1); confetti.color2 = new BABYLON.Color4(0.4, 0.8, 1, 1);
confetti.colorDead = new BABYLON.Color4(1, 1, 1, 0);
confetti.minSize = 0.04; confetti.maxSize = 0.11; confetti.minLifeTime = 2.2; confetti.maxLifeTime = 4;
confetti.emitRate = 750; confetti.direction1 = new V3(-1, -2, -1); confetti.direction2 = new V3(1, -1, 1);
confetti.minEmitPower = 1; confetti.maxEmitPower = 3; confetti.gravity = new V3(0, -6, 0);
confetti.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;

// ================================================================ CHARACTERS
// screen-LEFT = +x (camera at alpha PI/2). v2 blocking: the waiting NPCs are
// FOREGROUND presenters at the frame edges — large in wide shots, clear of the
// wall's sightline. Toppo (MC) nearest the camera screen-RIGHT; Jasper+Anderson
// screen-LEFT; Aryn+Tera screen-RIGHT. To speak, a character walks a short arc
// to the PODIUM at centre (SPEAK_MARK), delivers, then walks back. Entrances and
// exits still run concurrently on offset arcs (see startOut/sendBack).
const STAGE = {
  Toppo:    { x: -5.1, z: 5.5 },                       // MC, downstage screen-right
  Jasper:   { x:  4.5, z: 4.7 },
  Anderson: { x:  3.6, z: 3.2 },
  Aryn:     { x: -5.5, z: 1.9 },                       // right side clears the raised platform (homes stay OFF the tiers)
  Tera:     { x: -5.9, z: 3.9 },
};
// COLD-OPEN TABLEAU: the whole company stands centre-stage in a loose staggered
// arc, downstage of (clear of) the podium platform, facing the audience —
// revealed as the boot lights come up, then dispersed to their marks at the m1
// impact. +x members sit on the +x side so the dispersal walks don't cross;
// Toppo centre — her walk at the impact is the step up to the podium.
const FORMATION = {
  Toppo:    { x: -0.7, z: 6.1 },
  Jasper:   { x:  1.9, z: 6.0 },
  Anderson: { x:  0.7, z: 5.6 },
  Aryn:     { x: -2.1, z: 5.6 },
  Tera:     { x: -3.3, z: 6.1 },
};
// cold-open state: t0=Infinity before Begin (stage held DARK behind the start
// overlay), stamped with the Begin click, nulled once the show proper starts
// (enterBeat) — every boot factor collapses to 1 when this is null.
let intro = { t0: Infinity, dispersed: false };
// pre-show MINGLE: statues read as broken (Dale 2026-08-21) — until the
// dispersal, the tableau CHATS: each pair faces each other and trades
// talk/gesture clips against listens on a shared clock, while the MC works the
// room, turning to a different teammate every few seconds. All of it is gated
// on `intro && !intro.dispersed`, so the dispersal cleanly takes over.
const CHAT_PAIRS = [['Jasper', 'Anderson'], ['Aryn', 'Tera']];
// varied conversational clips only — GestureUp is BANNED here: it's a single
// raised-arm point at the display, fine for one speaker referencing the screen
// mid-show, but a group doing it in unison read as a fascist salute (Dale
// 2026-08-21). Every mingle clip starts at a RANDOM phase (see setMingleClip),
// so even same-instant assignments can never gesture in sync.
const CHAT_TALKS = ['Talking1', 'Talking2', 'Talking3', 'TalkUpbeat'];
const CHAT_LISTENS = ['Listen', 'Idle', 'Fidget1', 'Fidget2'];
const mingle = { pairAt: [0, 0], pairPhase: [0, 1], mcAt: 0 };   // independent per-pair clocks — flips drift apart
function setMingleClip(c, clip) {
  c.mingleClip = c.groups[clip] ? clip : c.idleClip;
  const g = c.groups[c.mingleClip];
  if (g && !g.isPlaying) { g.play(true); g.setWeightForAllAnimatables(0); g.goToFrame(g.from + Math.random() * (g.to - g.from)); }
}
const SPEAK_MARK = new V3(-2.4, 0, 2.6);               // the podium centre — off-centre screen-right, beside the hero screen
const MARK_LOOK = new V3(-2.4, 1.82, 2.6);            // eye-level point AT the podium (speaker stands 0.2 up on the platform)
// Bodies at home angle toward this near-focus point (between podium and camera):
// they read three-quarter toward centre with faces open to camera; head-look does
// the actual speaker-watching on top.
const HOME_FOCUS = new V3(0.2, 1.7, 7.0);
const WALK_SPEED = { Toppo: 1.05, Tera: 0.88, Anderson: 0.98, Aryn: 1.06, Jasper: 1.12 }; // m/s (clip ground speed)
const EXPR = {
  proud:         { Happy: 0.7, 'Eyebrow Raise': 0.4 },
  encouraging:   { Happy: 0.9, 'Eyebrow Raise': 0.5 },
  thoughtful:    { 'Eyebrow Lower': 0.6, Serious: 0.3 },
  serious:       { Serious: 0.8, 'Eyebrow Lower': 0.3 },
  excited:       { Happy: 1.2, 'Eyebrow Raise': 0.7, Surprised: 0.5 },
  happy:         { Happy: 1.1, 'Eyebrow Raise': 0.3 },
  'slightly-sad': { Serious: 0.45, 'Eyebrow Lower': 0.4 },   // designer script's "(slightly sad)" — warm, not harsh
  neutral:       {},
};
// expression preset → mood-matched speaker delivery clip (Conversations pack)
const MOOD_CLIP = {     // lower-sliding clips favored; GestureUp also references the holo
  proud: 'TalkUpbeat', encouraging: 'TalkUpbeat', happy: 'TalkUpbeat', excited: 'TalkUpbeat',
  thoughtful: 'GestureUp', serious: 'GestureUp', neutral: 'GestureUp',
  sad: 'TalkSad', somber: 'TalkSad', 'slightly-sad': 'TalkSad',
};
// clips that loop and are shared across characters → start at a random phase (desync)
const DESYNC = new Set(['Fidget1', 'Fidget2', 'Idle', 'Listen', 'Clap', 'Cheer']);
const faceYaw = (fromV3, toV3) => Math.atan2(toV3.x - fromV3.x, toV3.z - fromV3.z);
const wrap = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const chars = {};        // name -> rig
const order = [script.layout.mc].concat(script.layout.group);

// bump GLB_V whenever a character .glb is rebuilt — browsers cache .glb aggressively
// (no cache-buster = a normal refresh keeps stale geometry). 6th arg forces the .glb
// loader so the ?v= query doesn't break Babylon's extension detection.
const GLB_V = 16;       // restored corrected Mocap Walk cycle
async function loadChar(name) {
  const r = await BABYLON.SceneLoader.ImportMeshAsync('', BASE + 'assets/characters/', name + '.glb?v=' + GLB_V, scene, null, '.glb');
  const holder = new BABYLON.TransformNode('h_' + name, scene);
  const pos = STAGE[name];
  holder.position.set(pos.x, 0, pos.z);
  const homeYaw = Math.atan2(HOME_FOCUS.x - pos.x, HOME_FOCUS.z - pos.z);  // home angles toward centre (see HOME_FOCUS)
  holder.rotation.y = homeYaw;
  const root = r.meshes.find(m => m.name === '__root__') || r.meshes[0];
  root.parent = holder;
  const meshes = r.meshes.filter(m => m.getTotalVertices && m.getTotalVertices() > 0);
  // alwaysSelectAsActiveMesh: skip frustum culling. The skinned bounding boxes are computed
  // from the bind pose; during a fast pose blend (talk→idle) the stale box can fall outside
  // the frustum and Babylon culls SOME submeshes → the character renders in pieces for a
  // frame ("falling apart / not fully formed"). Characters are always on stage, so this is free.
  meshes.forEach(m => { shadow.addShadowCaster(m); m.isVisible = false; m.alwaysSelectAsActiveMesh = true; });

  // animation groups: keep them all, crossfade to one "active" clip by weight (see setClip)
  const groups = {}; r.animationGroups.forEach(g => { groups[g.name] = g; g.stop(); g.setWeightForAllAnimatables(0); });
  const i = order.indexOf(name);
  const idleClip = groups['Idle'] ? 'Idle' : 'Fidget1';   // calm resting idle (the Fidget torso-twist read as bored/stretching when looped)
  const cheerClip  = ['Clap', 'Cheer', 'Clap', 'Cheer', 'Clap'][i % 5] || 'Clap';                          // mixed celebration
  // start the resting clip at full weight so the first revealed frame is posed (no T-pose)
  const fg = groups[idleClip]; if (fg) { fg.play(true); fg.setWeightForAllAnimatables(1); fg.goToFrame(fg.from + Math.random() * (fg.to - fg.from)); }

  // eyes: zOffset + auto-blink (closed-lid texture swap)
  let eyeMat = null;
  meshes.forEach(m => { if (/eye/i.test(m.name) && m.material) eyeMat = m.material; });
  let eye = null;
  if (eyeMat) {
    eyeMat.zOffset = -12;
    const open = eyeMat.albedoTexture;
    const closed = new BABYLON.Texture(BASE + 'assets/characters/_gen/' + name + '_eyeball_closed.png', scene, false, false);
    closed.hasAlpha = true;
    eye = { mat: eyeMat, open, closed, closedNow: false, end: 0, next: performance.now() + Math.random() * 3000 };
  }

  // morph map for the expression layer
  const morphs = {};
  meshes.forEach(m => { const mm = m.morphTargetManager; if (!mm) return;
    for (let i = 0; i < mm.numTargets; i++) { const t = mm.getTarget(i); (morphs[t.name] = morphs[t.name] || []).push(t); } });

  // jaw bone for talk + foot bones for the foot-lock (anti-slide)
  const sk = r.skeletons[0];
  const jawBone = sk && sk.bones.find(b => /jaw_master/i.test(b.name));
  const jawNode = jawBone && jawBone.getTransformNode();
  const jawRest = jawNode && (jawNode.rotationQuaternion ? jawNode.rotationQuaternion.clone() : Q.FromEulerVector(jawNode.rotation));
  const footL = sk && sk.bones.find(b => b.name === 'DEF-foot.L'); const footLNode = footL && footL.getTransformNode();
  const footR = sk && sk.bones.find(b => b.name === 'DEF-foot.R'); const footRNode = footR && footR.getTransformNode();

  const face = MHSAliveFace.attach(r, scene, { seed: Math.random() * 1000, intensity: 1.0 });
  const gaze = MHSGaze.attach(r, scene, { intensity: 1.0 });
  const head = MHSHeadLook.attach(r, scene, { intensity: 1.0 });

  chars[name] = {
    name, holder, meshes, home: new V3(pos.x, 0, pos.z), homeYaw,
    groups, cw: { [idleClip]: 1 }, clipTarget: idleClip, idleClip, cheerClip, deliveryClip: 'TalkBigIdea',
    speed: WALK_SPEED[name] || 1.0,
    state: 'home',                 // 'home' | 'out' | 'speak' | 'back'
    path: [], wp: 0, wantsOut: false,
    eye, morphs, jawNode, jawRest, face, gaze, head,
    footL: footLNode, footR: footRNode, lockWhich: null, lockX: 0, lockZ: 0,
    expr: EXPR.neutral, exprCur: {}, speaking: false,
  };
}

// ---- trophy (CC0, poly.pizza fLy8KmmD1t — see assets/models/README.md) ----
// "Toppo presents players with a trophy": during the ending celebration it rises
// center-stage with a slow spin under a warm spotlight. Missing model → the
// ending simply runs without it.
let trophy = null, trophyLight = null, trophyT = null;   // null = hidden; <0 = reveal delay; >=0 = animating
BABYLON.SceneLoader.ImportMeshAsync('', BASE + 'assets/models/', 'trophy.glb', scene).then(r => {
  const root = new BABYLON.TransformNode('trophyRoot', scene);
  const inner = r.meshes.find(m => m.name === '__root__') || r.meshes[0];
  inner.parent = root;
  const b = root.getHierarchyBoundingVectors();
  const s = 0.95 / Math.max(0.001, b.max.y - b.min.y);   // normalize to ~0.95m tall
  inner.scaling.scaleInPlace(s);
  const b2 = root.getHierarchyBoundingVectors();
  inner.position.y -= b2.min.y;                          // base sits at the root's y
  root.position.set(-0.9, -1.6, 3.2);                    // parked below the floor; rises out of the podium BESIDE the presenter (Toppo stays at the mark for the ending)
  r.meshes.forEach(m => { if (m.getTotalVertices && m.getTotalVertices() > 0) {
    m.alwaysSelectAsActiveMesh = true; shadow.addShadowCaster(m); } });
  trophyLight = new BABYLON.SpotLight('trophyLight', new V3(-0.9, 5.5, 5.8), new V3(0, -1, -0.5), Math.PI / 5, 8, scene);
  trophyLight.intensity = 0;
  trophyLight.diffuse = new Color3(1, 0.85, 0.55);       // warm gold key
  trophy = root;
}).catch(() => {});
function showTrophy() { trophyT = -1.2; }                // small delay: lets Toppo clear the mark
function hideTrophy() { trophyT = null; if (trophy) trophy.position.y = -1.6; if (trophyLight) trophyLight.intensity = 0; }

// ================================================================ SCRIPT PLAYER
const beats = script.beats;
let idx = -1, currentSpeaker = null, celebrating = false;
let lastSpeaker = null, runCount = 0;    // consecutive-line counter → per-line shot cycling
let textPlaying = false, hlWords = [], hlStart = 0, hlDur = 0, hlTimes = null;
// Per-line ElevenLabs voice clips + word timings (AUDIO_DIR/ceremony_audio.json),
// keyed by lineId — generated by mhsaudiotools from tools/ceremony-lines_v6.txt
// (see tools/export-lines.cjs). A beat whose lineId is absent from the manifest
// degrades to placeholder even-spacing.
// v6: the clip set is VERSIONED per script — assets/audio_v6/ holds the script-v4
// takes (15 copied + 12 regenerated). mhsaudio's babylon-manifest layout hardcodes
// every item's `audio` as "assets/audio/<Speaker>/<id>.mp3" regardless of its
// -out folder, so the prefix is remapped here on load (never hand-edit the
// manifest — a re-roll rewrites it). Bump AUDIO_V on every take change.
const LINE_AUDIO = {}, AUDIO_V = 1, AUDIO_DIR = BASE + 'assets/audio_v6/';
fetch(AUDIO_DIR + 'ceremony_audio.json?v=' + AUDIO_V).then(r => r.json())
  .then(m => (m.items || []).forEach(it => {
    LINE_AUDIO[it.id] = Object.assign({}, it, { audio: String(it.audio || '').replace(/^assets\/audio\//, AUDIO_DIR) });
  }))
  .catch(() => {});
// warm the holo image cache for every beat up-front (loads alongside the GLBs)
beats.forEach(b => ((b.holo && b.holo.images) || []).forEach(holoImage));
let lineAudio = null;
function stopLineAudio() { if (lineAudio) { try { lineAudio.pause(); } catch (e) {} lineAudio = null; } }
const bubble = document.getElementById('bubble');
const speakerNameEl = document.getElementById('speakerName');
const bubbleTextEl = document.getElementById('bubbleText');
const nextBtn = document.getElementById('nextBtn');
const replayBtn = document.getElementById('replayBtn');
// Controls live only while a line is on the bubble: disabled from each hand-off
// (walk + settle), the intro hold, and the celebration; enabled at showText and
// at finish (Next = Restart). The R key stays as the always-available escape.
function setControls(on) { nextBtn.disabled = !on; replayBtn.disabled = !on; }
// Stage-direction captions: the lower-third never sits empty while the show is
// live — hand-offs say "Walking to the stage.", the cold open says the ceremony
// is about to begin (with a TV-style "Music playing" note under it while m1 is
// actually available — Dale, 2026-09-10). Both are italic `.status` spans; the
// note is a smaller second line.
function setStatus(text, note) {
  bubbleTextEl.innerHTML = '';
  const s = document.createElement('span');
  s.className = 'status'; s.textContent = text;
  bubbleTextEl.appendChild(s);
  if (note) {
    const n = document.createElement('span');
    n.className = 'status note'; n.textContent = note;
    bubbleTextEl.appendChild(n);
  }
  bubble.classList.add('show');
}
// What's audible under a hand-off (Dale, 2026-09-10): the walk-up groove, which
// fades in the walk's last quarter, and the welcome applause, which decays after
// arrival. TV-caption honesty: each part is listed only while its sound is
// actually available; after arrival only the applause remains.
function walkNote(arrived) {
  const parts = [];
  if (!arrived && cues.ready(grooveFlip ? 'm2a' : 'm2b')) parts.push('♪ Music playing');
  if (applauseEl && !applauseEl.error) parts.push('Applause');
  return parts.join(' · ');
}
function walkStatus(arrived) { setStatus('Walking to the stage.', walkNote(arrived)); }
function introStatus() { setStatus('The ceremony is about to begin.', cues.ready('m1') ? '♪ Music playing' : ''); }

// full-screen fade-to-black for the scripted ending ("Fade to black."); controls
// sit above it so Restart stays reachable after the fade
const fadeEl = document.createElement('div');
fadeEl.style.cssText = 'position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;transition:opacity 2.4s;z-index:20;';
document.body.appendChild(fadeEl);
document.getElementById('controls').style.zIndex = '30';
// Exit control (v7): a small always-visible button, top-right, ABOVE the Begin
// overlay — a student who has to leave (or a device that can't play) always has
// a way back; the host page decides where it goes (opts.returnUrl / opts.onExit).
const exitBtn = document.getElementById('exitBtn');
if (exitBtn && (opts.onExit || opts.returnUrl)) {
  exitBtn.hidden = false;
  exitBtn.textContent = opts.exitLabel || 'Exit';
  exitBtn.addEventListener('click', () => {
    if (hooks.onExit) { try { hooks.onExit(); } catch (e) { console.warn('ceremony: onExit hook failed', e); } }
    if (opts.onExit) opts.onExit();
    else if (opts.returnUrl) location.href = opts.returnUrl;
  });
}
const hintEl = document.getElementById('hint');
if (hintEl && !opts.dev) hintEl.hidden = true;   // the F/R reviewer hint is noise for a student
// closing brand card (Dale 2026-08-21): the logo fades up OUT of the final
// black — revealed a beat after the black-out completes — and stays as the end
// screen's final visual (the message bar sits along the bottom, above it)
let fadeLogo = null, fadeLogoTimer = null;
if (EMBLEM_LOGO) {
  fadeLogo = document.createElement('img');
  fadeLogo.src = EMBLEM_LOGO.src;
  fadeLogo.style.cssText = 'position:absolute;top:47%;left:50%;transform:translate(-50%,-50%);'
    + 'width:min(42vw,460px);opacity:0;transition:opacity 2.2s;';
  fadeEl.appendChild(fadeLogo);
}

// star RESULTS BOARD for the scripted ending — drawn on the WALL hero screen
// like a game's end-of-level results (the audience's native visual language):
// per-unit star SLOTS fill row by row with popping gold stars, then a gold
// trophy ZINGS into its badge slot as the climax (achievement style; the 3D
// trophy stays on stage). This replaced the DOM pop-up (reference:
// designer-content/star-popup-reference.png): a screen-fixed overlay fought
// the sweeping camera — it forced a jarring locked shot and covered the cast.
// On the wall it's part of the set and the camera stays free. Star counts
// arrive on the ending beat (beat.stars, from the EA scores contract).
const STAR_UNITS = [['unit2', 'Topography'], ['unit3', 'Surface Water'], ['unit4', 'Ground Water'], ['unit5', 'Water Cycle']];
const SFX_ZING = BASE + 'assets/sfx/trophy-zing.mp3';   // trophy-lands-in-slot sting (missing file → silent)
const STAR_AT = (r, i) => 0.7 + r * 0.45 + i * 0.22;   // seconds: row by row, star by star
const TROPHY_AT = 0.7 + 4 * 0.45 + 0.4;                // the trophy lands last (~2.9s)
let starsBoard = null;                                 // {stars, t0, done, zinged} while the board runs
function showStars(stars) { starsBoard = { stars: stars || {}, t0: performance.now() / 1000, done: false, zinged: false }; wallHolo = null; }
function hideStars() { starsBoard = null; }
function drawStar(ctx, cx, cy, r, color, alpha, glow) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(cx, cy);
  if (glow) { ctx.shadowColor = 'rgba(255,205,80,0.9)'; ctx.shadowBlur = 18; }
  ctx.beginPath();
  for (let k = 0; k < 10; k++) {
    const a = -Math.PI / 2 + k * Math.PI / 5, rr = (k % 2 === 0) ? r : r * 0.45;
    ctx[k ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.restore();
}
function drawTrophyIcon(ctx, cx, cy, s, alpha) {       // stylised gold cup, ~170px tall at s=1
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.globalAlpha = alpha;
  const gold = ctx.createLinearGradient(0, -90, 0, 50);
  gold.addColorStop(0, '#ffe9a0'); gold.addColorStop(0.5, '#f5c744'); gold.addColorStop(1, '#c8922a');
  ctx.lineWidth = 9; ctx.strokeStyle = gold;           // handles
  ctx.beginPath(); ctx.arc(-56, -58, 22, -Math.PI * 0.55, Math.PI * 0.75); ctx.stroke();
  ctx.beginPath(); ctx.arc(56, -58, 22, Math.PI * 0.25, Math.PI * 1.55); ctx.stroke();
  ctx.fillStyle = gold; ctx.strokeStyle = '#8a6216'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-48, -88); ctx.lineTo(48, -88);   // cup bowl
  ctx.bezierCurveTo(48, -32, 28, -8, 0, -2);
  ctx.bezierCurveTo(-28, -8, -48, -32, -48, -88);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillRect(-8, -4, 16, 28);                                 // stem
  ctx.beginPath(); ctx.moveTo(-32, 46); ctx.lineTo(32, 46); ctx.lineTo(22, 24); ctx.lineTo(-22, 24);  // base
  ctx.closePath(); ctx.fill();
  ctx.restore();
}
function drawStarsBoard(t) {   // t = seconds since the board appeared; redrawn per frame while animating
  const ctx = heroTex.getContext(); const W = 1280, H = 720;
  ctx.fillStyle = '#050b14'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(20,90,150,0.10)'; ctx.fillRect(40, 40, W - 80, H - 80);
  ctx.strokeStyle = 'rgba(150,225,255,0.95)'; ctx.lineWidth = 4; const m = 56, L = 90;   // corner brackets — same family as the award card
  const corner = (x, y, dx, dy) => { ctx.beginPath(); ctx.moveTo(x, y + dy * L); ctx.lineTo(x, y);
    ctx.lineTo(x + dx * L, y); ctx.stroke(); };
  corner(m, m, 1, 1); corner(W - m, m, -1, 1); corner(m, H - m, 1, -1); corner(W - m, H - m, -1, -1);
  ctx.textAlign = 'center'; ctx.fillStyle = '#dffaff';
  ctx.font = '700 64px Segoe UI, sans-serif'; ctx.fillText('CONGRATULATIONS!', W / 2, 150);
  ctx.font = '400 34px Segoe UI, sans-serif'; ctx.fillStyle = 'rgba(170,225,255,0.85)';
  ctx.fillText('You completed the mission.', W / 2, 200);
  // unit rows (left): three star slots each, filling with a scale-pop
  const rowX = 120, rowEnd = 760, starR = 26;
  STAR_UNITS.forEach(([key, label], r) => {
    const y = 292 + r * 96;
    ctx.textAlign = 'left'; ctx.font = '600 36px Segoe UI, sans-serif';
    ctx.fillStyle = 'rgba(190,235,255,0.92)'; ctx.fillText(label, rowX, y + 13);
    const n = starsBoard.stars[key] || 0;              // unit absent/unplayed → all slots stay empty
    for (let i = 0; i < 3; i++) {
      const cx = rowEnd - (2 - i) * 76, cy = y;
      if (i < n && t >= STAR_AT(r, i)) {
        const p = Math.min(1, (t - STAR_AT(r, i)) / 0.28);
        drawStar(ctx, cx, cy, starR * (1 + (1 - p) * 1.4), '#ffd75e', 0.35 + 0.65 * p, true);
      } else drawStar(ctx, cx, cy, starR, '#39445a', 1, false);
    }
  });
  // trophy badge slot (right): dim ring, then the trophy slams in with a flash
  const bx = 1010, by = 430;
  ctx.strokeStyle = 'rgba(120,190,255,0.5)'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(bx, by, 128, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = 'rgba(30,60,100,0.25)'; ctx.beginPath(); ctx.arc(bx, by, 124, 0, Math.PI * 2); ctx.fill();
  ctx.textAlign = 'center'; ctx.font = '600 26px Segoe UI, sans-serif';
  ctx.fillStyle = 'rgba(170,225,255,0.8)'; ctx.fillText('AWARD EARNED', bx, by + 180);
  if (t >= TROPHY_AT) {
    const p = Math.min(1, (t - TROPHY_AT) / 0.32);
    const e = 1 - Math.pow(1 - p, 3);
    if (p < 1) { ctx.save(); ctx.globalAlpha = (1 - p) * 0.8; ctx.strokeStyle = '#ffe9a0';   // landing flash ring
      ctx.lineWidth = 8 * (1 - p) + 2;
      ctx.beginPath(); ctx.arc(bx, by, 128 + 70 * p, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
    drawTrophyIcon(ctx, bx, by + 28, (2.3 - 1.3 * e) * 0.85, Math.min(1, 0.3 + p));
  }
  heroTex.update();
}

function setHolo(h) {
  // beat without holo: keep the current displays, but freeze any slide pacing so a
  // previous beat's images/highlights don't re-run against the new line's clock
  if (!h) { if (slides) slides.per = 0; if (hlSlide) hlSlide.per = 0; return; }
  const token = ++holoToken;
  wallHolo = h;
  if (h.images && h.images.length) {
    // screenshots → the WALL hero screen (clean); the small holo stays out of the way
    const entries = h.images.map(holoImage);
    slides = { entries, idx: 0, per: 0, fade: null, fresh: true };
    hlSlide = null;
    holoVisible(false);
    const first = entries[0];
    const draw = () => { if (token !== holoToken) return;
      drawImageSlide(first, null, 0); if (first.tint) setSetTint(first.tint);
      wallPulse = 1; };                                // radial wave announces the new image
    if (first.ready) draw(); else first.img.addEventListener('load', draw, { once: true });
  } else if (h.highlights && h.highlights.length) {
    // highlights → the WALL hero screen (the floating holo parallax-slid across
    // the backdrop as the camera moved; one display surface, no sliding)
    slides = null;
    hlSlide = { items: h.highlights, shown: -1, per: 0, fresh: true };   // items appear as the line plays
    drawHighlights(h.highlights, -1);                                    // header + empty panel until then
    setSetTint(null);
    holoVisible(false);
  } else {
    // award / title card → the WALL hero screen
    slides = null; hlSlide = null;
    drawSlide(h.title || '', h.subtitle || '');
    setSetTint(null);
    holoVisible(false);
  }
}

// A beat with no holo of its own INHERITS the wall from the last holo-bearing
// beat before it. Natural advancement gets that for free (setHolo(null) freezes
// the current display), but a JUMP — dev panel, end-screen Replay — used to
// leave whatever was last drawn (e.g. the stars board over the award
// announcement, Dale 2026-08-21). renderWallEnd reconstructs the inherited
// content at its FINISHED state: last image, fully revealed list, or card.
function renderWallEnd(h) {
  const token = ++holoToken;
  wallHolo = h; slides = null; hlSlide = null;
  if (h.images && h.images.length) {
    const entries = h.images.map(holoImage);
    slides = { entries, idx: entries.length - 1, per: 0, fade: null, fresh: false };
    const last = entries[entries.length - 1];
    const draw = () => { if (token !== holoToken) return;
      drawImageSlide(last, null, 0); if (last.tint) setSetTint(last.tint); };
    if (last.ready) draw(); else last.img.addEventListener('load', draw, { once: true });
  } else if (h.highlights && h.highlights.length) {
    hlSlide = { items: h.highlights, shown: h.highlights.length - 1, per: 0, fresh: false };
    drawHighlights(h.highlights, h.highlights.length - 1);
    setSetTint(null);
  } else {
    drawSlide(h.title || '', h.subtitle || '');
    setSetTint(null);
  }
  holoVisible(false);
}
function setWallForBeat(beat) {
  if (beat.holo) { setHolo(beat.holo); return; }
  let h = null;
  for (let k = Math.min(idx, beats.length - 1); k >= 0; k--) if (beats[k].holo) { h = beats[k].holo; break; }
  if (h && h !== wallHolo) renderWallEnd(h);   // stale wall (we jumped here) → restore the inherited end state
  else setHolo(null);                          // natural advance → freeze, as always
}

function showText(text) {
  stopLineAudio();
  cues.duckMoves();                        // the voice is always dry — music out as the line starts
  bubbleTextEl.innerHTML = '';
  const words = text.split(/\s+/);
  hlWords = words.map(w => { const s = document.createElement('span'); s.className = 'w'; s.textContent = w + ' '; bubbleTextEl.appendChild(s); return s; });
  const item = LINE_AUDIO[beats[idx].lineId];      // this line's voice clip + word timings
  if (item && item.words && item.words.length) {
    hlTimes = item.words.map(w => w[0]);            // per-word start seconds → karaoke synced to the voice
    hlDur = item.durationSec || (hlTimes[hlTimes.length - 1] + 1);
    lineAudio = new Audio(item.audio + '?v=' + AUDIO_V);
    lineAudio.play().catch(() => {});               // gesture-gated; the Begin overlay covers the first line
  } else {
    hlTimes = null;                                 // no clip → placeholder even spacing
    hlDur = Math.max(2.2, words.length * 0.34);
  }
  // pace this beat's image slides / highlight reveals across the line ("while
  // dialogue plays…"). `fresh` = armed once, by the beat that set the holo.
  if (slides && slides.fresh) {
    slides.fresh = false;
    // pace across the FIRST 80% of the line — the last image lands well before
    // the line ends, so an eager Next click doesn't skip it entirely
    if (slides.entries.length > 1) slides.per = (hlDur * 0.8) / slides.entries.length;
  }
  if (hlSlide && hlSlide.fresh) {
    hlSlide.fresh = false;
    hlSlide.per = hlDur / (hlSlide.items.length + 1);   // +1: last item lands before the line ends
  }
  hlStart = performance.now() / 1000;
  textPlaying = true;
  bubble.classList.add('show');
  setControls(true);                       // a line is on the bubble → Next/Replay live (and stay live after it ends)
}

// ---- music & celebration SFX ----
// v4 music cues (assets/music/ — Dale's approved Suno takes, excerpted and
// normalized; provenance in docs/music-plan.md). Awards-show grammar: the voice
// is always dry — cues cover the opening, walk-up transitions, the award build,
// and the celebration. Every cue degrades to silence if its file is missing.
// sting: the award fanfare; applause: small-group clapping (ElevenLabs SFX),
// loops under the ending celebration and fades with the fade-to-black.
const MUSIC = { sting: BASE + 'assets/sfx/fanfare-award.mp3' };
const CUES = {
  m1:  { src: BASE + 'assets/music/m1-cold-open.mp3',   vol: 0.55 },              // Begin → build to an impact (~7s), ducks at Toppo's line
  m2a: { src: BASE + 'assets/music/m2a-walkup.mp3',     vol: 0.40, loop: true },  // walk-up grooves — alternate per hand-off,
  m2b: { src: BASE + 'assets/music/m2b-walkup.mp3',     vol: 0.40, loop: true },  //   RESUME (not restart) so it's not the same 4 bars every time
  m4:  { src: BASE + 'assets/music/m4-riser.mp3',       vol: 0.60 },              // award riser — the hit gates the fanfare/confetti
  m5:  { src: BASE + 'assets/music/m5-celebration.mp3', vol: 0.50, loop: true },  // celebration loop, fades with the black-out
};
const M4_HIT = 7.5;      // seconds into m4 where the final accent lands → launch the party there
const INTRO_IMPACT = 7.0;   // m1's build lands here (music-plan provenance): title card + dispersal fire on it
const INTRO_SETTLE = 1.7;   // company placed + m1 faded (1.5s) → this quiet gap → Toppo's first line
// Awards-show arrival: the band buttons out as the walker nears the podium, the
// welcome applause hangs on and decays, the speaker takes a beat to compose
// themselves — THEN the line starts, over near-silence. (The old behavior — a
// 0.35s duck starting WITH the voice — read as an abrupt collision.)
const WALK_FADE = 1.6;      // groove fade-out, triggered in the walk's last quarter
const SETTLE = 1.3;         // arrival → line start: the speaker settles at the podium
const APPLAUSE_WALK = 0.26; // welcome-applause volume under the groove during the walk
const APPLAUSE_TAIL = 1.8;  // its decay after the speaker arrives
const cues = (() => {
  const els = {};
  function el(id) {
    const c = CUES[id]; if (!c) return null;
    if (!els[id]) { const a = new Audio(c.src); a.preload = 'auto'; a.loop = !!c.loop;
      a.addEventListener('error', () => { a.__failed = true; }); els[id] = a; }
    return els[id];
  }
  // token-guarded fade: a resume cancels an in-flight duck (else the old fade
  // loop keeps dragging the volume down and pauses the element mid-play)
  function fade(a, to, sec) {
    const token = (a.__ft = (a.__ft || 0) + 1);
    const from = a.volume, t0 = performance.now();
    const step = () => { if (a.__ft !== token) return;
      const p = Math.min(1, (performance.now() - t0) / (sec * 1000));
      a.volume = from + (to - from) * p;
      if (p < 1) requestAnimationFrame(step); else if (to === 0) a.pause(); };
    step();
  }
  Object.keys(CUES).forEach(el);                       // warm: preload every cue up-front
  return {
    ready(id) { const a = els[id]; return !!a && !a.__failed; },
    play(id, opts) {                                   // opts: {restart, fadeIn}
      const a = el(id); if (!a || a.__failed) return null;
      a.__ft = (a.__ft || 0) + 1;                      // cancel any in-flight duck
      if (opts && opts.restart) { try { a.currentTime = 0; } catch (e) {} }
      if (opts && opts.fadeIn) { a.volume = 0; a.play().catch(() => {}); fade(a, CUES[id].vol, opts.fadeIn); }
      else { a.volume = CUES[id].vol; a.play().catch(() => {}); }
      return a;
    },
    duck(id, sec) { const a = els[id]; if (a && !a.paused) fade(a, 0, sec || 0.4); },
    duckMoves(sec) { this.duck('m1', sec || 0.5); this.duck('m2a', sec || 0.35); this.duck('m2b', sec || 0.35); },
  };
})();
let grooveFlip = false, introTimer = null, celebTimer = null, settleTimer = null;
let celebLeadTimer = null;               // pending auto-advance from an award line into its celebration
let devRender = null;                    // ?dev=1 beat selector's list refresher (null in normal mode)
const SFX_APPLAUSE = BASE + 'assets/sfx/applause-small-group.mp3';
// token-guarded like cues.fade: a re-start cancels an in-flight fade-out (else
// the old fade loop keeps dragging the volume down and pauses it mid-play)
const fadeAudio = (el, to, sec) => { const token = (el.__ft = (el.__ft || 0) + 1);
  const from = el.volume, t0 = performance.now();
  const step = () => { if (el.__ft !== token) return;
    const p = Math.min(1, (performance.now() - t0) / (sec * 1000));
    el.volume = from + (to - from) * p;
    if (p < 1) requestAnimationFrame(step); else if (to === 0) el.pause(); }; step(); };
let applauseEl = null;
function applause(on, fadeSec, vol) {
  if (on) {
    if (!applauseEl) { applauseEl = new Audio(SFX_APPLAUSE); applauseEl.loop = true; }
    applauseEl.__ft = (applauseEl.__ft || 0) + 1;   // cancel an in-flight fade-out
    applauseEl.volume = vol || 0.6;                 // celebration default; walk-ups pass APPLAUSE_WALK
    applauseEl.currentTime = 0;
    applauseEl.play().catch(() => {});
  } else if (applauseEl && !applauseEl.paused) {
    fadeAudio(applauseEl, 0, fadeSec || 0.4);
  }
}
const music = {   // the always-on ambient bed was rejected per the grammar — the walk-up grooves ARE the bed
  sting() { if (!MUSIC.sting) return; const a = new Audio(MUSIC.sting); a.volume = 0.7; a.play().catch(() => {}); },
};

let pendingBeat = null;     // line to start once the speaker reaches the mark
let celebWaiting = false, celebDur = 4, celebReadyAt = 0;  // celebration auto-advance: hold AFTER everyone's home (so the returning speaker gets to celebrate)
// Walk along a quadratic Bézier (start → corner control → end) so the turn is ONE smooth
// arc, not a hard pivot. The outgoing walker's control point bows the path downstage
// (toward camera) while the returning walker's stays tight — crossing traffic passes
// on separate arcs without colliding.
const sendBack = c => { if (c.state === 'out' || c.state === 'speak') { c.state = 'back'; c.curve = { p0: c.holder.position.clone(), p1: new V3((c.home.x + SPEAK_MARK.x) / 2, 0, Math.max(c.home.z, SPEAK_MARK.z) + 0.15), p2: c.home.clone() }; c.t = 0; } };
const startOut = c => { c.state = 'out'; c.nearMark = false; c.curve = { p0: c.holder.position.clone(), p1: new V3((c.home.x + SPEAK_MARK.x) / 2, 0, Math.max(c.home.z, SPEAK_MARK.z) + 0.95), p2: SPEAK_MARK.clone() }; c.t = 0; };

let endTimer = null;
function enterBeat(i) {
  if (i < 0 || i >= beats.length) return;
  fadeEl.style.opacity = '0';                 // restart after (or during) the ending fade
  if (fadeLogoTimer) { clearTimeout(fadeLogoTimer); fadeLogoTimer = null; }
  if (fadeLogo) fadeLogo.style.opacity = '0';
  hideStars();
  hideTrophy();
  if (endTimer) { clearTimeout(endTimer); endTimer = null; }
  if (introTimer) { clearTimeout(introTimer); introTimer = null; }   // Next/R during the intro: don't re-enter beat 0 later
  intro = null;                                                      // …and the cold open (if running) yields to the show
  if (celebTimer) { clearTimeout(celebTimer); celebTimer = null; }   // skipped out mid-riser: the party launch must not fire late
  if (settleTimer) { clearTimeout(settleTimer); settleTimer = null; }  // skipped during a settle: that line must not start late
  if (celebLeadTimer) { clearTimeout(celebLeadTimer); celebLeadTimer = null; }  // manual Next beat the auto-flow to it
  cues.duck('m4', 0.2); cues.duck('m5', 0.5);                        // leaving (or restarting) a celebration
  cues.duck('m1', 0.4);              // jumped out of the intro: the overture must stop NOW, not at the next line
                                     // (it kept playing through the walk and read as "the click did nothing")
  const firstEntry = idx === -1;             // very first beat: ease in from the boot wide, no cut
  // LATE BINDING (v7): the embed re-reads the student's scores just before they
  // are needed — a unit's sections are re-resolved as its character walks up
  // (the hook may replace beats[i] and its siblings in place), and the star
  // board as the ending celebration starts. docs/embed-api.md.
  { const nb = beats[i];
    if (nb && nb.unitId && hooks.beforeUnit && (idx < 0 || !beats[idx] || beats[idx].unitId !== nb.unitId)) {
      try { hooks.beforeUnit(nb.unitId, i); } catch (e) { console.warn('ceremony: beforeUnit hook failed', e); }
    }
    if (nb && nb.type === 'celebration' && nb.ending && hooks.beforeCelebration) {
      try { hooks.beforeCelebration(i); } catch (e) { console.warn('ceremony: beforeCelebration hook failed', e); }
    } }
  idx = i; const beat = beats[i];
  const spk = beat.speaker ? chars[beat.speaker] : null;
  // Same-speaker continuation: unit sections give one NPC several consecutive lines.
  // If this beat's speaker is already at (or walking to) the mark, they stay and
  // deliver — no walk home and back between their own lines.
  const continuing = !!spk && (spk.state === 'speak' || spk.state === 'out');
  celebrating = false; currentSpeaker = null; textPlaying = false; pendingBeat = null; celebWaiting = false;
  stopLineAudio();
  confetti.stop();
  applause(false);
  if (beat.type !== 'celebration') {         // the lower-third must not show the PREVIOUS speaker's line…
    bubble.classList.remove('show');
    bubbleTextEl.innerHTML = '';
  }                                          // …but a celebration KEEPS the award announcement up while the room
                                             // erupts (cleared when the results board takes over — see showStars call)
  beamFlare = 1;                             // beat punctuation: the beam rig flares on every hand-off

  // previous speaker walks home; others reset (the continuing speaker holds the
  // mark). CELEBRATIONS: the announcing speaker STAYS at the podium — presenter
  // beside the trophy — because walking home between the announcement and the
  // party was an awkward dead stretch (Dale 2026-08-20); everyone else is home.
  for (const c of Object.values(chars)) {
    c.speaking = false; c.expr = EXPR.neutral;
    // ('out' too: entering the celebration while the announcer is still walking
    // up must let them FINISH arriving, not turn them around mid-stride)
    const stays = (continuing && c === spk) || (beat.type === 'celebration' && (c.state === 'speak' || c.state === 'out'));
    if (!stays) {
      sendBack(c);
      // intro interrupted (R / dev-jump before the dispersal): tableau members
      // are state 'home' but standing at the FORMATION — walk them to their
      // real marks or they'd play the whole show clustered centre-stage
      if (c.state === 'home' && Math.hypot(c.holder.position.x - c.home.x, c.holder.position.z - c.home.z) > 0.3) {
        c.state = 'back'; c.t = 0;
        c.curve = { p0: c.holder.position.clone(),
          p1: new V3((c.holder.position.x + c.home.x) / 2, 0, Math.max(c.holder.position.z, c.home.z) + 0.4),
          p2: c.home.clone() };
      }
    }
  }

  if (beat.type === 'celebration') {
    cutTo(beat.ending ? SHOTS.celebArc : SHOTS.wideHigh);   // ending: arcing jib around the party; mid-show: slow crane
    lastSpeaker = null; runCount = 0;        // a post-celebration speaker starts a fresh shot cycle
    setControls(false);                      // no dialogue → no controls (finish re-enables Next as Restart)
    cues.duckMoves(0.3);
    // The AWARD moment: the announcement just happened — the room reacts NOW.
    // Cheer clips, applause, confetti, fanfare, trophy and m5 all fire together
    // at launch; silent cheering ahead of the sound read as broken (Dale
    // 2026-08-20). The ending launches IMMEDIATELY on beat entry (the speaker
    // is still at the podium — no reassembly to wait for); the m4 riser build
    // only fits a NON-ending celebration, where the cast walks home first.
    const launch = () => { celebTimer = null;
      celebrating = true;
      for (const c of Object.values(chars)) c.expr = EXPR[beat.expression] || EXPR.happy;  // clip = each char's cheerClip (set in the loop)
      if (beat.fx === 'confetti') confetti.start();
      wallPulse = 1;                            // the whole set surges for the finale
      music.sting();                            // award fanfare as the card materializes
      applause(true);                           // the group's clapping/cheering, looped
      if (beat.ending) showTrophy();            // "Toppo presents players with a trophy"
      cues.play('m5', { restart: true });
    };
    const useRiser = !beat.ending && cues.ready('m4');
    if (useRiser) { cues.play('m4', { restart: true }); celebTimer = setTimeout(launch, M4_HIT * 1000); }
    else launch();
    setWallForBeat(beat);
    // Auto-advance: hold for `duration` from the party launch; the render loop
    // keeps pushing the clock while anyone is still walking home (mid-show case).
    if (beat.advance === 'auto') { celebWaiting = true; celebDur = beat.duration || 5;
      celebReadyAt = performance.now() / 1000 + celebDur + (useRiser ? M4_HIT : 0); }
    updateNextLabel();
    return;
  }

  currentSpeaker = spk;
  runCount = (beat.speaker && beat.speaker === lastSpeaker) ? runCount + 1 : 0;
  if (beat.speaker) lastSpeaker = beat.speaker;
  if (spk) { spk.expr = EXPR[beat.expression] || EXPR.neutral;
    // mood-matched standing delivery clip (Intro/Meeting_Start is a SEATED clip → unused)
    spk.deliveryClip = MOOD_CLIP[beat.expression] || 'TalkBigIdea'; }
  setWallForBeat(beat);
  speakerNameEl.textContent = beat.speaker;
  if (continuing) {
    if (spk.state === 'speak') {           // already at the mark → cut to this line's coverage, deliver now
      spk.speaking = true;
      const s = chooseSpeakerShot(spk.name, beat, runCount);
      if (firstEntry) setShot(s); else cutTo(s, 0.9);   // opening line keeps the slow ease in from the boot wide
      showText(beat.text || '');
    } else {
      pendingBeat = beat;                  // still walking out → the follow shot holds; arrival cuts + shows the text
      walkStatus(); setControls(false);
    }
  } else {
    if (spk) { startOut(spk); cutTo(followShot(spk));    // walk out NOW (overlaps the previous speaker's return) — camera cuts to walk-up coverage
      grooveFlip = !grooveFlip;                          // walk-up groove under the transition, alternating tracks;
      cues.play(grooveFlip ? 'm2a' : 'm2b', { fadeIn: 0.5 });  // resumes where it left off — fades as the walker nears the podium
      applause(true, 0, APPLAUSE_WALK);                  // welcome applause under the groove; decays after arrival
      walkStatus(); setControls(false); }
    else setShot(SHOTS.wide);
    pendingBeat = beat;                    // showText fires when the speaker arrives at the mark
  }
  updateNextLabel();
}

function advance() { if (idx < beats.length - 1) enterBeat(idx + 1); else finish(); }
let finished = false;
function finish() { finished = true; lastSpeaker = null; runCount = 0; setShot(SHOTS.wide);
  if (celebTimer) { clearTimeout(celebTimer); celebTimer = null; }
  if (settleTimer) { clearTimeout(settleTimer); settleTimer = null; }
  if (celebLeadTimer) { clearTimeout(celebLeadTimer); celebLeadTimer = null; }
  cues.duckMoves(0.8); cues.duck('m4', 0.3); cues.duck('m5', 1.0);
  stopLineAudio(); confetti.stop(); applause(false, 0.8); updateNextLabel();
  // end screen (over the black-out; the bar sits above the fade layer): a
  // congratulatory send-off that also explains the two live buttons —
  // an empty box with bare buttons read as broken (Dale 2026-08-21)
  const eb = beats.find(b => b.ending);
  const award = eb && eb.holo && eb.holo.title;
  speakerNameEl.textContent = 'Mission complete';
  bubbleTextEl.textContent = (award
    ? 'Congratulations — you earned the ' + award + ' award and completed Mission HydroSci! '
    : 'Congratulations — you completed Mission HydroSci! ')
    + 'Press ↻ Replay to relive the award moment, or ↺ Restart to watch the whole ceremony again.'
    + (exitBtn && !exitBtn.hidden ? ' ' + exitBtn.textContent + ' takes you back.' : '');
  bubble.classList.add('show');
  nextBtn.disabled = false; replayBtn.disabled = false;     // Restart + Replay both live at the end
  if (hooks.onFinished) { try { hooks.onFinished({ award: award || null }); } catch (e) { console.warn('ceremony: onFinished hook failed', e); } } }
function updateNextLabel() {
  if (finished || idx >= beats.length - 1) { nextBtn.textContent = '↺ Restart'; }
  else nextBtn.textContent = 'Next ▶';
  if (devRender) devRender();      // runs on every beat entry AND finish — keeps the dev list's highlight honest
}
// FULL restart (the ↺ Restart button): replay the ENTIRE show including the
// cold open — the audience-facing restart is the complete experience (Dale
// 2026-08-21; jumping straight to Toppo felt like starting mid-show). The R
// key stays the QUICK restart that skips the intro, for fast reviewing.
function restartShow() {
  finished = false; idx = -1; lastSpeaker = null; runCount = 0;
  celebrating = false; currentSpeaker = null; textPlaying = false; pendingBeat = null; celebWaiting = false;
  if (endTimer) { clearTimeout(endTimer); endTimer = null; }
  if (introTimer) { clearTimeout(introTimer); introTimer = null; }
  if (celebTimer) { clearTimeout(celebTimer); celebTimer = null; }
  if (settleTimer) { clearTimeout(settleTimer); settleTimer = null; }
  if (celebLeadTimer) { clearTimeout(celebLeadTimer); celebLeadTimer = null; }
  if (fadeLogoTimer) { clearTimeout(fadeLogoTimer); fadeLogoTimer = null; }
  if (fadeLogo) fadeLogo.style.opacity = '0';
  fadeEl.style.opacity = '0';
  stopLineAudio(); confetti.stop(); applause(false);
  cues.duckMoves(0.3); cues.duck('m4', 0.2); cues.duck('m5', 0.5);
  hideStars(); hideTrophy(); holoVisible(false);
  slides = null; hlSlide = null; wallHolo = null; setSetTint(null);
  heroIdle(true);                            // dark standby screen — the boot title takes over at the impact
  speakerNameEl.textContent = '';
  introStatus();                             // caption the cold open (the company's mingle + dispersal)
  setControls(false);
  updateNextLabel();
  // the company back to the opening tableau, facing their chat partners
  for (const c of Object.values(chars)) {
    const f = FORMATION[c.name] || c.home;
    c.holder.position.set(f.x, 0, f.z);
    c.holder.rotation.y = (c.chatYaw !== undefined) ? c.chatYaw : Math.atan2(AUDIENCE.x - f.x, AUDIENCE.z - f.z);
    c.state = 'home'; c.speaking = false; c.expr = EXPR.neutral;
  }
  mingle.pairAt = [0, 0]; mingle.mcAt = 0;   // chatting resumes on the next frame
  intro = { t0: performance.now() / 1000, dispersed: false };
  cues.play('m1', { restart: true });
  cutTo({ alpha: Math.PI / 2 - 0.30, beta: 1.02, radius: SHOTS.wideHigh.radius * 1.12, k: 0.5, target: new V3(-0.6, 0.6, 1.2) });
}
nextBtn.addEventListener('click', () => {
  if (finished || idx >= beats.length - 1) restartShow();
  else advance();
});
replayBtn.addEventListener('click', () => {
  if (finished) {                          // end screen: relive the award moment — the announcement
    let i = beats.findIndex(b => b.ending);    // line auto-flows into the full celebration again
    if (i < 0) i = beats.length;
    finished = false;
    enterBeat(Math.max(0, i - 1));
    return;
  }
  if (currentSpeaker && beats[idx]) {      // mid-show: replay the current line
    if (lineAudio) { try { lineAudio.currentTime = 0; lineAudio.play().catch(() => {}); } catch (e) {} }
    hlStart = performance.now() / 1000; textPlaying = true;
  }
});

// start gate: nothing makes sound until this click (browser autoplay policy)
document.getElementById('startBtn').addEventListener('click', () => {
  if (!window.__ready) return;
  document.getElementById('startOverlay').classList.add('hide');
  if (hooks.onStarted) { try { hooks.onStarted(); } catch (e) { console.warn('ceremony: onStarted hook failed', e); } }
  // COLD OPEN: dark stage → the set powers up group by group under m1's build
  // (ignition factors + driver in the render loop) → the company revealed
  // centre-stage at the impact → they take their marks (Toppo to the podium)
  // under the ride-out → m1 fades, settle gap, Toppo's first line. Runs with
  // or without the m1 file; Next/R skip it (enterBeat nulls `intro`).
  // Same path as the end screen's ↺ Restart — one boot flow.
  restartShow();
});

// keyboard: F free camera, R restart
window.addEventListener('keydown', e => {
  if (e.key === 'f' || e.key === 'F') { freeCam = !freeCam; if (freeCam) camera.attachControl(canvas, true); else camera.detachControl(); }
  if (e.key === 'r' || e.key === 'R') {   // no restarts from behind the start overlay (it would break the dark pre-show)
    if (!document.getElementById('startOverlay').classList.contains('hide')) return;
    finished = false; enterBeat(0);
  }
});

// ---- developer beat selector (?dev=1) — review tool, never linked from the
// launcher: a "Beats" toggle top-left opens an overlay listing every resolved
// beat (speaker · lineId · snippet); clicking one jumps straight there, so a
// reviewer can reach Tera's turn or the ending without stepping through the
// show. Sits UNDER the Begin overlay (z 40 < 50): usable only once the show
// has started (Begin is the audio-unlock gesture).
if (opts.dev || new URLSearchParams(location.search).has('dev')) {
  const devBtn = document.createElement('button');
  devBtn.textContent = '☰ Beats';
  devBtn.style.cssText = 'position:fixed;top:28px;left:12px;z-index:40;background:rgba(20,40,70,0.85);'
    + 'color:#9fc0e8;border:1px solid #3d6fa0;border-radius:6px;padding:4px 10px;font-size:12px;cursor:pointer;';
  document.body.appendChild(devBtn);
  const devList = document.createElement('div');
  devList.style.cssText = 'position:fixed;top:58px;left:12px;z-index:40;display:none;max-height:72vh;'
    + 'overflow-y:auto;background:rgba(8,14,24,0.95);border:1px solid rgba(90,160,255,0.4);border-radius:10px;'
    + 'padding:8px;font:12px/1.6 "SF Mono",Menlo,monospace;color:#b9c6da;min-width:380px;';
  document.body.appendChild(devList);
  devRender = () => {
    if (devList.style.display === 'none') return;
    devList.innerHTML = '';
    beats.forEach((b, i) => {
      const row = document.createElement('div');
      const tag = b.type === 'celebration' ? '★ CELEBRATION' : (b.speaker || '—');
      const snip = (b.text || (b.holo && b.holo.title) || '').slice(0, 44);
      row.textContent = String(i).padStart(2, '0') + ' · ' + tag + (b.lineId ? ' · ' + b.lineId : '') + ' · ' + snip;
      row.style.cssText = 'padding:2px 8px;border-radius:5px;cursor:pointer;white-space:nowrap;overflow:hidden;'
        + 'text-overflow:ellipsis;max-width:560px;' + (i === idx ? 'background:rgba(43,111,184,0.55);color:#fff;' : '');
      row.addEventListener('mouseenter', () => { if (i !== idx) row.style.background = 'rgba(40,72,116,0.5)'; });
      row.addEventListener('mouseleave', () => { if (i !== idx) row.style.background = ''; });
      row.addEventListener('click', () => { finished = false; enterBeat(i); });
      devList.appendChild(row);
    });
  };
  devBtn.addEventListener('click', () => {
    const open = devList.style.display === 'none';
    devList.style.display = open ? 'block' : 'none';
    if (open) devRender();
  });
  // click anywhere outside the list (or its toggle) → close it
  document.addEventListener('pointerdown', e => {
    if (devList.style.display === 'none') return;
    if (devList.contains(e.target) || devBtn.contains(e.target)) return;
    devList.style.display = 'none';
  }, true);
}

// ================================================================ PER-FRAME
const talkJaw = t => Math.max(0, Math.min(0.34, Math.sin(t * 11) * 0.16 + Math.sin(t * 6.7 + 1) * 0.09 + 0.08));
let revealFrames = -1;      // countdown; reveal characters once idle is applied (no T-pose)

scene.onBeforeRenderObservable.add(() => {
  const now = performance.now() / 1000;
  const dt = Math.min(0.05, engine.getDeltaTime() / 1000);

  // holo shader uniforms + materialize (no y-bob → stays aligned with the bezel/grid)
  holoMat.setFloat('time', now);
  holoMat.setVector3('cameraPosition', camera.position);
  holoReveal += (holoRevealTarget - holoReveal) * Math.min(1, 3.0 * dt);
  holoMat.setFloat('reveal', holoReveal);
  bezelMat.alpha = holoReveal; coneMat.alpha = 0.06 * holoReveal;    // bezel + cone fade with the wipe
  if (holoRevealTarget === 0 && holoReveal < 0.02 && holoGroup.isEnabled()) holoGroup.setEnabled(false);

  // set tint easing — every emissive set element follows one colour. The tint is
  // SQUARED before driving emissives: deepens saturation (The Voice neon look)
  // instead of overdriving toward tone-mapped white.
  tintCur = Color3.Lerp(tintCur, tintTarget, Math.min(1, 2.2 * dt));
  const satC = new Color3(tintCur.r * tintCur.r, tintCur.g * tintCur.g, tintCur.b * tintCur.b);
  // ---- cold-open ignition factors: before Begin the stage sits DARK; after
  // Begin the set powers up by element group under m1's build (columns →
  // podium/floor → rig → wall/title), real lights last so the company emerges
  // from the darkness. All factors collapse to 1 once `intro` is null. ----
  const bootT = intro ? now - intro.t0 : Infinity;         // Infinity → show running, everything lit
  const ig = (s, d) => bootT === Infinity ? 1 : Math.max(0, Math.min(1, (bootT - s) / d));
  const fCols = ig(1.0, 1.6), fFloor = ig(2.2, 1.6), fRig = ig(3.4, 1.6), fWall = ig(4.6, 1.8);
  const fLight = bootT === Infinity ? 1 : 0.12 + 0.88 * ig(5.2, 2.4);
  hemi.intensity = 0.55 * fLight; fill.intensity = 0.7 * fLight;
  keyL.intensity = 110 * fLight; keyR.intensity = 95 * fLight;
  rim.intensity = 0.4 * fLight; holoLight.intensity = 8 * fLight;
  emblem.visibility = fWall;
  if (podiumLogo) podiumLogo.visibility = fFloor;
  for (const wl of wingLogos) wl.visibility = fWall;
  heroFrameMat.emissiveColor.set(0.5 * fWall, 1.2 * fWall, 1.6 * fWall);
  wallMat.setFloat('time', now); wallMat.setColor3('tint', satC.scale(fWall));
  wallMat.setFloat('pulse', wallPulse);
  wallPulse = Math.max(0, wallPulse - dt * 0.7);
  beamFlare = Math.max(0, beamFlare - dt * 0.9);
  bladeMat.emissiveColor.copyFrom(satC).scaleInPlace(1.9 * fCols);
  ringMat.emissiveColor.copyFrom(satC).scaleInPlace((textPlaying ? (1.6 + 0.35 * Math.sin(now * 2.4)) : 1.25) * fFloor);
  glowMat.emissiveColor.copyFrom(satC).scaleInPlace(0.3 * fFloor);
  fixtureMat.emissiveColor.copyFrom(satC).scaleInPlace(1.3 * fRig);
  floorRingMat.setFloat('time', now); floorRingMat.setColor3('tint', satC.scale(fFloor));
  // spot rig: shafts + pools sweep together; flares on speaker changes
  const beamSpeed = celebrating ? 2.2 : 1.0;
  beamShaftMat.emissiveColor.copyFrom(satC).scaleInPlace((1.1 + beamFlare * 0.8 + (celebrating ? 0.4 : 0)) * fRig);
  beamShaftMat.alpha = (0.1 + beamFlare * 0.06 + (celebrating ? 0.05 : 0)) * fRig;
  poolMat.emissiveColor.copyFrom(satC).scaleInPlace((1.9 + beamFlare * 0.8 + (celebrating ? 0.4 : 0)) * fRig);

  // ---- pre-show mingle driver (runs from page load until the dispersal):
  // pairs swap talker/listener on a shared clock; the MC turns to a different
  // teammate every few seconds. Faces via chatYaw/chatLook, clips via
  // mingleClip — all consumed by the per-character loop below. ----
  if (intro && !intro.dispersed) {
    CHAT_PAIRS.forEach(([a, b], i) => {
      const ca = chars[a], cb = chars[b];
      // clocks only advance once BOTH members are loaded — a falsely-advanced
      // clock left late loaders idling ("frozen") for the first cycle
      if (!ca || !cb || now < mingle.pairAt[i]) return;
      mingle.pairAt[i] = now + 2.4 + Math.random() * 2.2;
      mingle.pairPhase[i] ^= 1;
      const talker = mingle.pairPhase[i] ? ca : cb, listener = mingle.pairPhase[i] ? cb : ca;
      setMingleClip(talker, CHAT_TALKS[(Math.random() * CHAT_TALKS.length) | 0]);
      talker.expr = EXPR.happy;
      setMingleClip(listener, CHAT_LISTENS[(Math.random() * CHAT_LISTENS.length) | 0]);
      listener.expr = EXPR.neutral;
    });
    const mc = chars[script.layout.mc];
    const others = mc ? Object.values(chars).filter(c => c !== mc) : [];
    if (mc && others.length && now >= mingle.mcAt) {
      mingle.mcAt = now + 3.2 + Math.random() * 2;
      const f = others[(Math.random() * others.length) | 0];
      setMingleClip(mc, Math.random() < 0.6 ? CHAT_TALKS[(Math.random() * CHAT_TALKS.length) | 0] : 'Listen');
      mc.expr = EXPR.happy;
      mc.chatYaw = faceYaw(mc.holder.position, f.holder.position);
      mc.chatLook = f.holder.position.clone(); mc.chatLook.y = 1.65;
    }
  }

  // ---- cold-open driver: at the m1 impact the title blooms, the wall pulses,
  // and the company DISPERSES — the group breaks for their marks while Toppo
  // steps up to the podium. Toppo's first line waits for everyone to be placed
  // (never caught mid-walk), with a hard cap in case something stalls. ----
  if (intro && intro.t0 !== Infinity) {
    if (!intro.dispersed && bootT >= INTRO_IMPACT) {
      intro.dispersed = true;
      drawBootTitle(); wallPulse = 1; beamFlare = 1;
      setShot(Object.assign({}, SHOTS.wide, { k: 0.7 }));  // crane down from the boot high wide
      for (const c of Object.values(chars)) {
        const p0 = c.holder.position.clone();
        if (c.name === script.layout.mc) {                 // the MC steps up to the podium…
          c.state = 'out';
          c.curve = { p0, p1: new V3((p0.x + SPEAK_MARK.x) / 2, 0, (p0.z + SPEAK_MARK.z) / 2 + 0.4), p2: SPEAK_MARK.clone() };
        } else {                                           // …everyone else walks to their home mark
          c.state = 'back';
          c.curve = { p0, p1: new V3((p0.x + c.home.x) / 2, 0, Math.max(p0.z, c.home.z) + 0.4), p2: c.home.clone() };
        }
        c.t = 0;
      }
    }
    if (intro.dispersed && !introTimer) {
      const walking = Object.values(chars).some(c => c.state === 'out' || c.state === 'back');
      if (!walking || bootT > 16) {
        cues.duck('m1', 1.5);
        introTimer = setTimeout(() => { introTimer = null; intro = null; enterBeat(0); }, INTRO_SETTLE * 1000);
      }
    }
  }
  for (const bm of beams) {
    // motion lives in the downstage NOD (pool glides metres across the floor);
    // side-sway stays tiny — big sideways sweeps smear the shafts across the wall
    bm.pivot.rotation.z = 0.09 * Math.sin(now * bm.speed * beamSpeed + bm.phase);
    bm.pivot.rotation.x = -(0.42 + 0.16 * Math.sin(now * bm.speed * 0.7 * beamSpeed + bm.phase * 1.3));
    // pool follows the shaft: intersect the beam axis with the floor plane
    const dir = BABYLON.Vector3.TransformNormal(beamDown, bm.pivot.getWorldMatrix());
    if (dir.y < -0.05) {
      const t = bm.pivot.position.y / -dir.y;
      bm.pool.position.x = bm.pivot.position.x + dir.x * t;
      bm.pool.position.z = bm.pivot.position.z + dir.z * t;
    }
  }

  // reveal characters after idle has been applied for a couple frames (no T-pose)
  if (revealFrames > 0) { revealFrames--; if (revealFrames === 0) for (const c of Object.values(chars)) c.meshes.forEach(m => m.isVisible = true); }

  // celebration auto-advance: start the hold only once the returning speaker is home, so
  // everyone celebrates together (and the late arrival isn't cut off mid-cheer)
  if (celebWaiting) {
    const anyWalking = Object.values(chars).some(c => c.state === 'out' || c.state === 'back');
    if (anyWalking) celebReadyAt = now + celebDur;             // keep pushing while someone's still returning
    else if (now >= celebReadyAt) {
      celebWaiting = false;
      // an `ending` celebration runs celebrate → star pop-up → fade to black
      // (applause continues under the stars, then fades with the black-out)
      if (beats[idx] && beats[idx].ending) {
        showStars(beats[idx].stars);           // results board on the WALL — the pendulum sweep keeps going
        // the award announcement STAYS on the lower-third for the WHOLE
        // celebration (announcement + party are one moment now — Dale
        // 2026-08-21); finish() replaces it with the end-screen message
        endTimer = setTimeout(() => {
          fadeEl.style.opacity = '1'; applause(false, 2.4); cues.duck('m5', 2.4);
          // black completes at 2.4s; hold, then the logo blooms as the last image
          if (fadeLogo) fadeLogoTimer = setTimeout(() => { fadeLogoTimer = null; fadeLogo.style.opacity = '1'; }, 4000);
          endTimer = setTimeout(finish, 2600);
        }, 8500);
      } else advance();
    }
  }

  // word highlight — synced to the voice clip's clock + real word times when present,
  // else placeholder even-spacing. (now is performance.now()/1000; currentTime is seconds.)
  if (textPlaying) {
    const elapsed = (lineAudio && !lineAudio.paused && lineAudio.currentTime > 0)
      ? lineAudio.currentTime : (now - hlStart);
    let upto;
    if (hlTimes) { upto = -1; while (upto + 1 < hlTimes.length && hlTimes[upto + 1] <= elapsed) upto++; }
    else upto = Math.floor((elapsed / hlDur) * hlWords.length);
    for (let k = 0; k < hlWords.length; k++) hlWords[k].classList.toggle('spoken', k <= upto);
    if (elapsed >= hlDur || (lineAudio && lineAudio.ended)) {
      textPlaying = false;
      // the room erupts ON the announcement: a line that leads straight into a
      // celebration auto-advances the moment it ends — waiting for a Next
      // click deflated the award moment (Dale 2026-08-21). Manual Next during
      // the line still works; enterBeat clears this timer.
      if (beats[idx + 1] && beats[idx + 1].type === 'celebration' && !celebLeadTimer) {
        celebLeadTimer = setTimeout(() => { celebLeadTimer = null; advance(); }, 350);
      }
    }
  }

  // ---- holo image slides: advance on the line clock, crossfade between images.
  // After the line ends the clock keeps running but `want` clamps to the last image,
  // which then holds until the next beat replaces or freezes the slides. ----
  if (slides) {
    if (slides.fade) {
      const f = slides.fade;
      f.p = Math.min(1, f.p + dt / 0.45);
      const ease = f.p * f.p * (3 - 2 * f.p);
      drawImageSlide(slides.entries[f.from], slides.entries[f.to], ease);
      if (f.p >= 1) { slides.idx = f.to; slides.fade = null; }
    } else if (slides.per > 0) {
      const el = (lineAudio && !lineAudio.paused && lineAudio.currentTime > 0)
        ? lineAudio.currentTime : (now - hlStart);
      const want = Math.max(0, Math.min(slides.entries.length - 1, Math.floor(el / slides.per)));
      if (want !== slides.idx) { slides.fade = { from: slides.idx, to: want, p: 0 };
        const t = slides.entries[want].tint; if (t) setSetTint(t);
        wallPulse = 1; }                               // the set follows the new image's palette + pulses
    }
  }

  // ---- trophy reveal: delayed rise from the floor, slow spin, warm light ----
  if (trophy && trophyT !== null) {
    trophyT += dt;
    if (trophyT >= 0) {
      const p = Math.min(1, trophyT / 1.6);
      const e = 1 - Math.pow(1 - p, 3);                  // ease-out rise
      trophy.position.y = -1.6 + e * (1.6 + 0.85) + p * 0.05 * Math.sin(now * 1.3);  // settle ~0.85m + gentle bob
      trophy.rotation.y += 0.6 * dt;
      if (trophyLight) trophyLight.intensity = 70 * e;
    }
  }

  // ---- star results board: per-frame redraw while its reveal animates; the
  // zing fires exactly as the trophy icon lands in its slot ----
  if (starsBoard && !starsBoard.done) {
    const t = now - starsBoard.t0;
    drawStarsBoard(t);
    if (!starsBoard.zinged && t >= TROPHY_AT) { starsBoard.zinged = true;
      const a = new Audio(SFX_ZING); a.volume = 0.75; a.play().catch(() => {}); }
    if (t > TROPHY_AT + 0.7) starsBoard.done = true;   // final frame drawn; the board holds until the fade
  }

  // ---- highlight reveals: same clock, one item per step, hold when done ----
  if (hlSlide && hlSlide.per > 0) {
    const el = (lineAudio && !lineAudio.paused && lineAudio.currentTime > 0)
      ? lineAudio.currentTime : (now - hlStart);
    const want = Math.min(hlSlide.items.length - 1, Math.floor(el / hlSlide.per) - 1);
    if (want > hlSlide.shown) { hlSlide.shown = want; drawHighlights(hlSlide.items, want); }
  }

  for (const c of Object.values(chars)) {
    const pos = c.holder.position;
    const walking = (c.state === 'out' || c.state === 'back');
    // ---- walk along the Bézier curve (smooth arc, heading follows the tangent) ----
    if (walking) {
      const cv = c.curve;
      // tangent B'(t) = 2(1-t)(p1-p0) + 2t(p2-p1) — its magnitude is the local world speed
      const tanX = 2 * (1 - c.t) * (cv.p1.x - cv.p0.x) + 2 * c.t * (cv.p2.x - cv.p1.x);
      const tanZ = 2 * (1 - c.t) * (cv.p1.z - cv.p0.z) + 2 * c.t * (cv.p2.z - cv.p1.z);
      const tanLen = Math.hypot(tanX, tanZ) || 1e-4;
      c.t += (c.speed * dt) / tanLen;                      // advance so world speed stays ≈ c.speed
      // the band sees the speaker coming: groove fades over the walk's last quarter
      if (c === currentSpeaker && c.state === 'out' && !c.nearMark && c.t > 0.75) {
        c.nearMark = true; cues.duckMoves(WALK_FADE);
      }
      if (c.t >= 1) {                                      // reached the end of the curve
        c.t = 1;
        if (c.state === 'out') { c.state = 'speak'; c.speaking = true;
          if (c === currentSpeaker) {      // arrival: hard cut from walk coverage to this line's shot
            cutTo(chooseSpeakerShot(c.name, pendingBeat || beats[idx], runCount), 1.1);
            applause(false, APPLAUSE_TAIL);                // the welcome applause decays while they settle
            if (pendingBeat) walkStatus(true);             // caption: groove is out, applause still decaying
            if (pendingBeat) {                             // settle beat: compose themselves, THEN speak
              const b = pendingBeat; pendingBeat = null;
              settleTimer = setTimeout(() => { settleTimer = null; showText(b.text || ''); }, SETTLE * 1000);
            } } }
        else c.state = 'home';
      }
      const t = c.t, mt = 1 - t;                           // position B(t)
      pos.x = mt * mt * cv.p0.x + 2 * mt * t * cv.p1.x + t * t * cv.p2.x;
      pos.z = mt * mt * cv.p0.z + 2 * mt * t * cv.p1.z + t * t * cv.p2.z;
      c.holder.rotation.y += wrap(Math.atan2(tanX, tanZ) - c.holder.rotation.y) * Math.min(1, 7 * dt);   // ease toward the curve tangent
    } else {                                               // standing: ease to face audience (speak) / chat partner (pre-show) / home heading
      const mingling = intro && !intro.dispersed && c.chatYaw !== undefined;
      const fy = (c.state === 'speak') ? Math.atan2(AUDIENCE.x - pos.x, AUDIENCE.z - pos.z)
        : mingling ? c.chatYaw : c.homeYaw;
      c.holder.rotation.y += wrap(fy - c.holder.rotation.y) * Math.min(1, 6 * dt);
    }

    // ---- tiered podium platform: ride the steps up/down by distance to its
    // centre — a smooth y-ramp near each tier edge reads as stepping up ----
    {
      const pdx = pos.x - SPEAK_MARK.x, pdz = pos.z - SPEAK_MARK.z;
      const pd = Math.hypot(pdx, pdz);
      const stepUp = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
      pos.y = 0.10 * stepUp(2.85, 2.45, pd) + 0.10 * stepUp(2.25, 1.85, pd);
    }

    // ---- choose the active clip by state, then crossfade to it ----
    let clip;
    if (walking) clip = 'Walk';                                           // WALKING wins over celebrating (a returning speaker must still walk, not cheer-in-place & slide)
    else if (celebrating) clip = c.cheerClip;                             // clap / cheer
    else if (intro && !intro.dispersed && c.mingleClip) clip = c.mingleClip;  // pre-show chat: talk/gesture/listen cycle
    else if (c.state === 'speak') clip = (textPlaying && c === currentSpeaker) ? c.deliveryClip : c.idleClip;  // speaking the line → gesture; line done → calm idle, waiting for Next
    else clip = c.idleClip;  // resting OR watching → calm idle (head-look makes them watch)
    c.clipTarget = c.groups[clip] ? clip : c.idleClip;
    for (const nm in c.groups) {
      const grp = c.groups[nm], goal = (nm === c.clipTarget) ? 1 : 0;
      let w = c.cw[nm] || 0;
      if (goal > 0 && w < 0.001 && !grp.isPlaying) { grp.play(true); if (DESYNC.has(nm)) grp.goToFrame(grp.from + Math.random() * (grp.to - grp.from)); }
      w += (goal - w) * Math.min(1, 7 * dt);
      // never STOP the idle clip — keep it cycling at weight 0 so transitions INTO idle are a
      // smooth weight crossfade, not a stop→restart that re-seeks to a random DESYNC frame
      // (that re-seek mid-crossfade was the talk→idle "glitch"). Other clips still stop.
      if (goal === 0 && w < 0.004) { w = 0; if (grp.isPlaying && nm !== c.idleClip) grp.stop(); }
      c.cw[nm] = w; grp.setWeightForAllAnimatables(w);
    }

    // ---- look-at by STATE (the fix for the head-twist): ----
    //   walking → look where you're going · speaking → audience · standing → watch the speaker
    let lt = null;
    if (celebrating || walking) lt = null;                                   // WALKING → head follows the clip (aiming at a target behind you flips the head up)
    else if (intro && !intro.dispersed && c.chatLook) lt = c.chatLook;        // pre-show: eyes on the chat partner
    else if (c.state === 'speak') lt = camera.position;                       // speaker makes eye contact with the VIEWER (the camera = the audience); a fixed point read as looking past them
    else if (currentSpeaker && currentSpeaker !== c) lt = MARK_LOOK;          // group watches the MARK (fixed → no head sweep)
    if (lt) { c.head.lookAt(lt); c.gaze.lookAt(0, 0); } else { c.head.lookAt(null); c.gaze.lookAt(null); }

    // ---- jaw talk while this speaker's line is playing ----
    if (c.jawNode) {
      const amt = (c.speaking && textPlaying) ? talkJaw(now) : 0;
      c.jawNode.rotationQuaternion = c.jawRest.multiply(Q.RotationAxis(BABYLON.Axis.X, amt));
    }

    // ---- blink ----
    const e = c.eye;
    if (e) {
      const nowMs = performance.now();
      if (e.closedNow && nowMs >= e.end) { e.mat.albedoTexture = e.open; e.closedNow = false; }
      else if (!e.closedNow && nowMs >= e.next) { e.mat.albedoTexture = e.closed; e.closedNow = true; e.end = nowMs + 110; e.next = nowMs + 2400 + Math.random() * 3200; }
    }

    // ---- foot-lock (anti-slide): while STANDING, pin the support (lower) foot to a world
    // point so the body sways over planted feet instead of the feet ice-skating.
    //  · only when the active clip is SETTLED (>0.9) — running it mid-crossfade dragged the
    //    body as the foot pose blended (that was the residual transition "glitch").
    //  · hysteresis on the support foot (3cm) so a near-symmetric idle doesn't flip-flop
    //    L↔R and re-anchor every few seconds (that was the periodic idle foot-slide).
    //  · body clamped within R of its intended spot so it can't drift.
    const settled = (c.cw[c.clipTarget] || 0) > 0.9;
    if (FOOTLOCK && !(walking || celebrating || !settled) && c.footL && c.footR) {
      c.footL.computeWorldMatrix(true); c.footR.computeWorldMatrix(true);
      const pL = c.footL.absolutePosition, pR = c.footR.absolutePosition;
      const which = (pL.y <= pR.y) ? 'L' : 'R';                        // support = the lower (planted) foot
      const fw = (which === 'L') ? pL : pR;
      if (c.lockWhich !== which) { c.lockWhich = which; c.lockX = fw.x; c.lockZ = fw.z; }  // re-anchor on a real weight transfer
      c.holder.position.x += (c.lockX - fw.x);
      c.holder.position.z += (c.lockZ - fw.z);
      const sp = (c.state === 'speak') ? SPEAK_MARK : c.home;          // keep near the intended spot
      const dx = c.holder.position.x - sp.x, dz = c.holder.position.z - sp.z, dd = Math.hypot(dx, dz), R = 0.22;  // generous: feet plant, body sways as natural weight-shift (a tight clamp fights the lock → feet slide WORSE)
      if (dd > R) { c.holder.position.x = sp.x + dx / dd * R; c.holder.position.z = sp.z + dz / dd * R; }
    }
  }

  // ---- camera: ease toward the active shot + a continuous gentle drift (parallax).
  // v4: per-shot ease speed (slow k = the post-cut push-in), `orbit` walks the
  // shot's alpha over its hold time (celebration crane), and a follow shot
  // tracks its walker with a snappier target ease so the framing keeps up. ----
  if (!freeCam) {
    const k = Math.min(1, (shot.k || 1.6) * dt);
    const swayA = shot.sway ? shot.sway.amp * (1 - Math.cos(shot.sway.speed * (now - shotT0))) : 0;
    camCur.alpha += (shot.alpha + (shot.orbit || 0) * (now - shotT0) + swayA - camCur.alpha) * k;
    camCur.beta += (shot.beta - camCur.beta) * k;
    camCur.radius += (shot.radius - camCur.radius) * k;
    if (followChar) { followTgt.copyFrom(followChar.holder.position); followTgt.y += 1.45;
      BABYLON.Vector3.LerpToRef(camCur.target, followTgt, Math.min(1, 3.0 * dt), camCur.target); }
    else BABYLON.Vector3.LerpToRef(camCur.target, shot.target, k, camCur.target);
    camera.alpha = camCur.alpha + 0.05 * Math.sin(now * 0.13);
    camera.beta = camCur.beta + 0.015 * Math.sin(now * 0.11 + 1);
    camera.radius = camCur.radius + 0.25 * Math.sin(now * 0.09);
    camera.target.set(camCur.target.x + 0.12 * Math.sin(now * 0.08),
                      camCur.target.y + 0.04 * Math.sin(now * 0.10),
                      camCur.target.z + 0.10 * Math.sin(now * 0.07));
  }
});

// expression layer — runs AFTER aliveface (added later) so it biases on top
scene.onBeforeRenderObservable.add(() => {
  const dt = Math.min(0.05, engine.getDeltaTime() / 1000);
  for (const c of Object.values(chars)) {
    const tgt = c.expr || {};
    const names = new Set([...Object.keys(c.exprCur), ...Object.keys(tgt)]);
    for (const nm of names) {
      const cur = (c.exprCur[nm] || 0) + ((tgt[nm] || 0) - (c.exprCur[nm] || 0)) * Math.min(1, 4 * dt);
      c.exprCur[nm] = cur;
      const arr = c.morphs[nm]; if (arr) for (const t of arr) t.influence = Math.min(3.2, t.influence + cur);
    }
  }
});

// ================================================================ BOOT
Promise.all(order.map(loadChar)).then(() => {
  // COLD-OPEN tableau placement (supersedes the old startAtMark pre-placement:
  // the MC now ARRIVES at the mark via the dispersal): the whole company stands
  // in the centre-stage FORMATION facing the audience, waiting in the dark for
  // the boot to reveal them.
  for (const c of Object.values(chars)) {
    const f = FORMATION[c.name] || c.home;
    c.holder.position.set(f.x, 0, f.z);
    c.holder.rotation.y = Math.atan2(AUDIENCE.x - f.x, AUDIENCE.z - f.z);
  }
  // chat pairs turn to face each other from the first frame (the mingle driver
  // then cycles their clips; the MC's facing comes from her own cycle)
  for (const [a, b] of CHAT_PAIRS) {
    const ca = chars[a], cb = chars[b];
    if (!ca || !cb) continue;
    ca.chatYaw = faceYaw(ca.holder.position, cb.holder.position);
    cb.chatYaw = faceYaw(cb.holder.position, ca.holder.position);
    ca.holder.rotation.y = ca.chatYaw; cb.holder.rotation.y = cb.chatYaw;
    ca.chatLook = cb.holder.position.clone(); ca.chatLook.y = 1.65;
    cb.chatLook = ca.holder.position.clone(); cb.chatLook.y = 1.65;
  }
  revealFrames = 3;                  // show characters once idle has been applied (skip the T-pose)
  window.__ready = true;
  const sb = document.getElementById('startBtn'); sb.disabled = false; sb.textContent = '▶ Begin Ceremony';
  // ceremony starts when Begin is clicked (gesture unlocks audio) — see the #startBtn handler
}).catch(err => { console.error(err); window.__err = String(err);
  if (hooks.onFailed) { try { hooks.onFailed(err); } catch (e) { console.warn('ceremony: onFailed hook failed', e); } } });

engine.runRenderLoop(() => scene.render());
window.addEventListener('resize', () => { engine.resize(); fitWide(); });
}

window.MHSCeremonyPlayer = { start };
})();
