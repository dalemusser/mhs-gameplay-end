#!/usr/bin/env bash
# Stage a release bundle: dist/v<version>/ = the CURRENT show only.
#
#   tools/stage-dist.sh 0.1.8
#
# Copies the repo root minus everything that is not part of the shipped show:
# working docs, tools, tests, the designers' content, the frozen comparison
# archive (ceremony_v*.html, lib/player_v*.js, the script-v3 definition and
# clips), audio sidecars, music/sfx candidates. The result is what
# `aws s3 sync dist/v<version>/ s3://<bucket>/mhs/end/v<version>/` uploads
# (see docs/script-v4-plan.md §7 for the sweep). Version folders on the CDN are
# immutable: never re-stage into a version that has been uploaded — bump.
set -euo pipefail
cd "$(dirname "$0")/.."
ver="${1:?usage: tools/stage-dist.sh <version, e.g. 0.1.8>}"
dest="dist/v${ver}"
if [ -e "$dest" ]; then echo "refusing: $dest exists (version folders are immutable; bump the version)" >&2; exit 1; fi
mkdir -p "$dest"
rsync -a \
  --exclude '.git' --exclude '.gitignore' --exclude '.DS_Store' --exclude '.playwright-cli' \
  --exclude 'dist' --exclude 'designer-content' --exclude 'docs' --exclude 'tools' --exclude 'tests' --exclude 'ai' \
  --exclude 'README.md' --exclude 'LICENSE' --exclude 'end-experience-goals.md' \
  --exclude '*.words.json' --exclude '.mhsaudio-manifest.json' \
  --exclude 'assets/music/candidates' --exclude 'assets/sfx/candidates' \
  --exclude 'assets/audio' \
  --exclude 'ceremony_v*.html' --exclude 'lib/player_v*.js' --exclude 'ceremony-definition.js' \
  --exclude 'ceremony-script.js' --exclude 'audition.html' \
  ./ "$dest/"
# listing next to the folder (not inside it) for the post-upload sweep
( cd "$dest" && find . -type f | sed 's|^\./||' | sort ) > "dist/v${ver}.files.txt"
echo "staged $dest: $(wc -l < "dist/v${ver}.files.txt" | tr -d ' ') files, $(du -sh "$dest" | cut -f1)"
echo "listing: dist/v${ver}.files.txt"
