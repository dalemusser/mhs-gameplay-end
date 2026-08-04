/*
 * MHSCeremonyPlayer — performs a resolved linear ceremony script.
 *
 * Usage: MHSCeremonyPlayer.start({ layout: {mc, group[]}, beats: [...] })
 * The script is the OUTPUT of MHSCeremonyResolver.resolve(definition, eaScores) —
 * this module knows nothing about conditions or EA scores; it just performs beats.
 *
 * Expects the ceremony DOM (renderCanvas, bubble, controls, startOverlay) and the
 * Babylon + MHS helper libs (aliveface/gaze/headlook) to be loaded first.
 */
(function () {
'use strict';

function start(script) {
const V3 = BABYLON.Vector3, Color3 = BABYLON.Color3, Q = BABYLON.Quaternion;
const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
const scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color4(0.02, 0.03, 0.05, 1);
scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
scene.fogColor = new Color3(0.03, 0.05, 0.09);
scene.fogDensity = 0.045;

// ---------------------------------------------------------------- camera
// Cinematic: the camera eases toward a per-beat "shot", with a continuous gentle
// drift on top (slow orbit/dolly) for constant parallax → 3D/TV feel. beta > π/2
// looks slightly UP (see faces / under Tera's hat). Free-cam (F) for inspection.
const camera = new BABYLON.ArcRotateCamera('cam', Math.PI / 2, 1.585, 8.6,
  new V3(0.3, 1.75, 0.6), scene);
camera.fov = 0.92;
camera.minZ = 0.05; camera.maxZ = 200;
camera.wheelDeltaPercentage = 0.01;
let freeCam = false;                                   // F toggles manual orbit for inspection
const FOOTLOCK = false;                                 // anti-slide foot-lock — OFF: the planted Idle clip handles resting; the lock lurched the high-motion talk/cheer clips
// Fixed "audience" point out in front — characters face it / address it (eye level so
// faces aim level, not down).
const AUDIENCE = new V3(0.2, 1.72, 14);
// Named shots the camera eases between. speaker* frame the downstage mark; Tera's
// shot sits lower & looks further up so we see her face under the hat brim.
const SHOTS = {
  wide:        { alpha: Math.PI / 2,        beta: 1.585, radius: 8.6, target: new V3(0.3, 1.75, 0.6) },
  speaker:     { alpha: Math.PI / 2 - 0.05, beta: 1.605, radius: 3.9, target: new V3(0.2, 1.48, 2.9) },
  speakerTera: { alpha: Math.PI / 2 - 0.04, beta: 1.79, radius: 3.4, target: new V3(0.2, 1.24, 2.95) },
};
let shot = SHOTS.wide;
const setShot = s => { shot = s; };
const camCur = { alpha: shot.alpha, beta: shot.beta, radius: shot.radius, target: shot.target.clone() };

// ---------------------------------------------------------------- lighting
scene.environmentTexture = new BABYLON.CubeTexture('https://playground.babylonjs.com/textures/environment.env', scene);
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
keyL.intensity = 140; keyL.diffuse = new Color3(1, 0.97, 0.92);
const keyR = new BABYLON.SpotLight('keyR', new V3(-2.6, 7, 6), new V3(0.1, -1, -0.6), Math.PI / 3, 12, scene);
keyR.intensity = 120; keyR.diffuse = new Color3(0.95, 0.97, 1);
// cool rim from behind for separation
const rim = new BABYLON.DirectionalLight('rim', new V3(0.2, -0.4, 1), scene);
rim.intensity = 0.4; rim.diffuse = new Color3(0.4, 0.6, 1);
// holo spill light (cyan), sits at the display
const holoLight = new BABYLON.PointLight('holoLight', new V3(0, 3.2, -2.8), scene);
holoLight.intensity = 8; holoLight.diffuse = new Color3(0.3, 0.75, 1); holoLight.range = 13;

const shadow = new BABYLON.ShadowGenerator(1024, keyL);   // modest for low-end Chromebooks
shadow.useBlurExponentialShadowMap = true; shadow.blurKernel = 16; shadow.darkness = 0.45;

// ---------------------------------------------------------------- floor
const floor = BABYLON.MeshBuilder.CreateGround('floor', { width: 40, height: 40 }, scene);
const fmat = new BABYLON.PBRMaterial('fmat', scene);
fmat.albedoColor = new Color3(0.04, 0.05, 0.08);
fmat.metallic = 0.55; fmat.roughness = 0.28;           // glossy → catches the lights + holo glow
fmat.environmentIntensity = 0.5;
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
pipe.grainEnabled = true; pipe.grain.intensity = 2.5; pipe.grain.animated = true;
// NOTE: global chromatic aberration is OFF — it fringed the whole scene (fuzzy
// characters). The holo keeps its OWN local chromatic split inside its shader.
pipe.chromaticAberrationEnabled = false;

// ================================================================ HOLO DISPLAY
// A floating holographic panel: emissive content (drawn into a DynamicTexture)
// run through a holographic shader (scanlines, chromatic split, fresnel edge glow,
// flicker, materialize wipe), with a projector cone + rising dust + hover bob.
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
function drawSlide(title, subtitle) {
  const ctx = holoContent.getContext(); const W = 1024, H = 576;
  ctx.clearRect(0, 0, W, H);
  // subtle inner panel wash
  ctx.fillStyle = 'rgba(20,90,150,0.10)'; ctx.fillRect(40, 40, W - 80, H - 80);
  // corner brackets
  ctx.strokeStyle = 'rgba(150,225,255,0.95)'; ctx.lineWidth = 4; const m = 56, L = 90;
  const corner = (x, y, dx, dy) => { ctx.beginPath(); ctx.moveTo(x, y + dy * L); ctx.lineTo(x, y);
    ctx.lineTo(x + dx * L, y); ctx.stroke(); };
  corner(m, m, 1, 1); corner(W - m, m, -1, 1); corner(m, H - m, 1, -1); corner(W - m, H - m, -1, -1);
  // title
  ctx.textAlign = 'center'; ctx.fillStyle = '#dffaff';
  ctx.font = '700 76px Segoe UI, sans-serif';
  ctx.fillText((title || '').toUpperCase(), W / 2, H / 2 - 6);
  // underline
  ctx.strokeStyle = 'rgba(120,210,255,0.8)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(W / 2 - 230, H / 2 + 34); ctx.lineTo(W / 2 + 230, H / 2 + 34); ctx.stroke();
  // subtitle
  ctx.fillStyle = 'rgba(170,225,255,0.85)'; ctx.font = '400 34px Segoe UI, sans-serif';
  ctx.fillText(subtitle || '', W / 2, H / 2 + 84);
  holoContent.update();
}
drawSlide('STANDBY', 'Mission HydroSci');

// ---- screenshot image slides on the holo panel ----
// A beat's holo can be { images: ['unit2/Find Toppo.jpg', …] } instead of a procedural
// {title, subtitle} card. The images draw into the same DynamicTexture (so they get the
// full holo shader treatment) contain-fitted — the letterbox stays transparent, showing
// the panel grid. Multi-image lists pace across the spoken line with a short crossfade
// (see showText, which arms the schedule, and the render loop, which advances it).
const HOLO_BASE = 'assets/holo/';
const holoImageCache = new Map();          // rel path -> {img, ready}
function holoImage(rel) {
  let e = holoImageCache.get(rel);
  if (!e) {
    const img = new Image();
    e = { img, ready: false };
    img.onload = () => { e.ready = true; };
    img.src = HOLO_BASE + rel;
    holoImageCache.set(rel, e);
  }
  return e;
}
let slides = null;      // {entries, idx, per, fade:{from,to,p}|null, fresh} for the current beat
let holoToken = 0;      // guards a late image load from clobbering a newer holo
function drawImageSlide(a, b, p) {
  const ctx = holoContent.getContext(); const W = 1024, H = 576;
  ctx.clearRect(0, 0, W, H);
  const put = (e, alpha) => {
    if (!e || !e.ready) return;
    const iw = e.img.naturalWidth, ih = e.img.naturalHeight;
    const s = Math.min(W / iw, H / ih);
    const dw = iw * s, dh = ih * s;
    ctx.globalAlpha = alpha;
    ctx.drawImage(e.img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  };
  put(a, 1); if (b) put(b, p);
  ctx.globalAlpha = 1;
  holoContent.update();
}

const HOLO_W = 7.2, HOLO_H = 3.4, HOLO_Y = 4.0, HOLO_Z = -3.7;   // raised: bottom edge (~2.3) is above heads
const holo = BABYLON.MeshBuilder.CreatePlane('holo', { width: HOLO_W, height: HOLO_H, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, scene);
holo.position.set(0, HOLO_Y, HOLO_Z);      // big backdrop, raised (content above heads), pushed back
holo.rotation.y = Math.PI;                 // face the front (camera) un-mirrored
const holoMat = new BABYLON.ShaderMaterial('holoMat', scene,
  { vertex: 'holo', fragment: 'holo' },
  { attributes: ['position', 'normal', 'uv'], uniforms: ['worldViewProjection', 'world', 'time', 'reveal', 'tint', 'cameraPosition'], samplers: ['contentTex'] });
holoMat.setTexture('contentTex', holoContent);
holoMat.setColor3('tint', new Color3(0.45, 0.85, 1.0));
holoMat.setFloat('reveal', 1.0);
holoMat.backFaceCulling = false;
holoMat.needAlphaBlending = () => true;
holoMat.alphaMode = BABYLON.Engine.ALPHA_COMBINE;
holo.material = holoMat;
let holoReveal = 1, holoRevealTarget = 1;

// --- physical presence: a glowing 3D bezel frame around the panel ---
const bezelMat = new BABYLON.StandardMaterial('bezelMat', scene);
bezelMat.emissiveColor = new Color3(0.5, 1.2, 1.6); bezelMat.disableLighting = true;
const bezelGroup = new BABYLON.TransformNode('bezel', scene);
bezelGroup.position.set(0, HOLO_Y, HOLO_Z + 0.02);
const bar = (w, h, x, y) => { const b = BABYLON.MeshBuilder.CreateBox('bz', { width: w, height: h, depth: 0.12 }, scene);
  b.material = bezelMat; b.position.set(x, y, 0); b.parent = bezelGroup; b.isPickable = false; return b; };
const fw = HOLO_W + 0.5, fh = HOLO_H + 0.5, th = 0.07;
bar(fw, th, 0, fh / 2); bar(fw, th, 0, -fh / 2); bar(th, fh, fw / 2, 0); bar(th, fh, -fw / 2, 0);

// --- parallax depth: a faint grid plane BEHIND the content (revealed by camera drift) ---
const gridTex = new BABYLON.DynamicTexture('gridTex', { width: 512, height: 256 }, scene, false);
(() => { const g = gridTex.getContext(); g.clearRect(0, 0, 512, 256); g.strokeStyle = 'rgba(80,180,255,0.5)'; g.lineWidth = 1;
  for (let x = 0; x <= 512; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
  for (let y = 0; y <= 256; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); } gridTex.update(); })();
const gridPlane = BABYLON.MeshBuilder.CreatePlane('grid', { width: HOLO_W + 1.4, height: HOLO_H + 1.0 }, scene);
gridPlane.position.set(0, HOLO_Y, HOLO_Z - 0.6); gridPlane.rotation.y = Math.PI; gridPlane.isPickable = false;
const gridMat = new BABYLON.StandardMaterial('gridMat', scene);
gridMat.emissiveTexture = gridTex; gridMat.opacityTexture = gridTex; gridMat.disableLighting = true;
gridMat.emissiveColor = new Color3(0.2, 0.5, 0.8); gridMat.alpha = 0.4;
gridMat.alphaMode = BABYLON.Engine.ALPHA_ADD; gridMat.backFaceCulling = false;
gridPlane.material = gridMat;

// projector cone from the floor up to the panel
const coneH = HOLO_Y - 1.0;
const cone = BABYLON.MeshBuilder.CreateCylinder('cone', { height: coneH, diameterTop: 6.5, diameterBottom: 0.7, tessellation: 28, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, scene);
cone.position.set(0, coneH / 2, HOLO_Z); cone.isPickable = false;
const coneMat = new BABYLON.StandardMaterial('coneMat', scene);
coneMat.emissiveColor = new Color3(0.12, 0.42, 0.7); coneMat.disableLighting = true;
coneMat.alpha = 0.06; coneMat.alphaMode = BABYLON.Engine.ALPHA_ADD; coneMat.backFaceCulling = false;
cone.material = coneMat;

// rising holographic dust within the cone
const dust = new BABYLON.ParticleSystem('dust', 600, scene);
dust.particleTexture = new BABYLON.Texture('https://playground.babylonjs.com/textures/flare.png', scene);
dust.emitter = new V3(0, 0.1, HOLO_Z);
dust.minEmitBox = new V3(-3.0, 0, -0.6); dust.maxEmitBox = new V3(3.0, 0, 0.6);
dust.color1 = new BABYLON.Color4(0.4, 0.8, 1, 0.5); dust.color2 = new BABYLON.Color4(0.6, 0.9, 1, 0.3);
dust.colorDead = new BABYLON.Color4(0.2, 0.5, 0.9, 0);
dust.minSize = 0.015; dust.maxSize = 0.05; dust.minLifeTime = 3; dust.maxLifeTime = 6;
dust.emitRate = 70; dust.direction1 = new V3(-0.05, 1, -0.05); dust.direction2 = new V3(0.05, 1, 0.05);
dust.minEmitPower = 0.15; dust.maxEmitPower = 0.4; dust.gravity = new V3(0, 0.05, 0);
dust.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD; dust.start();

// confetti for the celebration (started on demand)
const confetti = new BABYLON.ParticleSystem('confetti', 1200, scene);
confetti.particleTexture = new BABYLON.Texture('https://playground.babylonjs.com/textures/flare.png', scene);
confetti.emitter = new V3(0, 6.5, 0.5);
confetti.minEmitBox = new V3(-4, 0, -1); confetti.maxEmitBox = new V3(4, 0.5, 1.5);
confetti.color1 = new BABYLON.Color4(1, 0.6, 0.2, 1); confetti.color2 = new BABYLON.Color4(0.4, 0.8, 1, 1);
confetti.colorDead = new BABYLON.Color4(1, 1, 1, 0);
confetti.minSize = 0.04; confetti.maxSize = 0.11; confetti.minLifeTime = 2.2; confetti.maxLifeTime = 4;
confetti.emitRate = 600; confetti.direction1 = new V3(-1, -2, -1); confetti.direction2 = new V3(1, -1, 1);
confetti.minEmitPower = 1; confetti.maxEmitPower = 3; confetti.gravity = new V3(0, -6, 0);
confetti.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;

// ================================================================ CHARACTERS
// screen-LEFT = +x (camera at alpha PI/2). The 4 NPCs stand on a shallow arc off to
// the screen-LEFT (each at a DISTINCT x so their forward exit lane is clear of the
// others); Toppo (MC) stands screen-RIGHT. To speak, a character WALKS to the
// downstage-centre MARK via a lane (forward out of the group, then across), delivers,
// then walks back — serialized so paths never overlap another body.
const STAGE = {
  Toppo:    { x: -3.0, z: 0.4 },                       // MC, stage-right
  Anderson: { x:  2.0, z: 0.2 },                       // group arc, stage-left
  Aryn:     { x:  2.9, z: 0.5 },
  Jasper:   { x:  3.8, z: 0.5 },
  Tera:     { x:  4.6, z: 0.2 },
};
const SPEAK_MARK = new V3(0.2, 0, 3.3);                // downstage centre, close to camera, below the raised holo
const MARK_LOOK = new V3(0.2, 1.62, 3.3);             // eye-level point AT the mark — the group looks here (fixed, no sweep)
const LANE_Z = 2.3;                                    // downstage lane: exit forward to here, then cross to the mark
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
  const r = await BABYLON.SceneLoader.ImportMeshAsync('', 'assets/characters/', name + '.glb?v=' + GLB_V, scene, null, '.glb');
  const holder = new BABYLON.TransformNode('h_' + name, scene);
  const pos = STAGE[name];
  holder.position.set(pos.x, 0, pos.z);
  const homeYaw = Math.atan2(AUDIENCE.x - pos.x, AUDIENCE.z - pos.z);  // home faces audience
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
    const closed = new BABYLON.Texture('assets/characters/_gen/' + name + '_eyeball_closed.png', scene, false, false);
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

// ================================================================ SCRIPT PLAYER
const beats = script.beats;
let idx = -1, currentSpeaker = null, celebrating = false;
let textPlaying = false, hlWords = [], hlStart = 0, hlDur = 0, hlTimes = null;
// Per-line ElevenLabs voice clips + word timings (assets/audio/ceremony_audio.json),
// keyed by lineId — generated by mhsaudiotools from tools/ceremony-lines.txt
// (see tools/export-lines.cjs). A beat whose lineId is absent from the manifest
// degrades to placeholder even-spacing.
const LINE_AUDIO = {}, AUDIO_V = 2;
fetch('assets/audio/ceremony_audio.json?v=' + AUDIO_V).then(r => r.json())
  .then(m => (m.items || []).forEach(it => { LINE_AUDIO[it.id] = it; }))
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

function setHolo(h) {
  // beat without holo: keep the panel content, but freeze any slide pacing so a
  // previous beat's images don't re-run against the new line's clock
  if (!h) { if (slides) slides.per = 0; return; }
  const token = ++holoToken;
  if (h.images && h.images.length) {
    const entries = h.images.map(holoImage);
    slides = { entries, idx: 0, per: 0, fade: null, fresh: true };
    const first = entries[0];
    const draw = () => { if (token === holoToken) drawImageSlide(first, null, 0); };
    if (first.ready) draw(); else first.img.addEventListener('load', draw, { once: true });
  } else {
    slides = null;
    drawSlide(h.title || '', h.subtitle || '');
  }
  holoReveal = 0; holoRevealTarget = 1;       // materialize
}

function showText(text) {
  stopLineAudio();
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
  // pace this beat's image slides across the line ("while dialogue plays, a holographic
  // projection is displayed"). `fresh` = armed once, by the beat that set the slides.
  if (slides && slides.fresh) {
    slides.fresh = false;
    if (slides.entries.length > 1) slides.per = hlDur / slides.entries.length;
  }
  hlStart = performance.now() / 1000;
  textPlaying = true;
  bubble.classList.add('show');
}

// ---- music (wired but silent until you drop in tracks) ----
// Set these to file URLs to enable, e.g. 'assets/audio/ceremony_bed.mp3'. The bed is
// a looping ambient track (fades in at the start, out at the end); the sting plays on
// the celebration. Browsers only allow audio after a user gesture, so the bed actually
// begins on the first Next/Restart click.
const MUSIC = { bed: null, sting: null };
const music = (() => {
  let bedEl = null;
  const fade = (el, to, sec) => { const from = el.volume, t0 = performance.now();
    const step = () => { const p = Math.min(1, (performance.now() - t0) / (sec * 1000)); el.volume = from + (to - from) * p;
      if (p < 1) requestAnimationFrame(step); else if (to === 0) el.pause(); }; step(); };
  return {
    bed(on) { if (!MUSIC.bed) return; if (on) { if (!bedEl) { bedEl = new Audio(MUSIC.bed); bedEl.loop = true; bedEl.volume = 0; } bedEl.play().then(() => fade(bedEl, 0.45, 2.0)).catch(() => {}); } else if (bedEl) fade(bedEl, 0, 1.2); },
    sting() { if (!MUSIC.sting) return; const a = new Audio(MUSIC.sting); a.volume = 0.7; a.play().catch(() => {}); },
  };
})();

let pendingBeat = null;     // line to start once the speaker reaches the mark
let pendingSpeaker = null;  // walks out once the stage is clear (serialized)
let celebWaiting = false, celebDur = 4, celebReadyAt = 0;  // celebration auto-advance: hold AFTER everyone's home (so the returning speaker gets to celebrate)
// Walk along a quadratic Bézier (start → corner control → end) so the turn is ONE smooth
// arc, not a hard pivot. The corner control sits out in the character's own lane.
const sendBack = c => { if (c.state === 'out' || c.state === 'speak') { c.state = 'back'; c.curve = { p0: c.holder.position.clone(), p1: new V3(c.home.x, 0, LANE_Z), p2: c.home.clone() }; c.t = 0; } };
const startOut = c => { c.state = 'out'; c.curve = { p0: c.holder.position.clone(), p1: new V3(c.home.x, 0, LANE_Z), p2: SPEAK_MARK.clone() }; c.t = 0; };

function enterBeat(i) {
  if (i < 0 || i >= beats.length) return;
  idx = i; const beat = beats[i];
  const spk = beat.speaker ? chars[beat.speaker] : null;
  // Same-speaker continuation: unit sections give one NPC several consecutive lines.
  // If this beat's speaker is already at (or walking to) the mark, they stay and
  // deliver — no walk home and back between their own lines.
  const continuing = !!spk && (spk.state === 'speak' || spk.state === 'out');
  celebrating = false; currentSpeaker = null; textPlaying = false; pendingBeat = null; pendingSpeaker = null; celebWaiting = false;
  stopLineAudio();
  confetti.stop();
  bubble.classList.remove('show');

  // previous speaker walks home; others reset (the continuing speaker holds the mark)
  for (const c of Object.values(chars)) {
    c.speaking = false; c.expr = EXPR.neutral;
    if (!(continuing && c === spk)) sendBack(c);
  }

  if (beat.type === 'celebration') {
    setShot(SHOTS.wide);
    celebrating = true;
    for (const c of Object.values(chars)) c.expr = EXPR[beat.expression] || EXPR.happy;  // clip = each char's cheerClip (set in the loop)
    if (beat.fx === 'confetti') confetti.start();
    music.sting();
    setHolo(beat.holo);
    // Auto-advance: don't start the clock yet — wait until the returning speaker is home
    // (handled in the render loop), THEN hold for `duration` so everyone celebrates together.
    if (beat.advance === 'auto') { celebWaiting = true; celebDur = beat.duration || 5; celebReadyAt = 0; }
    updateNextLabel();
    return;
  }

  currentSpeaker = spk;
  if (spk) { spk.expr = EXPR[beat.expression] || EXPR.neutral;
    // mood-matched standing delivery clip (Intro/Meeting_Start is a SEATED clip → unused)
    spk.deliveryClip = MOOD_CLIP[beat.expression] || 'TalkBigIdea'; }
  setHolo(beat.holo);
  speakerNameEl.textContent = beat.speaker;
  if (continuing) {
    if (spk.state === 'speak') {           // already at the mark → keep the shot, deliver now
      spk.speaking = true;
      setShot(spk.name === 'Tera' ? SHOTS.speakerTera : SHOTS.speaker);
      showText(beat.text || '');
    } else {
      pendingBeat = beat;                  // still walking out → arrival shows the text
    }
  } else {
    setShot(SHOTS.wide);
    pendingSpeaker = spk;
    pendingBeat = beat;                    // showText fires when the speaker arrives at the mark
  }
  updateNextLabel();
}

function advance() { if (idx < beats.length - 1) enterBeat(idx + 1); else finish(); }
let finished = false;
function finish() { finished = true; bubble.classList.remove('show'); setShot(SHOTS.wide); music.bed(false); stopLineAudio(); updateNextLabel(); }
function updateNextLabel() {
  if (finished || idx >= beats.length - 1) { nextBtn.textContent = '↺ Restart'; }
  else nextBtn.textContent = 'Next ▶';
}
let musicStarted = false;
nextBtn.addEventListener('click', () => {
  if (!musicStarted) { musicStarted = true; music.bed(true); }   // first user gesture → start the ambient bed
  if (finished || idx >= beats.length - 1) { finished = false; enterBeat(0); }
  else advance();
});
replayBtn.addEventListener('click', () => { if (currentSpeaker && beats[idx]) {
  if (lineAudio) { try { lineAudio.currentTime = 0; lineAudio.play().catch(() => {}); } catch (e) {} }
  hlStart = performance.now() / 1000; textPlaying = true;
} });

// start gate: nothing makes sound until this click (browser autoplay policy)
document.getElementById('startBtn').addEventListener('click', () => {
  if (!window.__ready) return;
  document.getElementById('startOverlay').classList.add('hide');
  if (!musicStarted) { musicStarted = true; music.bed(true); }
  enterBeat(0);
});

// keyboard: F free camera, R restart
window.addEventListener('keydown', e => {
  if (e.key === 'f' || e.key === 'F') { freeCam = !freeCam; if (freeCam) camera.attachControl(canvas, true); else camera.detachControl(); }
  if (e.key === 'r' || e.key === 'R') { finished = false; enterBeat(0); }
});

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

  // reveal characters after idle has been applied for a couple frames (no T-pose)
  if (revealFrames > 0) { revealFrames--; if (revealFrames === 0) for (const c of Object.values(chars)) c.meshes.forEach(m => m.isVisible = true); }

  // serialized transitions: start the pending speaker walking once nobody is returning
  if (pendingSpeaker && pendingSpeaker.state === 'home') {
    if (!Object.values(chars).some(c => c.state === 'back')) { startOut(pendingSpeaker); pendingSpeaker = null; }
  }

  // celebration auto-advance: start the hold only once the returning speaker is home, so
  // everyone celebrates together (and the late arrival isn't cut off mid-cheer)
  if (celebWaiting) {
    const anyWalking = Object.values(chars).some(c => c.state === 'out' || c.state === 'back');
    if (anyWalking) celebReadyAt = now + celebDur;             // keep pushing while someone's still returning
    else if (now >= celebReadyAt) { celebWaiting = false; advance(); }
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
    if (elapsed >= hlDur || (lineAudio && lineAudio.ended)) textPlaying = false;
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
      if (want !== slides.idx) slides.fade = { from: slides.idx, to: want, p: 0 };
    }
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
      if (c.t >= 1) {                                      // reached the end of the curve
        c.t = 1;
        if (c.state === 'out') { c.state = 'speak'; c.speaking = true;
          setShot(c.name === 'Tera' ? SHOTS.speakerTera : SHOTS.speaker);
          if (pendingBeat && c === currentSpeaker) { showText(pendingBeat.text || ''); pendingBeat = null; } }
        else c.state = 'home';
      }
      const t = c.t, mt = 1 - t;                           // position B(t)
      pos.x = mt * mt * cv.p0.x + 2 * mt * t * cv.p1.x + t * t * cv.p2.x;
      pos.z = mt * mt * cv.p0.z + 2 * mt * t * cv.p1.z + t * t * cv.p2.z;
      c.holder.rotation.y += wrap(Math.atan2(tanX, tanZ) - c.holder.rotation.y) * Math.min(1, 7 * dt);   // ease toward the curve tangent
    } else {                                               // standing: ease to face audience (speak) / home heading
      const fy = (c.state === 'speak') ? Math.atan2(AUDIENCE.x - pos.x, AUDIENCE.z - pos.z) : c.homeYaw;
      c.holder.rotation.y += wrap(fy - c.holder.rotation.y) * Math.min(1, 6 * dt);
    }

    // ---- choose the active clip by state, then crossfade to it ----
    let clip;
    if (walking) clip = 'Walk';                                           // WALKING wins over celebrating (a returning speaker must still walk, not cheer-in-place & slide)
    else if (celebrating) clip = c.cheerClip;                             // clap / cheer
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

  // ---- camera: ease toward the active shot + a continuous gentle drift (parallax) ----
  if (!freeCam) {
    const k = Math.min(1, 1.6 * dt);
    camCur.alpha += (shot.alpha - camCur.alpha) * k;
    camCur.beta += (shot.beta - camCur.beta) * k;
    camCur.radius += (shot.radius - camCur.radius) * k;
    BABYLON.Vector3.LerpToRef(camCur.target, shot.target, k, camCur.target);
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
  revealFrames = 3;                  // show characters once idle has been applied (skip the T-pose)
  window.__ready = true;
  const sb = document.getElementById('startBtn'); sb.disabled = false; sb.textContent = '▶ Begin Ceremony';
  // ceremony starts when Begin is clicked (gesture unlocks audio) — see the #startBtn handler
}).catch(err => { console.error(err); window.__err = String(err); });

engine.runRenderLoop(() => scene.render());
window.addEventListener('resize', () => engine.resize());
}

window.MHSCeremonyPlayer = { start };
})();
