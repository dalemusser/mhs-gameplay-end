/*
 * Resolver unit tests — run with:  node tests/resolver.test.cjs
 * Covers condition evaluation (item/sum, all ops, boundaries), missing-score
 * fallthrough, section skipping, speaker inheritance, and the demo definition.
 */
const assert = require('node:assert');
const { resolve, evalCondition } = require('../lib/resolver.js');
require('../ceremony-definition.js');                 // assigns globalThis.CEREMONY_DEFINITION
const REAL = globalThis.CEREMONY_DEFINITION;
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

test('real definition resolves to 17 beats with the right speaker order', () => {
  const r = resolve(REAL, scores({}));
  assert.strictEqual(r.beats.length, 17);
  assert.deepStrictEqual(r.beats.map(b => b.speaker), [
    'Toppo',                                              // intro (placeholder)
    'Jasper', 'Jasper', 'Jasper', 'Jasper', 'Jasper',     // unit 2
    'Tera', 'Tera', 'Tera', 'Tera',                       // unit 3
    'Anderson', 'Anderson', 'Anderson', 'Anderson',       // unit 4
    'Aryn',                                               // unit 5 (placeholder)
    undefined,                                            // celebration
    'Toppo',                                              // finale (placeholder)
  ]);
  assert.strictEqual(r.beats[15].type, 'celebration');
  assert.strictEqual(r.layout.mc, 'Toppo');
});

test('all-high profile picks every high-score variant (designer A/B labels)', () => {
  const r = resolve(REAL, ALL_HIGH);
  assert.strictEqual(variantOf(r, 'u2.find-team'), 'u2.find-team.a');
  assert.strictEqual(variantOf(r, 'u2.dani'), 'u2.dani.b');      // script's B is the happy line here
  assert.strictEqual(variantOf(r, 'u2.water'), 'u2.water.b');    // ditto
  assert.strictEqual(variantOf(r, 'u3.crates'), 'u3.crates.a');
  assert.strictEqual(variantOf(r, 'u3.garden'), 'u3.garden.a');
  assert.strictEqual(variantOf(r, 'u4.soil'), 'u4.soil.a');
});

test('all-low profile picks every modest variant', () => {
  const r = resolve(REAL, ALL_LOW);
  assert.strictEqual(variantOf(r, 'u2.find-team'), 'u2.find-team.b');
  assert.strictEqual(variantOf(r, 'u2.dani'), 'u2.dani.a');
  assert.strictEqual(variantOf(r, 'u2.water'), 'u2.water.a');
  assert.strictEqual(variantOf(r, 'u3.crates'), 'u3.crates.b');
  assert.strictEqual(variantOf(r, 'u3.garden'), 'u3.garden.b');
  assert.strictEqual(variantOf(r, 'u4.soil'), 'u4.soil.b');
});

test('empty scores resolve identically to all-low (missing → modest variant)', () => {
  assert.deepStrictEqual(lineIds(resolve(REAL, scores({}))), lineIds(resolve(REAL, ALL_LOW)));
});

test('u3.crates variants carry their own image sets', () => {
  const hi = resolve(REAL, ALL_HIGH).beats.find(b => b.sectionId === 'u3.crates');
  const lo = resolve(REAL, ALL_LOW).beats.find(b => b.sectionId === 'u3.crates');
  assert.ok(hi.holo.images[0].includes('Correct'));
  assert.ok(lo.holo.images[0].includes('Incorrect'));
});

const CONDITIONALS = ['u2.find-team', 'u2.dani', 'u2.water', 'u3.crates', 'u3.garden', 'u4.soil'];
const variants = (r) => CONDITIONALS.map(s => variantOf(r, s));

test('mixed-a alternates: high, low, high, low, high, low', () => {
  assert.deepStrictEqual(variants(resolve(REAL, MIXED_A)),
    ['u2.find-team.a', 'u2.dani.a', 'u2.water.b', 'u3.crates.b', 'u3.garden.a', 'u4.soil.b']);
});

test('mixed-b is the inverse alternation of mixed-a', () => {
  assert.deepStrictEqual(variants(resolve(REAL, MIXED_B)),
    ['u2.find-team.b', 'u2.dani.b', 'u2.water.a', 'u3.crates.a', 'u3.garden.b', 'u4.soil.a']);
});

test('boundary (every score exactly at threshold) plays ALL happy variants', () => {
  assert.deepStrictEqual(variants(resolve(REAL, BOUNDARY)), variants(resolve(REAL, ALL_HIGH)));
});

test('partial (no Unit 4 items) falls back to the gentle soil variant', () => {
  assert.deepStrictEqual(variants(resolve(REAL, PARTIAL)),
    ['u2.find-team.b', 'u2.dani.b', 'u2.water.b', 'u3.crates.a', 'u3.garden.b', 'u4.soil.b']);
});

test('no-data profile matches empty scores (all fallback variants)', () => {
  assert.deepStrictEqual(variants(resolve(REAL, NO_DATA)), variants(resolve(REAL, scores({}))));
});

test('every spoken line — including unplayed variants — has a clip in the audio manifest', () => {
  const manifest = require('../assets/audio/ceremony_audio.json');
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

test('every resolved beat with text carries a lineId (audio join key)', () => {
  for (const profile of [ALL_HIGH, ALL_LOW]) {
    const r = resolve(REAL, profile);
    assert.ok(r.beats.filter(b => b.text).every(b => b.lineId));
  }
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

console.log('all ' + passed + ' resolver tests passed');
