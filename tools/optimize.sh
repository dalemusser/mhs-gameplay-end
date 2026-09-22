#!/usr/bin/env bash
# Re-derive the ceremony's shipped assets from the ORIGINAL exports (v0.2.0):
#
#   tools/optimize.sh <originals-dir> [target-dir]
#
# <originals-dir> holds the unoptimized assets in the repo's layout
# (assets/characters/*.glb, assets/audio_v6/<Speaker>/*.mp3, assets/music,
# assets/sfx, assets/holo/**/*.jpg, assets/logo/mhs-logo.png). The originals
# live in git history at tag `assets-original` (checkout that tag into a
# scratch folder), or in the designers'/mocap exports. [target-dir] defaults
# to the repo root, i.e. the optimized files replace the shipped ones in place.
#
# Steps (each measured in docs/v0.2.0-plan.md):
#   characters  drop unused clips, orphan samplers, resample (1e-3), dedup,
#               prune, textures → WebP ≤ 1024 px  (node, tools/optimize/)
#   voice       mp3 64 kbps mono 44.1 kHz         (ffmpeg)
#   music       mp3 128 kbps                       (ffmpeg)
#   sfx         mp3 96 kbps                        (ffmpeg)
#   holo        jpeg q4, ≤ 1280 px wide            (ffmpeg)
#   logo        webp q90, 1024 px wide             (cwebp)
# Bump GLB_V / HOLO_V / AUDIO_V in lib/player.js and EMBED_V in lib/embed.js
# after a rerun (the busters are what the repo-root harness caches on).
set -euo pipefail
here="$(cd "$(dirname "$0")/.." && pwd)"
src="${1:?usage: tools/optimize.sh <originals-dir> [target-dir]}"
dst="${2:-$here}"
for tool in node ffmpeg cwebp; do command -v "$tool" >/dev/null || { echo "missing $tool" >&2; exit 1; }; done
( cd "$here/tools/optimize" && [ -d node_modules ] || npm install --silent )

echo "== characters"
node "$here/tools/optimize/optimize-glb.mjs" "$src/assets/characters" "$dst/assets/characters"

echo "== voice (64 kbps mono)"
for f in "$src"/assets/audio_v6/*/*.mp3; do
  rel="${f#$src/}"; mkdir -p "$dst/$(dirname "$rel")"
  ffmpeg -v error -y -i "$f" -c:a libmp3lame -b:a 64k -ac 1 -ar 44100 "$dst/$rel"
done
cp "$src/assets/audio_v6/ceremony_audio.json" "$dst/assets/audio_v6/"   # word timings are unchanged by re-encoding

echo "== music (128 kbps) and sfx (96 kbps)"
mkdir -p "$dst/assets/music" "$dst/assets/sfx"
for f in "$src"/assets/music/*.mp3; do ffmpeg -v error -y -i "$f" -c:a libmp3lame -b:a 128k -ar 44100 "$dst/assets/music/$(basename "$f")"; done
for f in "$src"/assets/sfx/*.mp3;   do ffmpeg -v error -y -i "$f" -c:a libmp3lame -b:a 96k  -ar 44100 "$dst/assets/sfx/$(basename "$f")"; done

echo "== holo images (jpeg q4, ≤ 1280 px)"
( cd "$src/assets/holo" && find . -name '*.jpg' ) | while read -r rel; do
  mkdir -p "$dst/assets/holo/$(dirname "$rel")"
  ffmpeg -v error -y -i "$src/assets/holo/$rel" -vf "scale='min(1280,iw)':-2" -q:v 4 "$dst/assets/holo/$rel"
done

echo "== logo (webp q90, 1024 px)"
mkdir -p "$dst/assets/logo"
cwebp -quiet -q 90 -resize 1024 0 "$src/assets/logo/mhs-logo.png" -o "$dst/assets/logo/mhs-logo.webp"

echo "done: $(du -sh "$dst/assets" | cut -f1) in $dst/assets"
