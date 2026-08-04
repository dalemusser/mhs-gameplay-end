/*
 * MHSHeadLook — reusable subtle head-turn layer for MHS characters.
 *
 * Layers a small, slow head rotation ON TOP of whatever the body clip is doing,
 * so the head isn't rigidly forward. The eyes are weighted to DEF-head, so this
 * also carries the eyes (the gaze offset rides on top) — keeping head + eyes
 * coherent. Phase 3 of the facial-aliveness plan; pairs with MHSGaze + MHSAliveFace.
 *
 * Mechanism: each frame (after the animation has set DEF-head), capture the clip's
 * head rotation as the base, post-multiply a damped yaw (local Y) + pitch (local X)
 * offset, then RESTORE the base in onAfterRender so clips that don't keyframe the
 * head (or rest pose) don't accumulate drift. (Axes verified on the DEF-head node:
 * local Y ≈ world-up = yaw, local X ≈ world-right = pitch.)
 *
 * Motion: slow random "look" targets (held 1.5–4.5 s, ~40% facing forward), eased
 * gently so the head drifts rather than snaps. Subtle by design.
 *
 * Usage (UMD global, include via <script src="lib/headlook.js">):
 *   const head = MHSHeadLook.attach(result, scene, { intensity: 1.0 });
 *   head.setEnabled(false);  head.setIntensity(1.3);  head.dispose();
 *
 * Directed look (e.g. "turn to look at the speaker"): head.lookAt(worldVec3) aims
 * the head's FACE at that world point with a true world-space look rotation —
 * independent of whatever the body clip is doing to the head (so it can't inherit
 * the idle's head motion and end up looking off-target). head.lookAt(null) resumes
 * the random wander. Eases smoothly toward the target.
 */
(function (global) {
  'use strict';

  function findSkeleton(target, scene) {
    if (target && target.skeletons && target.skeletons[0]) return target.skeletons[0];
    let meshes = target && target.meshes ? target.meshes
      : Array.isArray(target) ? target
      : (target && target.getChildMeshes) ? target.getChildMeshes(false) : [];
    for (const m of meshes) if (m && m.skeleton) return m.skeleton;
    return (scene && scene.skeletons && scene.skeletons[0]) || null;
  }

  function attach(target, scene, opts) {
    opts = opts || {};
    const sk = findSkeleton(target, scene);
    const headBone = sk && (sk.bones.find(b => b.name === 'DEF-head') || sk.bones.find(b => /head$/i.test(b.name)));
    const headNode = headBone && headBone.getTransformNode();
    const intensityRef = { v: opts.intensity != null ? opts.intensity : 1.0 };
    const faceYaw = opts.faceYaw || 0;     // radians; corrects a face-vs-bone yaw offset in the mesh (directed look only)
    let enabled = opts.enabled !== false;

    const YAW = 0.28, PITCH = 0.12;          // radians of wander travel at intensity 1
    const Q = BABYLON.Quaternion, AX = BABYLON.Axis, Vec = BABYLON.Vector3, Mat = BABYLON.Matrix;
    let last = performance.now() / 1000;
    let curY = 0, curP = 0, tgtY = 0, tgtP = 0;   // wander current/target offsets in RADIANS
    let nextAt = last + 1.0 + Math.random() * 2.0;
    let base = null;
    let lookTarget = null;                         // world Vector3 to aim the face at (directed)
    let curLocal = null;                           // eased local quaternion while in directed mode
    const MAX_TURN = 1.0;
    const UP = new Vec(0, 1, 0);

    function pickTarget(t) {
      if (Math.random() < 0.4) { tgtY = 0; tgtP = 0; }        // ~40% return to facing forward
      else { tgtY = (Math.random() * 2 - 1) * YAW * intensityRef.v;
             tgtP = (Math.random() * 2 - 1) * 0.5 * PITCH * intensityRef.v; }
      nextAt = t + 1.5 + Math.random() * 3.0;                 // hold longer than the eyes do
    }

    const applyObs = (scene && headNode) ? scene.onBeforeRenderObservable.add(() => {
      const now = performance.now() / 1000;
      const dt = Math.min(0.05, now - last); last = now;
      base = headNode.rotationQuaternion ? headNode.rotationQuaternion.clone()
                                         : Q.FromEulerVector(headNode.rotation);
      if (lookTarget) {                                       // ---- directed world-space aim ----
        // MINIMAL-ARC: rotate the head's CURRENT face direction onto the target by the
        // smallest world rotation (clamped). Uses the actual current face vector (no axis
        // assumptions) and TransformNode.rotate(Space.WORLD) (Babylon does the local math),
        // so it can't leak pitch or flip. Preserves up.
        headNode.rotationQuaternion = base.clone();
        headNode.computeWorldMatrix(true);
        const wm = headNode.getWorldMatrix().m;
        const curFace = new Vec(wm[8], wm[9], wm[10]); curFace.normalize();
        // per-character face correction: if the mesh's face is modeled at a yaw offset from
        // the head bone's +Z, rotate curFace by that offset so we aim the ACTUAL face at the
        // target (and the head turns minimally — no post-aim roll/cock that reads as a head-tilt).
        if (faceYaw) curFace.rotateByQuaternionToRef(Q.RotationAxis(UP, faceYaw), curFace);
        const dir = lookTarget.subtract(new Vec(wm[12], wm[13], wm[14]));
        if (dir.lengthSquared() > 1e-6) {
          dir.normalize();
          let angle = Math.acos(Math.max(-1, Math.min(1, Vec.Dot(curFace, dir))));
          if (angle > MAX_TURN) angle = MAX_TURN;     // clamp BEFORE choosing the axis (never a near-180° flip)
          if (angle > 1e-3) {
            let axis = Vec.Cross(curFace, dir);
            if (axis.lengthSquared() < 1e-6) {        // near parallel/anti-parallel → stable axis (no degenerate flip)
              axis = Vec.Cross(curFace, UP);
              if (axis.lengthSquared() < 1e-6) axis = new Vec(1, 0, 0);
            }
            axis.normalize();
            headNode.rotate(axis, angle, BABYLON.Space.WORLD);
          }
          const qLocal = headNode.rotationQuaternion.clone();
          if (!curLocal) curLocal = base.clone();
          Q.SlerpToRef(curLocal, qLocal, Math.min(1, 6 * dt), curLocal);
          headNode.rotationQuaternion = curLocal.clone();
        }
      } else {                                                // ---- random wander offsets ----
        curLocal = null;
        let k;
        if (enabled) { if (now >= nextAt) pickTarget(now); k = Math.min(1, 1.8 * dt); }
        else { tgtY = 0; tgtP = 0; k = Math.min(1, 1.8 * dt); }
        curY += (tgtY - curY) * k; curP += (tgtP - curP) * k;
        headNode.rotationQuaternion = base.multiply(Q.RotationAxis(AX.Y, curY)).multiply(Q.RotationAxis(AX.X, curP));
      }
    }) : null;

    // restore the clip's value after the frame renders, so a clip that doesn't
    // keyframe the head (or rest pose) doesn't accumulate our offset frame over frame
    const restoreObs = (scene && headNode) ? scene.onAfterRenderObservable.add(() => {
      if (base) headNode.rotationQuaternion = base;
    }) : null;

    return {
      setEnabled(b) { enabled = b; },                         // eases to forward via target 0
      setIntensity(v) { intensityRef.v = v; },
      lookAt(worldTarget) {                                   // Vector3 world point, or null → resume wander
        lookTarget = worldTarget || null;
        if (!lookTarget) curLocal = null;
      },
      headNode,                                               // for the caller's look-at geometry
      hasHead: !!headNode,
      dispose() {
        if (applyObs) scene.onBeforeRenderObservable.remove(applyObs);
        if (restoreObs) scene.onAfterRenderObservable.remove(restoreObs);
        if (headNode && base) headNode.rotationQuaternion = base;
      },
    };
  }

  global.MHSHeadLook = { attach };
})(typeof window !== 'undefined' ? window : this);
