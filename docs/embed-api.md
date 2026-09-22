# Embed API — how a host page runs the ceremony

*v0.1.8, 2026-09-21. Contract version 1 (`MHSCeremony.CONTRACT_VERSION`).*

The ceremony is a static bundle (one version folder: `lib/`, `assets/`, the
content definition, `ceremony.html`, `index.html`). A host page runs it by
loading **one script** from the bundle and calling `MHSCeremony.mount`. The
bundle's own `ceremony.html` is a host page too (the standalone/dev harness);
stratahub's `/missionhydrosci/ceremony` is the production one.

```html
<script src="/missionhydrosci/content/end/v0.1.8/lib/embed.js"></script>
<script>
  MHSCeremony.mount(document.body, {
    scoresUrl: '/missionhydrosci/api/ea-scores',
    returnUrl: '/missionhydrosci/units',
    exitLabel: 'Back to Mission HydroSci',
    onEvent: function (name, detail) { /* steplog / analytics */ },
  });
</script>
```

The page must be a full-viewport page dedicated to the ceremony: the embed
sets `html, body` to full height with no margin, injects fixed-position UI
(lower-third bar, Begin overlay, Exit button) and draws on a canvas that fills
the container. Pass `document.body` or a full-viewport element.

## Options

| Option | Meaning |
|---|---|
| `base` | Folder the bundle's relative paths resolve against (`lib/…`, `assets/…`, `test-profiles/…`). Default: the folder `embed.js` was loaded from. Must end with `/`. |
| `scoresUrl` | URL returning the EA-scores contract (below). Fetched same-origin with credentials; **polled** every `pollMs` while `status` is `"pending"` or the fetch fails, until the show finishes. |
| `scores` | The contract as an object (final; no polling). |
| `profile` | Name of a bundled sample student: fetches `base + 'test-profiles/<name>.json'` (final). |
| `pollMs` | Poll interval for `scoresUrl` (default 5000, minimum 1000). |
| `returnUrl` | Shows the Exit control; clicking it navigates here. |
| `onExit` | Instead of `returnUrl`: a function called when Exit is clicked. |
| `exitLabel` | Text of the Exit control (default "Exit"). |
| `dev` | `true` shows the reviewer's beat selector and the F/R hint (same as `?dev=1`). |
| `definition` | Path of the content definition to load (default `ceremony-definition_v6.js`); for the harness only. |
| `player` | Path of the player to load instead of `lib/player.js` (a frozen `lib/player_vN.js` for side-by-side comparison); for the harness only. |
| `onEvent(name, detail)` | Event callback, see below. |

Exactly one of `scoresUrl`, `scores`, `profile` should be given; with none the
show plays with no scores (every conditional line on its B variant, dark
stars). `mount` returns a handle `{ contractVersion, base, scores, status,
script, stop() }`; `stop()` ends polling.

## The scores contract

```json
{
  "status": "ready",
  "items": { "U2.C2": { "score": 1.0, "max": 1.0 }, "U3.C5": { "score": 2.5, "max": 4 } },
  "stars": { "unit2": 2, "unit3": 3, "unit4": 1, "unit5": 2 }
}
```

- `items`: EA checkpoint scores keyed by checkpoint id. Nine keys drive the
  dialogue (`U2.C2`, `U2.C3`, `U2.C5`, `U2.C7`, `U3.C1`, `U3.C5`, `U4.C6`,
  `U5.C3`, `U5.C4`); extra keys are ignored. A **missing** key means unknown
  and plays the gentler line. Never send a fabricated 0.
- `stars`: 0–3 per unit; a missing unit shows a dark row.
- `status`: `"ready"` stops polling; anything else (or a missing field is
  treated as ready, so send `"pending"` explicitly while grades are
  incomplete). Other fields (`game`, `user_id`, `generatedAt`, `currentUnit`,
  `completedUnits`) are carried but not read.

## Late binding

The show starts as soon as the characters have loaded, with whatever the first
fetch returned. Scores are then **re-read just before they are needed**:

- as each unit's character walks up, that unit's sections are re-resolved
  from the latest scores (earlier and later units are untouched);
- as the ending celebration starts, the star board reads the latest `stars`.

Unit 2's lines begin about half a minute after Begin; Unit 5's and the stars
come several minutes in. So a grade that lands during the show is used. A
score that never arrives leaves that line on its B variant and that unit's
row dark. Nothing waits on grading.

## Events

| Event | When | Detail |
|---|---|---|
| `scores` | every fetch (initial or poll) | `how`, `status`, `items` (count), `stars`, or `error` |
| `mounted` | the player is running (Begin still gated on asset loading) | `status`, `variants`, `source` |
| `started` | Begin clicked (audio unlocked, cold open starts) | `status`, `variants` |
| `unit` | a unit's character walks up (after rebinding) | `unitId`, `index`, `rebound`, `status`, `variants` |
| `celebration` | the ending celebration starts (after rebinding stars) | `index`, `rebound`, `status`, `stars` |
| `finished` | the end screen is reached | `award`, `status`, `variants`, `stars` |
| `failed` | WebGL missing, a bundle file failed to load, or the player failed to boot | `stage`, `message` |
| `exit` | the Exit control was used | `status`, `afterFailure` |

`variants` is `{ sectionId: lineId }`, the resolved variant set (which A/B
line each section played), for logging.

## Hosting requirement: CORS

Every asset the bundle loads — models, textures, the environment map, audio
manifests, and (since v0.1.9) the holo images — is loaded as a CORS request,
so when the host page's origin differs from where the files are ultimately
served (stratahub's content path redirects to the CDN), the CDN must allow
that origin. Without it the models fail to load and, before v0.1.9, the show
froze at the first holo image because the wall canvas was tainted. Pages
served from the CDN itself are same-origin and need nothing.

## Failure behaviour

If WebGL is unavailable or a bundle file cannot load, the embed shows a plain
"could not start on this device" card with the Exit control (when configured)
and emits `failed`. A failed scores fetch never blocks: the show runs with no
scores and keeps polling.

## Versioning

- Bump `EMBED_V` in `lib/embed.js` on any edit to `lib/*.js` or the
  definition; it is the only cache buster for those files (asset files keep
  their own).
- `CONTRACT_VERSION` changes only when this document's options, contract or
  events change incompatibly. A host page can check
  `MHSCeremony.CONTRACT_VERSION` before mounting.
- Babylon.js is vendored and pinned (`lib/vendor/README.md`); no public CDN is
  used at runtime.
