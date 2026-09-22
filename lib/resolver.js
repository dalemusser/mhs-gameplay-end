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
 * eaScores follows the §2.1 contract: { items: { 'U2.C2': { score, max }, … },
 * stars: { unit2: 0–3, … } }. Stars are computed UPSTREAM (unit totals span all
 * of a unit's checkpoints, not just the ones the ceremony conditions on) and are
 * passed through onto the ending celebration beat for the star pop-up.
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
 *
 * LATE BINDING (v0.1.8, docs/embed-api.md): the show starts before the last
 * grades may exist, so the embed re-reads the scores while the ceremony plays.
 *   - rebindUnit(script, definition, unitId, eaScores) re-resolves ONE unit's
 *     sections in place (called as that unit's character walks up);
 *   - rebindStars(script, eaScores) refreshes the ending beat's stars (called
 *     as the ending celebration starts);
 *   - variants(script) reports the chosen lineId per section (for logging).
 * resolve() itself is unchanged, so fixtures and tests keep their meaning.
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

  function itemsOf(eaScores) { return (eaScores && eaScores.items) || {}; }
  function starsOf(eaScores) {
    var src = (eaScores && eaScores.stars) || {}, out = {};
    Object.keys(src).forEach(function (k) { if (typeof src[k] === 'number') out[k] = src[k]; });
    return out;
  }

  // One unit's beats for these scores (speaker/unitId/sectionId stamped on).
  function unitBeats(unit, items) {
    var out = [];
    (unit.sections || []).forEach(function (section) {
      var beat = resolveSection(section, items);
      if (!beat) return;
      out.push(Object.assign({ speaker: unit.speaker, unitId: unit.id, sectionId: section.id }, beat));
    });
    return out;
  }

  function resolve(definition, eaScores) {
    var items = itemsOf(eaScores);
    var beats = [];

    (definition.intro || []).forEach(function (b) { beats.push(b); });

    (definition.units || []).forEach(function (unit) {
      unitBeats(unit, items).forEach(function (b) { beats.push(b); });
    });

    if (definition.celebration) {
      beats.push(Object.assign({ type: 'celebration' }, definition.celebration,
        { stars: starsOf(eaScores) }));
    }

    (definition.finale || []).forEach(function (b) { beats.push(b); });

    return { layout: definition.layout, beats: beats };
  }

  // Re-resolve one unit's beats IN PLACE with fresher scores. Returns true when a
  // beat changed (a different lineId, or a different number of beats). Beats
  // before and after the unit are untouched, so the player's index into the
  // array stays valid: the unit's first beat keeps its position.
  function rebindUnit(script, definition, unitId, eaScores) {
    var unit = null;
    (definition.units || []).forEach(function (u) { if (u.id === unitId) unit = u; });
    if (!unit) return false;
    var beats = script.beats, first = -1, last = -1;
    for (var i = 0; i < beats.length; i++) {
      if (beats[i].unitId === unitId) { if (first < 0) first = i; last = i; }
    }
    if (first < 0) return false;
    var fresh = unitBeats(unit, itemsOf(eaScores));
    var same = fresh.length === last - first + 1;
    for (var k = 0; same && k < fresh.length; k++) if (fresh[k].lineId !== beats[first + k].lineId) same = false;
    if (same) return false;
    Array.prototype.splice.apply(beats, [first, last - first + 1].concat(fresh));
    return true;
  }

  // Refresh the ending celebration's star board. Returns true when a value changed.
  function rebindStars(script, eaScores) {
    var beat = null;
    script.beats.forEach(function (b) { if (b.type === 'celebration' && b.ending) beat = b; });
    if (!beat) return false;
    var fresh = starsOf(eaScores), cur = beat.stars || {};
    var keys = Object.keys(fresh).concat(Object.keys(cur)), changed = false;
    keys.forEach(function (k) { if (fresh[k] !== cur[k]) changed = true; });
    if (changed) beat.stars = fresh;
    return changed;
  }

  // { sectionId: lineId } for every beat that carries both — the resolved
  // variant set, for the host page's logging.
  function variants(script) {
    var out = {};
    (script.beats || []).forEach(function (b) { if (b.sectionId && b.lineId) out[b.sectionId] = b.lineId; });
    return out;
  }

  var api = { resolve: resolve, evalCondition: evalCondition,
    rebindUnit: rebindUnit, rebindStars: rebindStars, variants: variants };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.MHSCeremonyResolver = api;
})(typeof window !== 'undefined' ? window : globalThis);
