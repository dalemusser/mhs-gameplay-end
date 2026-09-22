// Optimize the ceremony's character GLBs — run by tools/optimize.sh (v0.2.0).
//   node optimize-glb.mjs <in-dir> <out-dir>
// - drops the animation clips the player never references
// - resamples the remaining clips (removes redundant keyframes, lossless for linear motion)
// - dedup + prune
// - textures → WebP, capped at 1024 px (EXT_texture_webp; Babylon's loader supports it)
// Morph targets, skins, node names and material names are untouched (the facial layers key on them).
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, resample, textureCompress } from '@gltf-transform/functions';
import sharp from 'sharp';
import { statSync, mkdirSync } from 'node:fs';

const [inDir, outDir] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
// Every clip lib/player.js can ask for (grep "'<Clip>'" — MOOD_CLIP, CHAT_LISTENS, cheerClip, mingle, walk).
const KEEP = new Set(['Idle', 'Fidget1', 'Fidget2', 'Listen', 'Walk', 'Clap', 'Cheer',
  'TalkBigIdea', 'TalkUpbeat', 'TalkSad', 'GestureUp', 'Surprised', 'Talking1', 'Talking2', 'Talking3']);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
for (const name of ['Toppo', 'Jasper', 'Tera', 'Anderson', 'Aryn']) {
  const src = `${inDir}/${name}.glb`, dst = `${outDir}/${name}.glb`;
  const doc = await io.read(src);
  const root = doc.getRoot();
  const before = root.listAnimations().map(a => a.getName());
  for (const a of root.listAnimations()) if (!KEEP.has(a.getName())) a.dispose();
  // Orphan samplers: translation samplers whose channels were removed when the
  // walk cycle was corrected. They still carry keyframe data (about a third of
  // each clip) and they break the resampler, which cannot size a sampler
  // without a channel.
  let orphans = 0;
  for (const a of root.listAnimations()) {
    const used = new Set(a.listChannels().map(c => c.getSampler()));
    for (const s of a.listSamplers()) if (!used.has(s)) { s.dispose(); orphans++; }
  }
  await doc.transform(
    resample({ tolerance: 1e-3 }),
    dedup(),
    prune(),
    textureCompress({ encoder: sharp, targetFormat: 'webp', quality: 90, resize: [1024, 1024] }),
  );
  await io.write(dst, doc);
  const kept = root.listAnimations().map(a => a.getName());
  const morphs = root.listMeshes().reduce((n, m) => n + m.listPrimitives().reduce((k, p) => Math.max(k, p.listTargets().length), 0), 0);
  console.log(`${name}: ${(statSync(src).size / 1048576).toFixed(2)} MB -> ${(statSync(dst).size / 1048576).toFixed(2)} MB; clips ${before.length} -> ${kept.length}; orphan samplers dropped ${orphans}; skins ${root.listSkins().length}; max morph targets ${morphs}; textures ${root.listTextures().map(t => t.getMimeType().replace('image/', '') + ' ' + (t.getSize() || []).join('x')).join(', ')}`);
}
