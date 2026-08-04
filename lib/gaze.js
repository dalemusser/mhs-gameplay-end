/*
 * MHSGaze — reusable eye-gaze (saccade) layer for MHS characters.
 *
 * The eyes are a flat decal whose iris is baked CENTERED into the eye texture
 * (with sclera margin). There are no usable eye bones (the decal is weighted to
 * the head), so gaze is done by shifting the eye material's albedoTexture
 * uOffset/vOffset, which slides the iris over the sclera. Both eyes share one
 * texture, so they always look the SAME direction (conjugate gaze — what we want).
 *
 * Motion model = saccades: the eyes snap quickly to a new offset, hold for a
 * beat, occasionally recenter. This is the single biggest fix for the "dead
 * shark eye" look. Pairs with MHSAliveFace (expressions) and, later, head turns.
 *
 * Blink-aware: the host pages blink by SWAPPING the eye texture, so we re-apply
 * the offset to whichever texture is currently bound each frame (and set its wrap
 * to CLAMP so a shift reveals sclera, not a wrapped iris).
 *
 * Usage (UMD global, include via <script src="lib/gaze.js">):
 *   const gaze = MHSGaze.attach(result, scene, { intensity: 1.0 });
 *   gaze.setEnabled(false);  gaze.setIntensity(1.4);  gaze.dispose();
 *
 * Directed look: gaze.lookAt(yawRad, pitchRad) aims the iris in that direction
 * (overrides the random saccades); gaze.lookAt(null) resumes wandering. Used with
 * MHSHeadLook so the eyes + head track the same target (e.g. the active speaker).
 */
(function (global) {
  'use strict';

  function findEyeMaterial(target) {
    let meshes;
    if (!target) meshes = [];
    else if (Array.isArray(target)) meshes = target;
    else if (target.meshes) meshes = target.meshes;
    else if (typeof target.getChildMeshes === 'function') meshes = target.getChildMeshes(false);
    else meshes = [target];
    for (const m of meshes) {
      if (m && /eye/i.test(m.name) && m.material && m.material.albedoTexture) return m.material;
    }
    return null;
  }

  function attach(target, scene, opts) {
    opts = opts || {};
    const eyeMat = findEyeMaterial(target);
    const intensityRef = { v: opts.intensity != null ? opts.intensity : 1.0 };
    let enabled = opts.enabled !== false;

    const H = 0.22, V = 0.10;          // half-range of iris travel (uOffset/vOffset) at intensity 1
    const LOOK_YAW_FULL = 0.5, LOOK_PITCH_FULL = 0.35;  // rad that maps to full iris deflection
    let last = performance.now() / 1000;
    let curU = 0, curV = 0, tgtU = 0, tgtV = 0;   // normalized -1..1
    let nextSaccadeAt = last + 0.4 + Math.random() * 1.4;
    let lastTex = null;
    let looking = false, lookU = 0, lookV = 0;    // directed look-at (overrides saccades)

    function pickTarget(tSec) {
      if (Math.random() < 0.28) { tgtU = 0; tgtV = 0; }    // ~28% glance back to center
      else {                                               // else a DECISIVE glance in some direction
        const mag = 0.5 + Math.random() * 0.5;             // 0.5..1.0 (not tiny)
        const ang = Math.random() * Math.PI * 2;
        tgtU = Math.cos(ang) * mag;
        tgtV = Math.sin(ang) * mag * 0.55;                 // less vertical than horizontal
      }
      nextSaccadeAt = tSec + 0.7 + Math.random() * 2.0;    // hold this gaze a beat
    }

    function update() {
      const now = performance.now() / 1000;
      const dt = Math.min(0.05, now - last); last = now;
      if (!eyeMat) return;
      if (looking) { tgtU = lookU; tgtV = lookV; }           // directed look-at overrides saccades
      else if (enabled) { if (now >= nextSaccadeAt) pickTarget(now); }
      else { tgtU = 0; tgtV = 0; }                          // disabled → ease back to center
      const k = Math.min(1, 22 * dt);                       // snappy (saccades are fast)
      curU += (tgtU - curU) * k;
      curV += (tgtV - curV) * k;
      const tex = eyeMat.albedoTexture;
      if (!tex) return;
      if (tex !== lastTex) {                                // new texture (e.g. blink swap) → set CLAMP once
        tex.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
        tex.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
        lastTex = tex;
      }
      // clamp so the iris stays ON the sclera even at high intensity
      const cl = (x, m) => Math.max(-m, Math.min(m, x));
      tex.uOffset = cl(curU * H * intensityRef.v, 0.26);
      tex.vOffset = cl(curV * V * intensityRef.v, 0.14);
    }

    const obs = scene ? scene.onBeforeRenderObservable.add(update) : null;
    return {
      update,
      setEnabled(b) { enabled = b; },                       // update() eases to center when disabled
      setIntensity(v) { intensityRef.v = v; },
      lookAt(yawRad, pitchRad) {                             // directed look; null → resume saccades
        if (yawRad == null) { looking = false; }
        else { looking = true;
          lookU = Math.max(-1, Math.min(1, yawRad / LOOK_YAW_FULL));
          lookV = Math.max(-1, Math.min(1, (pitchRad || 0) / LOOK_PITCH_FULL)); }
      },
      hasEyes: !!eyeMat,
      dispose() { if (obs) scene.onBeforeRenderObservable.remove(obs); if (eyeMat && eyeMat.albedoTexture) { eyeMat.albedoTexture.uOffset = 0; eyeMat.albedoTexture.vOffset = 0; } },
    };
  }

  global.MHSGaze = { attach };
})(typeof window !== 'undefined' ? window : this);
