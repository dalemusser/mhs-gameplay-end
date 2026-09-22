/*
 * Resolver unit tests — run with:  node tests/resolver.test.cjs
 * Covers condition evaluation (item/sum, all ops, boundaries), missing-score
 * fallthrough, section skipping, speaker inheritance, and the demo definition.
 *
 * The real-definition block runs against BOTH content versions (content is
 * versioned per designer script — docs/script-v4-plan.md §2):
 *   ceremony-definition.js     script v3 · assets/audio/     · ceremony_v1.html … ceremony_v5.html (frozen)
 *   ceremony-definition_v6.js  script v4 · assets/audio_v6/  · ceremony_v6.html (current)
 * They differ ONLY in 12 line texts, u2.dani's U2.C5 threshold (2 → 4) and,
 * since 2026-09-21, u3.garden's U3.C5 threshold (3 → 2.5); a test pins exactly
 * that, so an accidental edit to the frozen file shows up.
 */
const assert = require('node:assert');
const { resolve, evalCondition, rebindUnit, rebindStars, variants: variantMap } = require('../lib/resolver.js');
require('../ceremony-definition.js');                 // assigns globalThis.CEREMONY_DEFINITION
const REAL_V3 = globalThis.CEREMONY_DEFINITION;
require('../ceremony-definition_v6.js');              // re-assigns it
const REAL_V6 = globalThis.CEREMONY_DEFINITION;
assert.notStrictEqual(REAL_V3, REAL_V6, 'both definitions must load as distinct objects');
const VERSIONS = [
  { tag: 'v3-script', def: REAL_V3, manifest: '../assets/audio/ceremony_audio.json',
    daniBar: 2, gardenBar: 3, partialSuffixes: ['b', 'a', 'a', 'a', 'b', 'b', 'b', 'b'] },
  { tag: 'v4-script', def: REAL_V6, manifest: '../assets/audio_v6/ceremony_audio.json',
    daniBar: 4, gardenBar: 2.5, partialSuffixes: ['b', 'b', 'a', 'a', 'b', 'b', 'b', 'b'] },   // partial's U2.C5 = 3 → below the new bar; its U3.C5 = 1 → B either way
];
const SCRIPT_V4_REWRITES = [
  'u2.find-team.a', 'u2.dani.a', 'u2.dani.b', 'u2.water.a', 'u2.water.b',
  'u3.crates.a', 'u3.crates.b', 'u3.garden.b', 'u4.flood', 'u5.still.a', 'u5.still.b', 'end.award',
];
const ALL_HIGH = require('../test-profiles/all-high.json');
const ALL_LOW = require('../test-profiles/all-low.json');
const MIXED_A = require('../test-profiles/mixed-a.json');
const MIXED_B = require('../test-profiles/mixed-b.json');
const BOUNDARY = require('../test-profiles/boundary.json');
const PARTIAL = require('../test-profiles/partial.json');
const NO_DATA = require('../test-profiles/no-data.json');

const scores = items => ({ items });
const lineIds = r => r.beats.map(b => b.lineId).filter(Boolean);
const variantOf = (r, section) => r.beats.find(b => b.sectionId === section).lineId;
let passed = 0;
function test(name, fn) { fn(); passed++; console.log('  ok — ' + name); }

// A minimal conditional definition mirroring the designer script's shapes:
// a sum condition (U2.C2+U2.C3 ≥ 2), a "sad-first" ordering (Condition A is the
// less-than branch, as in the script's U2.C5 group), and an always section.
const DEF = {
  layout: { mc: 'Toppo', group: ['Jasper'] },
  intro: [],
  units: [
    {
      id: 'unit2', speaker: 'Jasper',
      sections: [
        { id: 'u2.crash', always: { text: 'crash', expression: 'happy' } },
        { id: 'u2.find-team',
          conditions: [
            { when: { sum: ['U2.C2', 'U2.C3'], op: '>=', value: 2 },
              beat: { lineId: 'u2.find-team.a', text: 'found quickly', expression: 'happy' } },
            { otherwise: true,
              beat: { lineId: 'u2.find-team.b', text: 'found', expression: 'slightly-sad' } },
          ] },
        { id: 'u2.dani',
          conditions: [
            { when: { item: 'U2.C5', op: '<', value: 2 },
              beat: { lineId: 'u2.dani.a', text: 'worked hard', expression: 'slightly-sad' } },
            { otherwise: true,
              beat: { lineId: 'u2.dani.b', text: 'restored fast', expression: 'happy' } },
          ] },
        { id: 'u2.no-otherwise',
          conditions: [
            { when: { item: 'U2.C7', op: '>=', value: 2 },
              beat: { lineId: 'u2.opt', text: 'optional beat' } },
          ] },
      ],
    },
  ],
  celebration: null,
  finale: [],
};

console.log('resolver tests:');

const CONDITIONALS = ['u2.find-team', 'u2.dani', 'u2.water', 'u3.crates', 'u3.garden', 'u4.soil', 'u5.plant', 'u5.still'];
const variants = (r) => CONDITIONALS.map(s => variantOf(r, s));
const suffixes = (r) => variants(r).map(id => id.slice(-1));

for (const V of VERSIONS) {
  const REAL = V.def;

  test(V.tag + ': real definition resolves to 20 beats with the right speaker order', () => {
    const r = resolve(REAL, scores({}));
    assert.strictEqual(r.beats.length, 20);
    assert.deepStrictEqual(r.beats.map(b => b.speaker), [
      'Toppo',                                              // intro (u1.intro)
      'Jasper', 'Jasper', 'Jasper', 'Jasper', 'Jasper',     // unit 2
      'Tera', 'Tera', 'Tera', 'Tera',                       // unit 3
      'Anderson', 'Anderson', 'Anderson', 'Anderson',       // unit 4
      'Aryn', 'Aryn', 'Aryn',                               // unit 5
      'Toppo', 'Toppo',                                     // conclusion
      undefined,                                            // ending celebration (last)
    ]);
    assert.strictEqual(r.beats[0].startAtMark, true);       // Toppo opens already at the mark
    assert.strictEqual(r.beats[0].lineId, 'u1.intro');
    const celeb = r.beats[19];
    assert.strictEqual(celeb.type, 'celebration');
    assert.strictEqual(celeb.ending, 'fade');
    assert.ok(celeb.holo.title.includes('WATER STEWARD'));
    const skills = r.beats.find(b => b.sectionId === 'end.skills');
    assert.strictEqual(skills.holo.highlights.length, 5);   // the progressive highlight list
    assert.strictEqual(r.layout.mc, 'Toppo');
  });

  test(V.tag + ': all-high profile picks every A variant (A = best-case, standardized)', () => {
    const r = resolve(REAL, ALL_HIGH);
    for (const s of ['u2.find-team', 'u2.dani', 'u2.water', 'u3.crates', 'u3.garden', 'u4.soil', 'u5.plant', 'u5.still'])
      assert.strictEqual(variantOf(r, s), s + '.a');
  });

  test(V.tag + ': all-low profile picks every B variant, all neutral', () => {
    const r = resolve(REAL, ALL_LOW);
    for (const s of ['u2.find-team', 'u2.dani', 'u2.water', 'u3.crates', 'u3.garden', 'u4.soil', 'u5.plant', 'u5.still']) {
      const beat = r.beats.find(b => b.sectionId === s);
      assert.strictEqual(beat.lineId, s + '.b');
      assert.strictEqual(beat.expression, 'neutral');
    }
  });

  test(V.tag + ': empty scores resolve identically to all-low (missing → modest variant)', () => {
    assert.deepStrictEqual(lineIds(resolve(REAL, scores({}))), lineIds(resolve(REAL, ALL_LOW)));
  });

  test(V.tag + ': u3.crates variants carry their own image sets', () => {
    const hi = resolve(REAL, ALL_HIGH).beats.find(b => b.sectionId === 'u3.crates');
    const lo = resolve(REAL, ALL_LOW).beats.find(b => b.sectionId === 'u3.crates');
    assert.ok(hi.holo.images[0].includes('Correct'));
    assert.ok(lo.holo.images[0].includes('Incorrect'));
  });

  test(V.tag + ': mixed-a alternates a,b,a,b… across all eight sections', () => {
    assert.deepStrictEqual(suffixes(resolve(REAL, MIXED_A)), ['a', 'b', 'a', 'b', 'a', 'b', 'a', 'b']);
  });

  test(V.tag + ': mixed-b is the inverse alternation of mixed-a', () => {
    assert.deepStrictEqual(suffixes(resolve(REAL, MIXED_B)), ['b', 'a', 'b', 'a', 'b', 'a', 'b', 'a']);
  });

  test(V.tag + ': boundary (every score at the CURRENT thresholds; U2.C5=4, U5.C3=1 for its ">0") plays ALL A variants', () => {
    assert.deepStrictEqual(variants(resolve(REAL, BOUNDARY)), variants(resolve(REAL, ALL_HIGH)));
  });

  test(V.tag + ': partial (no Unit 4/5 items) falls back to B for soil, plant, and still', () => {
    assert.deepStrictEqual(suffixes(resolve(REAL, PARTIAL)), V.partialSuffixes);
  });

  test(V.tag + ': no-data profile matches empty scores (all fallback variants)', () => {
    assert.deepStrictEqual(variants(resolve(REAL, NO_DATA)), variants(resolve(REAL, scores({}))));
  });

  test(V.tag + ': every spoken line — including unplayed variants — has a clip in the audio manifest', () => {
    const manifest = require(V.manifest);
    const byId = new Map(manifest.items.map(i => [i.id, i]));
    const missing = [];
    const check = b => { if (b && b.text && !byId.has(b.lineId)) missing.push(b.lineId || b.text.slice(0, 30)); };
    (REAL.intro || []).forEach(check);
    (REAL.units || []).forEach(u => (u.sections || []).forEach(s => {
      if (s.always) check(s.always);
      (s.conditions || []).forEach(v => check(v.beat));
    }));
    (REAL.finale || []).forEach(check);
    assert.deepStrictEqual(missing, []);
    assert.ok(manifest.items.every(i => i.durationSec > 0 && i.words.length > 0),
      'every manifest item needs a duration and word timings');
  });

  test(V.tag + ': stars pass through onto the ending beat for the pop-up', () => {
    assert.deepStrictEqual(resolve(REAL, ALL_HIGH).beats[19].stars,
      { unit2: 3, unit3: 3, unit4: 3, unit5: 3 });
    assert.deepStrictEqual(resolve(REAL, PARTIAL).beats[19].stars,
      { unit2: 2, unit3: 2 });                                  // unplayed units absent → empty stars
    assert.deepStrictEqual(resolve(REAL, NO_DATA).beats[19].stars, {});
  });

  test(V.tag + ': every resolved beat with text carries a lineId (audio join key)', () => {
    for (const profile of [ALL_HIGH, ALL_LOW]) {
      const r = resolve(REAL, profile);
      assert.ok(r.beats.filter(b => b.text).every(b => b.lineId));
    }
  });

  test(V.tag + ': u2.dani bar is U2.C5 ≥ ' + V.daniBar + ' (3 points flips between versions)', () => {
    const dani = n => variantOf(resolve(REAL, scores({ 'U2.C5': { score: n, max: 6 } })), 'u2.dani');
    assert.strictEqual(dani(V.daniBar), 'u2.dani.a');
    assert.strictEqual(dani(V.daniBar - 0.01), 'u2.dani.b');
    assert.strictEqual(dani(3), V.daniBar === 4 ? 'u2.dani.b' : 'u2.dani.a');
    assert.strictEqual(dani(6), 'u2.dani.a');
  });
}

for (const V of VERSIONS) {
  test(V.tag + ': u3.garden bar is U3.C5 ≥ ' + V.gardenBar + ' (three correct plots + one wrong = 2.5)', () => {
    const garden = n => variantOf(resolve(V.def, scores({ 'U3.C5': { score: n, max: 4 } })), 'u3.garden');
    assert.strictEqual(garden(V.gardenBar), 'u3.garden.a');
    assert.strictEqual(garden(V.gardenBar - 0.01), 'u3.garden.b');
    assert.strictEqual(garden(2.5), V.gardenBar === 2.5 ? 'u3.garden.a' : 'u3.garden.b');
    assert.strictEqual(garden(4), 'u3.garden.a');
  });
}

test('v6 definition differs from the frozen v3-script one ONLY in the 12 rewrites + the DANI and garden bars', () => {
  const texts = def => { const m = {}; const add = b => { if (b && b.lineId) m[b.lineId] = b.text; };
    (def.intro || []).forEach(add);
    def.units.forEach(u => u.sections.forEach(s => { if (s.always) add(s.always); (s.conditions || []).forEach(v => add(v.beat)); }));
    return m; };
  const a = texts(REAL_V3), b = texts(REAL_V6);
  assert.deepStrictEqual(Object.keys(a), Object.keys(b));                       // same lineIds, same order
  const changed = Object.keys(a).filter(id => a[id] !== b[id]);
  assert.deepStrictEqual(changed, SCRIPT_V4_REWRITES);
  assert.ok(b['u2.dani.b'].includes('to identify'), 'script typo "toidentify" must be fixed in the definition');
  assert.ok(!b['u2.dani.b'].includes('toidentify'));
  // structure apart from text: holo images, expressions, highlights, celebration identical
  const strip = def => JSON.parse(JSON.stringify(def, (k, v) => (k === 'text' ? undefined : v)));
  const sa = strip(REAL_V3), sb = strip(REAL_V6);
  sa.units[0].sections[2].conditions[0].when.value = 4;                        // the two allowed structural deltas
  sa.units[1].sections[2].conditions[0].when.value = 2.5;
  assert.deepStrictEqual(sa, sb);
});

test('sum condition ≥ threshold picks the A variant', () => {
  const r = resolve(DEF, scores({ 'U2.C2': { score: 1 }, 'U2.C3': { score: 1.5 } }));
  assert.strictEqual(r.beats.find(b => b.sectionId === 'u2.find-team').lineId, 'u2.find-team.a');
});

test('sum exactly at the boundary (2.0) matches >=', () => {
  const r = resolve(DEF, scores({ 'U2.C2': { score: 0.5 }, 'U2.C3': { score: 1.5 } }));
  assert.strictEqual(r.beats.find(b => b.sectionId === 'u2.find-team').lineId, 'u2.find-team.a');
});

test('sum below the threshold falls to otherwise', () => {
  const r = resolve(DEF, scores({ 'U2.C2': { score: 1 }, 'U2.C3': { score: 0.5 } }));
  assert.strictEqual(r.beats.find(b => b.sectionId === 'u2.find-team').lineId, 'u2.find-team.b');
});

test('one summed item missing → condition false → otherwise', () => {
  const r = resolve(DEF, scores({ 'U2.C2': { score: 1 } }));   // U2.C3 absent
  assert.strictEqual(r.beats.find(b => b.sectionId === 'u2.find-team').lineId, 'u2.find-team.b');
});

test('less-than condition matches when the score is low (sad-first ordering)', () => {
  const r = resolve(DEF, scores({ 'U2.C5': { score: 1.7 } }));
  assert.strictEqual(r.beats.find(b => b.sectionId === 'u2.dani').lineId, 'u2.dani.a');
});

test('less-than condition with a MISSING item is false (missing ≠ zero) → otherwise', () => {
  const r = resolve(DEF, scores({}));
  assert.strictEqual(r.beats.find(b => b.sectionId === 'u2.dani').lineId, 'u2.dani.b');
});

test('section with no match and no otherwise emits no beat', () => {
  const r = resolve(DEF, scores({}));
  assert.strictEqual(r.beats.find(b => b.sectionId === 'u2.no-otherwise'), undefined);
  const r2 = resolve(DEF, scores({ 'U2.C7': { score: 3 } }));
  assert.strictEqual(r2.beats.find(b => b.sectionId === 'u2.no-otherwise').lineId, 'u2.opt');
});

test('unit beats inherit the unit speaker; always sections included for everyone', () => {
  const r = resolve(DEF, scores({}));
  const crash = r.beats.find(b => b.sectionId === 'u2.crash');
  assert.strictEqual(crash.speaker, 'Jasper');
  assert.strictEqual(crash.unitId, 'unit2');
});

test('empty scores object and missing eaScores are equivalent', () => {
  const a = resolve(DEF, scores({}));
  const b = resolve(DEF, undefined);
  assert.deepStrictEqual(a.beats.map(x => x.lineId), b.beats.map(x => x.lineId));
});

test('evalCondition ops behave (>, <=, ==)', () => {
  const items = { X: { score: 2 } };
  assert.strictEqual(evalCondition({ item: 'X', op: '>', value: 2 }, items), false);
  assert.strictEqual(evalCondition({ item: 'X', op: '<=', value: 2 }, items), true);
  assert.strictEqual(evalCondition({ item: 'X', op: '==', value: 2 }, items), true);
});

test('malformed condition throws (authoring error, not silent skip)', () => {
  assert.throws(() => evalCondition({ item: 'X', op: '!=', value: 1 }, {}));
});

// ---- late binding (v0.1.8): scores arriving while the show runs ----
test('rebindUnit re-resolves only that unit, in place, keeping the beat count and positions', () => {
  const r = resolve(REAL_V6, scores({}));                       // no scores yet: every B
  const before = r.beats.map(b => b.lineId);
  const idx3 = r.beats.findIndex(b => b.unitId === 'unit3');
  assert.strictEqual(rebindUnit(r, REAL_V6, 'unit3', ALL_HIGH), true);
  assert.strictEqual(r.beats.length, 20);
  assert.strictEqual(r.beats.findIndex(b => b.unitId === 'unit3'), idx3);
  assert.strictEqual(variantOf(r, 'u3.crates'), 'u3.crates.a');
  assert.strictEqual(variantOf(r, 'u3.garden'), 'u3.garden.a');
  assert.strictEqual(variantOf(r, 'u2.find-team'), 'u2.find-team.b');   // unit 2 untouched
  assert.strictEqual(variantOf(r, 'u4.soil'), 'u4.soil.b');             // unit 4 untouched
  r.beats.forEach((b, i) => { if (b.unitId !== 'unit3') assert.strictEqual(b.lineId, before[i]); });
  assert.strictEqual(r.beats.find(b => b.sectionId === 'u3.crates').speaker, 'Tera');
});

test('rebindUnit is a no-op (false) when the scores change nothing; unknown unit → false', () => {
  const r = resolve(REAL_V6, ALL_HIGH);
  assert.strictEqual(rebindUnit(r, REAL_V6, 'unit3', ALL_HIGH), false);
  assert.strictEqual(rebindUnit(r, REAL_V6, 'unit9', ALL_HIGH), false);
  assert.strictEqual(rebindUnit(r, REAL_V6, 'unit3', scores({})), true);   // scores can also go away → B
  assert.strictEqual(variantOf(r, 'u3.crates'), 'u3.crates.b');
});

test('rebindStars refreshes the ending beat and reports whether anything changed', () => {
  const r = resolve(REAL_V6, scores({}));
  assert.deepStrictEqual(r.beats[19].stars, {});
  assert.strictEqual(rebindStars(r, PARTIAL), true);
  assert.deepStrictEqual(r.beats[19].stars, { unit2: 2, unit3: 2 });
  assert.strictEqual(rebindStars(r, PARTIAL), false);
  assert.strictEqual(rebindStars(r, ALL_HIGH), true);
  assert.deepStrictEqual(r.beats[19].stars, { unit2: 3, unit3: 3, unit4: 3, unit5: 3 });
  assert.strictEqual(rebindStars(r, { items: {}, stars: { unit2: 'x' } }), true);   // non-numbers are dropped
  assert.deepStrictEqual(r.beats[19].stars, {});
});

test('a full late-binding pass (rebind every unit + stars) equals a fresh resolve', () => {
  const r = resolve(REAL_V6, scores({}));
  for (const u of REAL_V6.units) rebindUnit(r, REAL_V6, u.id, MIXED_A);
  rebindStars(r, MIXED_A);
  const fresh = resolve(REAL_V6, MIXED_A);
  assert.deepStrictEqual(r.beats.map(b => b.lineId), fresh.beats.map(b => b.lineId));
  assert.deepStrictEqual(r.beats[19].stars, fresh.beats[19].stars);
  assert.deepStrictEqual(variantMap(r), variantMap(fresh));
  assert.strictEqual(Object.keys(variantMap(r)).length, 18);          // every text beat inside a unit (5+4+4+3+2)
});

console.log('all ' + passed + ' resolver tests passed');
