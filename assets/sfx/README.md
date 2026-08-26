# Ceremony SFX

Generated 2026-08-04 with the ElevenLabs sound-generation API
(`POST /v1/sound-generation`, key from `~/.elevenlabs_key`), auditioned and
chosen by Dale from two candidates each. This folder is hand-managed — it is
deliberately OUTSIDE `assets/audio/`, which the mhsaudio tool owns (and prunes).

| File | Prompt | Duration |
|---|---|---|
| `applause-small-group.mp3` | "A small group of five people clapping and cheering enthusiastically in a room, warm applause with a few excited whoops, close and intimate, no music" | 10s |
| `fanfare-award.mp3` | "Short heroic achievement sting, futuristic synth fanfare with shimmering bells and a warm bass hit, celebratory award moment" | 5s |
| `trophy-zing.mp3` | (2026-08-20) = `candidates/zing-2.mp3`, Dale's pick of three candidates: "Video game reward sound: fast shimmering whoosh rising into a bright bell ding with a solid metallic clunk at the end, trophy snapping into place, triumphant, short". Plays as the trophy icon lands in the wall results board's badge slot (TROPHY_AT). | 2s |

`candidates/` holds un-auditioned generations — EXCLUDE it when staging a
`dist/vX.Y.Z` bundle (like `assets/music/candidates/`).

Wiring (lib/player.js): the fanfare plays via the `MUSIC.sting` hook as the
award card materializes; the applause loops at volume 0.6 through the ending
celebration and fades out in step with the fade-to-black (2.4s). The `MUSIC.bed`
hook remains open for an optional Suno ambient track under the whole show.
