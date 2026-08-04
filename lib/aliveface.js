/*
 * MHSAliveFace — a small, reusable "idle facial life" layer for MHS characters.
 *
 * Problem it solves: a character standing or walking with a frozen neutral face
 * (only blinking) reads as a plastic doll. This drives the expression morphs with
 * (1) a continuous, very subtle DRIFT so the face is never perfectly still, and
 * (2) occasional gentle BEATS (a small smile, a brow raise, a thoughtful look)
 * that ease in and out — so the character looks like it has passing thoughts.
 *
 * It is intentionally SUBTLE and SLOW (overdriven idle faces look manic/uncanny),
 * and each instance is desynced by a per-character seed so a crowd doesn't emote
 * in lockstep.
 *
 * This is phase 1 of a larger plan (see docs/facial-aliveness.md): blink, gaze
 * (eye saccades) and head looks are layered on later. It only touches morph
 * targets, so it composes cleanly on top of body animation (walk/idle/etc.).
 *
 * Usage (UMD global, include via <script src="lib/aliveface.js">):
 *   const face = MHSAliveFace.attach(result, scene, { seed: 123 });
 *   // result = BABYLON.SceneLoader.ImportMeshAsync(...) result, OR a mesh array,
 *   // OR a single mesh, OR anything with getChildMeshes().
 *   face.setEnabled(false);  face.setIntensity(0.5);  face.dispose();
 */
(function (global) {
  'use strict';

  // Gentle, low-amplitude expression "beats". Each is a target pose (morph -> weight)
  // that eases in, holds, and eases out. Keep weights modest; this is ambient life,
  // not acting. Avoid strong Angry/Sad here — they read as real emotional events.
  // NOTE on magnitudes: these character blendshapes are SUBTLE — a unit of
  // influence moves verts only ~1-3% of the head, so the viewer's "1.0 = full"
  // really reads at ~1.5-3.0. Weights below are therefore in the 1-2 range, NOT
  // the <1 you'd expect, and `intensity` scales them. (Driving at ~0.3 like the
  // first cut was ~10x too weak to see.)
  const BEATS = [
    { weights: { 'Happy': 1.8 } },                                    // smile
    { weights: { 'Eyebrow Raise': 2.0 } },                            // brow flash / interest
    { weights: { 'Eyebrow Raise': 1.4, 'Surprised': 1.2 } },          // curiosity
    { weights: { 'Happy': 1.3, 'Mouth Up': 1.1 } },                   // pleasant
    { weights: { 'Eyebrow Lower': 1.3, 'Mouth Down': 0.9 } },         // thoughtful / focused
    { weights: { 'Serious': 1.3 } },                                  // brief seriousness
    { weights: { 'Happy': 1.0, 'Eyebrow Raise': 1.3 } },              // attentive
  ];

  // Always-on drift channels: morph -> peak amplitude. These oscillate slowly
  // between 0 and the amplitude, so the resting face has gentle, shifting life.
  const DRIFT = {
    'Happy': 0.50,
    'Eyebrow Raise': 0.70,
    'Mouth Up': 0.40,
  };

  // smooth, slow, non-obviously-periodic wave in ~[0,1]
  function wave(t, f1, f2, ph) {
    return 0.5 + 0.25 * Math.sin(t * f1 + ph) + 0.25 * Math.sin(t * f2 + ph * 1.73);
  }

  function collectMorphs(target) {
    let meshes;
    if (!target) meshes = [];
    else if (Array.isArray(target)) meshes = target;
    else if (target.meshes) meshes = target.meshes;                 // ImportMeshAsync result
    else if (target.morphTargetManager) meshes = [target];          // single mesh
    else if (typeof target.getChildMeshes === 'function') meshes = target.getChildMeshes(false);
    else meshes = [];
    const byName = {};                                              // name -> [MorphTarget]
    for (const m of meshes) {
      const mgr = m && m.morphTargetManager;
      if (!mgr) continue;
      for (let i = 0; i < mgr.numTargets; i++) {
        const t = mgr.getTarget(i);
        (byName[t.name] = byName[t.name] || []).push(t);
      }
    }
    return byName;
  }

  function attach(target, scene, opts) {
    opts = opts || {};
    const byName = collectMorphs(target);
    const seed = (opts.seed != null ? opts.seed : Math.random() * 1000);
    const intensityRef = { v: opts.intensity != null ? opts.intensity : 1.0 };
    const gap = [opts.beatMinGap || 4.0, opts.beatMaxGap || 8.0];   // seconds between beats
    let enabled = opts.enabled !== false;

    // every morph name we manage (drift channels + any morph used by a beat),
    // so we can zero them out cleanly each frame.
    const managed = new Set(Object.keys(DRIFT));
    for (const b of BEATS) for (const k in b.weights) managed.add(k);

    const setInfluence = (name, v) => { const arr = byName[name]; if (arr) for (const t of arr) t.influence = v; };

    let last = performance.now();
    let beat = null;                                               // { weights, start, dur, inT, outT }
    let nextBeatAt = (last / 1000) + gap[0] + Math.random() * (gap[1] - gap[0]);

    function startBeat(nowSec) {
      const b = BEATS[(Math.random() * BEATS.length) | 0];
      const dur = 1.6 + Math.random() * 1.2;                       // 1.6–2.8s total
      beat = { weights: b.weights, start: nowSec, dur, inT: 0.5, outT: 0.7 };
    }

    function beatEnvelope(nowSec) {
      if (!beat) return 0;
      const e = nowSec - beat.start;
      if (e >= beat.dur) { beat = null; nextBeatAt = nowSec + gap[0] + Math.random() * (gap[1] - gap[0]); return 0; }
      if (e < beat.inT) return e / beat.inT;                       // ease in
      const outStart = beat.dur - beat.outT;
      if (e > outStart) return Math.max(0, (beat.dur - e) / beat.outT); // ease out
      return 1;                                                    // hold
    }

    function update() {
      const now = performance.now();
      last = now;
      if (!enabled) return;
      const tSec = now / 1000;
      const k = intensityRef.v;

      // start a beat when due; beatEnvelope ends it + schedules the next one
      if (!beat && tSec >= nextBeatAt) startBeat(tSec);
      const env = beatEnvelope(tSec);

      // accumulate target influence per managed morph
      const out = {};
      for (const name of managed) out[name] = 0;
      // drift layer
      let i = 0;
      for (const name in DRIFT) {
        const ph = seed + (i++) * 2.39;
        out[name] += DRIFT[name] * wave(tSec, 0.13, 0.37, ph) * k;
      }
      // beat layer
      if (beat) for (const name in beat.weights) out[name] = (out[name] || 0) + beat.weights[name] * env * k;

      for (const name of managed) setInfluence(name, Math.min(3.5, out[name])); // ceiling (exaggeration limit)
    }

    const obs = scene ? scene.onBeforeRenderObservable.add(update) : null;

    return {
      update,                                                       // manual drive if no scene loop is used
      setEnabled(b) { enabled = b; if (!b) for (const n of managed) setInfluence(n, 0); },
      setIntensity(v) { intensityRef.v = v; },
      hasMorphs: Object.keys(byName).length > 0,
      dispose() { if (obs) scene.onBeforeRenderObservable.remove(obs); for (const n of managed) setInfluence(n, 0); },
    };
  }

  global.MHSAliveFace = { attach };
})(typeof window !== 'undefined' ? window : this);
