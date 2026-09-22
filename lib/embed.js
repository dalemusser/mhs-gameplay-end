/*
 * MHSCeremony — the EMBED: the one script a host page loads to run the
 * end-of-game ceremony. Builds the show's DOM inside a container, injects its
 * CSS, loads the vendored Babylon runtime + the MHS libs + the player + the
 * content definition from the bundle's own folder, fetches the student's EA
 * scores, resolves the script and starts the player. Contract: docs/embed-api.md.
 *
 *   <script src="…/vX.Y.Z/lib/embed.js"></script>
 *   <script>
 *     MHSCeremony.mount(document.body, {
 *       scoresUrl: '/missionhydrosci/api/ea-scores',   // OR scores: {…} OR profile: 'all-high'
 *       returnUrl: '/missionhydrosci/units',           // shows the Exit control
 *       onEvent: function (name, detail) { … },        // mounted, scores, started, unit, celebration, finished, failed, exit
 *     });
 *   </script>
 *
 * `base` (the folder every relative asset lives under) defaults to this
 * script's own folder, so the same bundle works at the repo root, on the CDN,
 * or behind stratahub's /missionhydrosci/content/end/vX.Y.Z/ path.
 *
 * LATE BINDING: the show starts at once with whatever the first scores fetch
 * returns; while `status` is "pending" (or the fetch failed) the embed keeps
 * polling `scoresUrl` in the background, and each unit's lines are resolved
 * as that character walks up, the star board as the ending starts — so a
 * grade that lands while Toppo is still talking is used by the time it is
 * needed, and nothing ever waits on grading. Fixture profiles and static
 * scores are final (no polling).
 *
 * Bump EMBED_V on ANY edit to lib/*.js or the definition: it is the only
 * cache buster for those files now (the CDN version folders are immutable, so
 * it only matters for the repo-root harness and a re-staged local folder).
 */
(function (global) {
  'use strict';

  var CONTRACT_VERSION = 1;
  var EMBED_V = '3';   // v0.2.0: player v9 (optimized assets)
  var FILES = [
    'lib/vendor/babylon.js',
    'lib/vendor/babylonjs.loaders.min.js',
    'lib/aliveface.js',
    'lib/gaze.js',
    'lib/headlook.js',
    'lib/resolver.js',
    'lib/player.js',
  ];
  var DEFINITION = 'ceremony-definition_v6.js';   // the CURRENT content (designers' script v4 + assets/audio_v6/)

  var CSS = [
    'html, body { margin: 0; height: 100%; overflow: hidden; background: #05070c; color: #dfe6f0;',
    '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }',
    '.mhs-ceremony { position: fixed; inset: 0; background: #05070c; }',
    '#renderCanvas { width: 100%; height: 100%; display: block; touch-action: none; outline: none; }',
    '#bubble { position: fixed; bottom: 18px; left: 50%; transform: translateX(-50%);',
    '  width: min(1240px, 96vw); box-sizing: border-box; display: flex; align-items: center; gap: 18px;',
    '  background: rgba(8,14,24,0.82); border: 1px solid rgba(90,160,255,0.4);',
    '  border-radius: 14px; padding: 12px 14px 12px 22px; backdrop-filter: blur(8px);',
    '  box-shadow: 0 0 24px rgba(40,120,220,0.22), inset 0 0 20px rgba(40,120,220,0.07);',
    '  z-index: 30; pointer-events: none; }',
    '#bubbleMain { flex: 1; min-width: 0; opacity: 0.35; transition: opacity .3s; }',
    '#bubble.show #bubbleMain { opacity: 1; }',
    '#speakerName { font-size: 12px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase;',
    '  color: #7fd0ff; margin-bottom: 4px; min-height: 15px; text-shadow: 0 0 10px rgba(80,180,255,0.6); }',
    '#bubbleText { font-size: 17px; line-height: 1.45; color: #b9c6da; min-height: 50px; }',
    '#bubbleText .w { transition: color .12s, text-shadow .12s; }',
    '#bubbleText .w.spoken { color: #ffffff; text-shadow: 0 0 12px rgba(120,200,255,0.8); }',
    '#bubbleText .status { font-style: italic; color: #7286a0; }',
    '#bubbleText .status.note { display: block; font-size: 14px; color: #5c6d86; margin-top: 4px; }',
    '#controls { display: flex; flex-direction: column; gap: 8px; pointer-events: auto; }',
    'button.ctl { background: rgba(20,40,70,0.8); color: #dfe6f0; border: 1px solid #3d6fa0;',
    '  border-radius: 8px; padding: 8px 14px; width: 118px; white-space: nowrap;',
    '  font-size: 14px; cursor: pointer; transition: background .12s, opacity .2s; }',
    'button.ctl:hover:not(:disabled) { background: rgba(40,72,116,0.95); border-color: #5b9bff; }',
    'button.ctl.primary { background: #2b6fb8; border-color: #5b9bff; font-weight: 600; }',
    'button.ctl.primary:hover:not(:disabled) { background: #357fce; }',
    'button.ctl:disabled { opacity: 0.4; cursor: default; }',
    '#hint { position: fixed; top: 10px; left: 12px; font-size: 11px; color: #46566e; }',
    '#exitBtn { position: fixed; top: 12px; right: 14px; z-index: 60; width: auto; padding: 6px 12px; font-size: 13px;',
    '  background: rgba(8,14,24,0.7); color: #9fc0e8; border: 1px solid rgba(90,160,255,0.45); }',
    '#exitBtn[hidden] { display: none; }',
    '#startOverlay { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;',
    '  background: rgba(5,7,12,0.72); backdrop-filter: blur(5px); z-index: 50; transition: opacity .45s; }',
    '#startOverlay.hide { opacity: 0; pointer-events: none; }',
    '#startBtn { background: #2b6fb8; color: #fff; border: 1px solid #5b9bff; border-radius: 12px;',
    '  padding: 15px 34px; font-size: 20px; font-weight: 600; cursor: pointer; box-shadow: 0 0 32px rgba(40,120,220,0.4); }',
    '#startBtn:hover:enabled { background: #357fce; }',
    '#startBtn:disabled { opacity: 0.5; cursor: default; }',
    '#ceremonyFail { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 55;',
    '  background: #05070c; color: #dfe6f0; text-align: center; padding: 24px; box-sizing: border-box; }',
    '#ceremonyFail div { max-width: 480px; font-size: 17px; line-height: 1.5; }',
    '#ceremonyFail small { display: block; margin-top: 10px; color: #7286a0; font-size: 13px; }',
  ].join('\n');

  var HTML = [
    '<canvas id="renderCanvas"></canvas>',
    '<div id="bubble">',
    '  <div id="bubbleMain"><div id="speakerName"></div><div id="bubbleText"></div></div>',
    '  <div id="controls">',
    '    <button class="ctl primary" id="nextBtn">Next ▶</button>',
    '    <button class="ctl" id="replayBtn" title="Replay this line">↻ Replay</button>',
    '  </div>',
    '</div>',
    '<div id="hint">F = free camera · R = restart</div>',
    '<button class="ctl" id="exitBtn" hidden>Exit</button>',
    '<div id="startOverlay"><button id="startBtn" disabled>Loading…</button></div>',
  ].join('\n');

  function scriptBase() {
    var s = document.currentScript;
    if (!s || !s.src) return '';
    return s.src.replace(/lib\/embed\.js(\?.*)?$/, '');
  }
  var DEFAULT_BASE = scriptBase();

  function injectCSS() {
    if (document.getElementById('mhs-ceremony-css')) return;
    var st = document.createElement('style');
    st.id = 'mhs-ceremony-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  // Append every script tag at once with async=false: they download in parallel
  // and execute in order. Resolves when the last one has run.
  function loadScripts(base, files) {
    return new Promise(function (resolve, reject) {
      var pending = files.length, failed = false;
      files.forEach(function (f) {
        var el = document.createElement('script');
        el.src = base + f + '?v=' + EMBED_V;
        el.async = false;
        el.onload = function () { if (--pending === 0 && !failed) resolve(); };
        el.onerror = function () { if (!failed) { failed = true; reject(new Error('could not load ' + f)); } };
        document.head.appendChild(el);
      });
    });
  }

  function webglAvailable() {
    try {
      var c = document.createElement('canvas');
      return !!(global.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }

  function fetchJSON(url) {
    return fetch(url, { credentials: 'same-origin', cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + url);
      return r.json();
    });
  }

  function mount(container, opts) {
    opts = opts || {};
    var base = (opts.base != null) ? opts.base : DEFAULT_BASE;
    var pollMs = Math.max(1000, opts.pollMs || 5000);
    var R = null, DEF = null, P = null;
    var pollTimer = null, finished = false;
    var handle = { contractVersion: CONTRACT_VERSION, base: base, scores: { items: {} }, status: 'unknown', script: null, stop: stopPolling };

    function emit(name, detail) {
      if (!opts.onEvent) return;
      try { opts.onEvent(name, detail || {}); } catch (e) { console.warn('ceremony: onEvent handler failed', e); }
    }

    injectCSS();
    container.classList.add('mhs-ceremony');
    container.innerHTML = HTML;

    // ---- scores source -------------------------------------------------------
    var source = opts.scores ? { kind: 'static' }
      : opts.scoresUrl ? { kind: 'url', url: opts.scoresUrl }
      : opts.profile ? { kind: 'profile', url: base + 'test-profiles/' + encodeURIComponent(opts.profile) + '.json' }
      : { kind: 'none' };

    function accept(s, how) {
      handle.scores = (s && typeof s === 'object') ? s : { items: {} };
      if (!handle.scores.items) handle.scores.items = {};
      // fixtures and static scores are final; the endpoint says pending|ready
      handle.status = (source.kind === 'url') ? (handle.scores.status || 'ready') : 'ready';
      emit('scores', { how: how, status: handle.status, items: Object.keys(handle.scores.items).length,
        stars: handle.scores.stars || {} });
    }

    function fetchScores(how) {
      if (source.kind === 'static') { accept(opts.scores, how); return Promise.resolve(); }
      if (source.kind === 'none') { accept({ items: {} }, how); return Promise.resolve(); }
      return fetchJSON(source.url).then(function (s) { accept(s, how); }).catch(function (err) {
        console.warn('ceremony: scores fetch failed (' + how + ')', err);
        if (how === 'initial') accept({ items: {} }, how);
        handle.status = (source.kind === 'url') ? 'pending' : 'ready';   // keep polling the endpoint; a fixture that 404s is final
        emit('scores', { how: how, status: handle.status, error: String(err && err.message || err) });
      });
    }

    function startPolling() {
      if (source.kind !== 'url' || finished || handle.status === 'ready') return;
      pollTimer = setTimeout(function () {
        pollTimer = null;
        fetchScores('poll').then(startPolling);
      }, pollMs);
    }
    function stopPolling() { if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; } }

    // ---- player hooks (late binding + host events) ---------------------------
    var hooks = {
      beforeUnit: function (unitId, index) {
        var changed = R.rebindUnit(handle.script, DEF, unitId, handle.scores);
        emit('unit', { unitId: unitId, index: index, rebound: changed, status: handle.status, variants: R.variants(handle.script) });
      },
      beforeCelebration: function (index) {
        var changed = R.rebindStars(handle.script, handle.scores);
        var beat = handle.script.beats[index];
        emit('celebration', { index: index, rebound: changed, status: handle.status, stars: (beat && beat.stars) || {} });
      },
      onStarted: function () { emit('started', { status: handle.status, variants: R.variants(handle.script) }); },
      onFinished: function (d) {
        finished = true; stopPolling();
        var eb = null; handle.script.beats.forEach(function (b) { if (b.type === 'celebration' && b.ending) eb = b; });
        emit('finished', { award: d && d.award, status: handle.status, variants: R.variants(handle.script), stars: (eb && eb.stars) || {} });
      },
      onFailed: function (err) { fail(err, 'load'); },
      onExit: function () { finished = true; stopPolling(); emit('exit', { status: handle.status }); },
    };

    function fail(err, stage) {
      stopPolling();
      var msg = String((err && err.message) || err || 'unknown error');
      console.error('ceremony: failed (' + stage + ')', err);
      var el = document.getElementById('ceremonyFail');
      if (!el) {
        el = document.createElement('div'); el.id = 'ceremonyFail';
        el.innerHTML = '<div>The ceremony could not start on this device.'
          + (opts.returnUrl || opts.onExit ? ' Use the button in the top-right corner to go back.' : '')
          + '<small></small></div>';
        container.appendChild(el);
      }
      el.querySelector('small').textContent = msg;
      var ov = document.getElementById('startOverlay'); if (ov) ov.style.display = 'none';
      var xb = document.getElementById('exitBtn');
      if (xb && (opts.onExit || opts.returnUrl)) {
        xb.hidden = false; xb.textContent = opts.exitLabel || 'Exit';
        if (!xb.__wired) { xb.__wired = true; xb.addEventListener('click', function () {
          emit('exit', { status: handle.status, afterFailure: true });
          if (opts.onExit) opts.onExit(); else location.href = opts.returnUrl; }); }
      }
      emit('failed', { stage: stage, message: msg });
    }

    // ---- boot ------------------------------------------------------------------
    if (!webglAvailable()) { fail(new Error('WebGL is not available'), 'webgl'); return handle; }

    var files = FILES.map(function (f) { return (f === 'lib/player.js' && opts.player) ? opts.player : f; });
    loadScripts(base, files.concat([opts.definition || DEFINITION])).then(function () {
      R = global.MHSCeremonyResolver; DEF = global.CEREMONY_DEFINITION; P = global.MHSCeremonyPlayer;
      if (!R || !DEF || !P) throw new Error('bundle incomplete (resolver/definition/player missing)');
      return fetchScores('initial');
    }).then(function () {
      handle.script = R.resolve(DEF, handle.scores);
      global.__script = handle.script;      // the test harness / debugging inspect this
      P.start(handle.script, { base: base, hooks: hooks, dev: !!opts.dev,
        returnUrl: opts.returnUrl, onExit: opts.onExit, exitLabel: opts.exitLabel });
      emit('mounted', { status: handle.status, variants: R.variants(handle.script), source: source.kind });
      startPolling();
    }).catch(function (err) { fail(err, 'boot'); });

    return handle;
  }

  global.MHSCeremony = { mount: mount, CONTRACT_VERSION: CONTRACT_VERSION, EMBED_V: EMBED_V };
})(typeof window !== 'undefined' ? window : globalThis);
