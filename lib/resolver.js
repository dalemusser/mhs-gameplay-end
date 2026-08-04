/*
 * MHSCeremonyResolver — resolves a ceremony DEFINITION (units → sections → conditional
 * variants) plus a student's EA scores into the linear script the player performs:
 * { layout, beats[] }.
 *
 * Pure data-in/data-out: no DOM, no Babylon. Loads in the browser (as
 * window.MHSCeremonyResolver) and in Node (module.exports) so the condition logic is
 * unit-testable — see tests/resolver.test.cjs.
 *
 * Definition schema (docs/implementation-plan.md §2.2):
 *   {
 *     layout:      { mc, group[] },
 *     intro:       [beat, …],
 *     units:       [{ id, speaker, sections: [section, …] }, …],
 *     celebration: beat | null,        // performed with type 'celebration'
 *     finale:      [beat, …],
 *   }
 *
 *   section: { id, always: beat }
 *          | { id, conditions: [ { when: cond, beat }, …, { otherwise: true, beat } ] }
 *
 *   cond:    { item: 'U2.C5',            op: '>=', value: 2 }   // one checkpoint
 *          | { sum: ['U2.C2', 'U2.C3'],  op: '>=', value: 2 }   // summed checkpoints
 *
 * eaScores follows the §2.1 contract: { items: { 'U2.C2': { score, max }, … } }.
 * A fixture profile and the production endpoint produce the same shape.
 *
 * Semantics:
 *   - conditions evaluate in order; the first match wins.
 *   - a condition referencing a checkpoint ABSENT from eaScores.items is false —
 *     missing means unknown, not zero — so resolution falls through to `otherwise`.
 *     Author the gentler variant as the `otherwise` entry (provisional answer to
 *     designer question 3: missing scores play the Condition-B line).
 *   - a section with no matching condition and no `otherwise` emits no beat.
 *   - unit beats inherit the unit's `speaker`; a beat's own `speaker` wins if set.
 *   - each beat carries `sectionId` (and `unitId` inside units) for debugging and
 *     for the line-ID → audio join (Phase 3).
 */
(function (global) {
  'use strict';

  var OPS = {
    '>=': function (a, b) { return a >= b; },
    '>':  function (a, b) { return a > b; },
    '<=': function (a, b) { return a <= b; },
    '<':  function (a, b) { return a < b; },
    '==': function (a, b) { return a === b; },
  };

  // Evaluate one condition against the score items. Any referenced checkpoint that is
  // missing (or has a non-numeric score) makes the whole condition false.
  function evalCondition(when, items) {
    if (!when || !OPS[when.op]) throw new Error('resolver: bad condition ' + JSON.stringify(when));
    var ids = when.sum || [when.item];
    var total = 0;
    for (var i = 0; i < ids.length; i++) {
      var it = items[ids[i]];
      if (!it || typeof it.score !== 'number') return false;
      total += it.score;
    }
    return OPS[when.op](total, when.value);
  }

  // Pick a section's beat for this student, or null if nothing applies.
  function resolveSection(section, items) {
    if (section.always) return section.always;
    var variants = section.conditions || [];
    var otherwise = null;
    for (var i = 0; i < variants.length; i++) {
      var v = variants[i];
      if (v.otherwise) { otherwise = v; continue; }
      if (evalCondition(v.when, items)) return v.beat;
    }
    return otherwise ? otherwise.beat : null;
  }

  function resolve(definition, eaScores) {
    var items = (eaScores && eaScores.items) || {};
    var beats = [];

    (definition.intro || []).forEach(function (b) { beats.push(b); });

    (definition.units || []).forEach(function (unit) {
      (unit.sections || []).forEach(function (section) {
        var beat = resolveSection(section, items);
        if (!beat) return;
        beats.push(Object.assign(
          { speaker: unit.speaker, unitId: unit.id, sectionId: section.id }, beat));
      });
    });

    if (definition.celebration) {
      beats.push(Object.assign({ type: 'celebration' }, definition.celebration));
    }

    (definition.finale || []).forEach(function (b) { beats.push(b); });

    return { layout: definition.layout, beats: beats };
  }

  var api = { resolve: resolve, evalCondition: evalCondition };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.MHSCeremonyResolver = api;
})(typeof window !== 'undefined' ? window : globalThis);
