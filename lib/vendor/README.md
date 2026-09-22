# Vendored third-party runtime

Pinned copies of the Babylon.js runtime the ceremony renders with. They are
served from the bundle's own version folder on the CDN (same origin as the
host page through `/missionhydrosci/content/end/vX.Y.Z/`), never from a
public CDN, so a Babylon release can no longer change a shipped ceremony and
the show works offline once cached.

| File | Source | Version |
|---|---|---|
| `babylon.js` | https://cdn.babylonjs.com/babylon.js (fetched 2026-09-21) | 9.27.1 |
| `babylonjs.loaders.min.js` | https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js (same fetch) | 9.27.1 |

`assets/env/environment.env` and `assets/env/flare.png` are the two textures
the player previously fetched from playground.babylonjs.com (the default
environment map and the particle sprite), copied the same day.

To upgrade: download the new pair from a versioned URL
(`https://cdn.babylonjs.com/v<version>/babylon.js`), replace both files
together, update this table, bump `EMBED_V` in `lib/embed.js`, and run the
fixture sweep before staging.
