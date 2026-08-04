/*
 * export-lines.cjs — export every spoken line in the ceremony DEFINITION (all
 * condition variants, both A and B) as an mhsaudio "simple script":
 *
 *     lineId | Speaker: text
 *
 * Usage:  node tools/export-lines.cjs > tools/ceremony-lines.txt
 *
 * Then generate voice + word timings + the player manifest with the mhsaudio CLI
 * (built from the mhsaudiotools repo; API key in ~/.elevenlabs_key):
 *
 *     mhsaudio generate -in tools/ceremony-lines.txt -voices tools/voices.json \
 *         -layout babylon-manifest -timestamps -no-cleanup -out assets/audio
 *
 * -no-cleanup matters: the ceremony lines are clean prose (no game markup), and
 * cleanup would strip em-dashes / split hyphenated words from the SPOKEN text,
 * desyncing the karaoke word counts from the displayed text (verified: with
 * cleanup on, 3 of 22 lines drifted by 1–2 tokens; with it off, all 22 match).
 *
 * mhsaudio's own resume manifest makes re-runs incremental: after editing a line
 * in ceremony-definition.js, re-export and re-run — only changed lines are
 * regenerated and re-billed. The emitted assets/audio/ceremony_audio.json items
 * carry a textHash for staleness checks.
 *
 * The resolver only *plays* one variant per section, so this walks the raw
 * definition instead — every beat with text must have a lineId and a speaker
 * (the unit's speaker for unit sections). Throws on a missing lineId so a new
 * unvoiced line can't slip through silently.
 */
require('../ceremony-definition.js');
const def = globalThis.CEREMONY_DEFINITION;

const lines = [];
function add(beat, speaker) {
  if (!beat || !beat.text) return;
  if (!beat.lineId) throw new Error('beat with text but no lineId: "' + beat.text.slice(0, 40) + '…"');
  const who = beat.speaker || speaker;
  if (!who) throw new Error('beat ' + beat.lineId + ' has no speaker');
  if (/[\r\n]/.test(beat.text)) throw new Error('beat ' + beat.lineId + ' has a newline in its text');
  lines.push(beat.lineId + ' | ' + who + ': ' + beat.text);
}

(def.intro || []).forEach(b => add(b, null));
(def.units || []).forEach(unit =>
  (unit.sections || []).forEach(section => {
    if (section.always) add(section.always, unit.speaker);
    (section.conditions || []).forEach(v => add(v.beat, unit.speaker));
  }));
if (def.celebration) add(def.celebration, null);          // no text today; future-proof
(def.finale || []).forEach(b => add(b, null));

const ids = lines.map(l => l.split(' ')[0]);
const dup = ids.find((id, i) => ids.indexOf(id) !== i);
if (dup) throw new Error('duplicate lineId: ' + dup);

process.stdout.write(lines.join('\n') + '\n');
process.stderr.write('exported ' + lines.length + ' lines\n');
