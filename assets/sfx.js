/* Sound for the big screen.
   Every sound has a "slot". If assets/sounds/<slot>.mp3 exists, that file plays. If not, a synthesized
   stand-in plays instead, so the game always has sound. See assets/sounds/README.md for the list. */
window.SFX = (() => {
  let ctx = null, muted = false, musicOn = true, base = "assets/sounds/";
  const buffers = {}, raw = {}, urls = {};
  const SLOTS = ["join", "round_intro", "question", "golden", "tick", "timeup", "land", "correct", "streak",
    "silly", "round_end", "alarm", "alarm_rudolph", "alarm_grinch", "alarm_homealone", "alarm_griswold",
    "alarm_snowday", "alarm_turbo", "alarm_nightmare", "alarm_diehard"];
  const MUSIC = ["music_lobby", "music_think"];

  function ac(resume) {
    try {
      if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); }
      if (resume && ctx.state === "suspended") ctx.resume();
      return ctx;
    } catch (e) { return null; }
  }
  const live = () => (muted ? null : ac(true));

  /* ---------- files ---------- */
  function decode(name) {
    const c = ac(false); if (!c || !raw[name]) return;
    const b = raw[name]; delete raw[name];
    try { c.decodeAudioData(b, buf => { buffers[name] = buf; }, () => {}); } catch (e) {}
  }
  function load() {
    if (location.protocol === "file:") return;
    SLOTS.forEach(n => fetch(base + n + ".mp3").then(r => (r.ok ? r.arrayBuffer() : null)).then(b => { if (b && b.byteLength > 500) { raw[n] = b; decode(n); } }).catch(() => {}));
    MUSIC.forEach(n => fetch(base + n + ".mp3", { method: "HEAD" }).then(r => { if (r.ok) urls[n] = base + n + ".mp3"; }).catch(() => {}));
  }
  function playFile(name, at, vol) {
    const c = live(); if (!c || !buffers[name]) return false;
    const s = c.createBufferSource(), g = c.createGain();
    s.buffer = buffers[name]; g.gain.value = vol == null ? 0.9 : vol;
    s.connect(g); g.connect(c.destination); s.start(c.currentTime + (at || 0));
    return true;
  }

  /* ---------- synth stand-ins ---------- */
  function tone(f, dur, { type = "sine", vol = 0.15, at = 0, to = null, decay = false, dest = null } = {}) {
    const c = live(); if (!c) return null;
    const t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.008);
    if (decay) g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    else { g.gain.setValueAtTime(vol, t + Math.max(0.02, dur - 0.05)); g.gain.linearRampToValueAtTime(0, t + dur); }
    o.connect(g); g.connect(dest || c.destination); o.start(t); o.stop(t + dur + 0.05);
    return o;
  }
  function noise(dur, { at = 0, vol = 0.2, freq = 1200, to = null, q = 1 } = {}) {
    const c = live(); if (!c) return;
    const t = c.currentTime + at, len = Math.floor(c.sampleRate * dur);
    const b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = b; f.type = "bandpass"; f.Q.value = q; f.frequency.setValueAtTime(freq, t);
    if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(c.destination); s.start(t); s.stop(t + dur);
  }
  function siren(sec, at) {
    const c = live(); if (!c) return;
    const t = c.currentTime + at;
    const o = c.createOscillator(), l = c.createOscillator(), lg = c.createGain(), f = c.createBiquadFilter(), g = c.createGain();
    o.type = "sawtooth"; o.frequency.value = 800; l.frequency.value = 0.9; lg.gain.value = 330;
    l.connect(lg); lg.connect(o.frequency);
    f.type = "lowpass"; f.frequency.value = 2200;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.15, t + 0.15);
    g.gain.setValueAtTime(0.15, t + sec - 0.3); g.gain.linearRampToValueAtTime(0, t + sec);
    o.connect(f); f.connect(g); g.connect(c.destination);
    o.start(t); l.start(t); o.stop(t + sec); l.stop(t + sec);
  }
  /* A church-bell-ish strike: inharmonic partials with a long decay. */
  function bell(f, at = 0, vol = 0.12) {
    [[1, 1], [2, 0.6], [2.76, 0.45], [5.4, 0.25], [8.9, 0.12]].forEach(([m, v]) => tone(f * m, 2.4 / Math.sqrt(m), { vol: vol * v, at, decay: true }));
  }
  function sleighbells(at = 0, n = 14) { for (let i = 0; i < n; i++) { noise(0.09, { at: at + i * 0.065 + Math.random() * 0.02, vol: 0.12, freq: 6000 + Math.random() * 3000, q: 4 }); tone(3200 + Math.random() * 2400, 0.08, { type: "triangle", vol: 0.03, at: at + i * 0.065, decay: true }); } }
  const lib = {
    siren: (at = 0) => siren(3, at),
    klaxon: (at = 0) => { for (let i = 0; i < 6; i++) tone(i % 2 ? 440 : 587, 0.42, { type: "square", vol: 0.08, at: at + i * 0.5 }); },
    honk: (at = 0) => { tone(330, 0.2, { type: "sawtooth", vol: 0.12, at }); tone(262, 0.3, { type: "sawtooth", vol: 0.12, at: at + 0.22 }); },
    slide: (at = 0) => tone(1600, 0.9, { vol: 0.16, at, to: 180 }),
    slideUp: (at = 0) => tone(220, 0.7, { vol: 0.16, at, to: 1800 }),
    boing: (at = 0) => { tone(140, 0.55, { type: "triangle", vol: 0.22, at, to: 560 }); tone(560, 0.3, { type: "triangle", vol: 0.12, at: at + 0.5, to: 280 }); },
    scream: (at = 0) => { tone(950, 1.1, { type: "sawtooth", vol: 0.06, at, to: 480 }); noise(1.1, { at, vol: 0.08, freq: 2600, to: 1100 }); },
    boom: (at = 0) => { noise(1.8, { at, vol: 0.55, freq: 500, to: 50 }); tone(90, 1.2, { vol: 0.3, at, to: 30 }); },
    jingle: (at = 0) => sleighbells(at, 10),
    wobble: (at = 0) => { tone(300, 1.6, { vol: 0.12, at, to: 760 }); tone(760, 1.4, { vol: 0.12, at: at + 1.6, to: 240 }); },
    powerup: (at = 0) => { [262, 330, 392, 523, 659, 784].forEach((f, i) => tone(f, 0.12, { type: "square", vol: 0.07, at: at + i * 0.08 })); },
    wahwah: (at = 0) => { [392, 370, 349, 330].forEach((f, i) => tone(f, i === 3 ? 0.9 : 0.4, { type: "sawtooth", vol: 0.08, at: at + i * 0.45, to: i === 3 ? 290 : null })); },
    /* slot stand-ins */
    join: (at = 0) => { bell(1568, at, 0.07); tone(600, 0.09, { vol: 0.1, at, to: 1300 }); },
    round_intro: (at = 0) => { sleighbells(at, 16); [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.5, { type: "triangle", vol: 0.1, at: at + 0.3 + i * 0.11, decay: true })); },
    question: (at = 0) => bell(1319, at, 0.08),
    golden: (at = 0) => { [1047, 1319, 1568, 2093, 2637].forEach((f, i) => tone(f, 0.9, { type: "triangle", vol: 0.08, at: at + i * 0.07, decay: true })); sleighbells(at + 0.3, 6); },
    tick: (at = 0) => tone(1500, 0.05, { type: "square", vol: 0.04, at }),
    timeup: (at = 0) => { bell(392, at, 0.14); bell(523, at + 0.18, 0.1); },
    land: (at = 0) => { for (let i = 0; i < 6; i++) tone(420 + i * 90, 0.08, { vol: 0.09, at: at + i * 0.09, to: 900 + i * 120 }); },
    correct: (at = 0) => { bell(1047, at, 0.12); bell(1319, at + 0.12, 0.1); bell(1568, at + 0.24, 0.1); },
    streak: (at = 0) => lib.powerup(at),
    silly: (at = 0) => { lib.boing(at); lib.boing(at + 0.7); },
    round_end: (at = 0) => { sleighbells(at, 20); [784, 988, 1175, 1568].forEach((f, i) => bell(f, at + 0.2 + i * 0.2, 0.08)); },
    alarm: (at = 0) => siren(3, at)
  };

  /* ---------- music box melodies ---------- */
  const NOTE = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
  function freq(n) {
    const m = /^([A-G])([#b]?)(\d)$/.exec(n); if (!m) return 0;
    const semi = NOTE[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0) + (+m[3] - 4) * 12;
    return 440 * Math.pow(2, semi / 12);
  }
  let box = null;
  function stopTune() { if (box) { try { box.g.gain.cancelScheduledValues(0); box.g.gain.setTargetAtTime(0, ctx.currentTime, 0.05); setTimeout(((g) => () => g.disconnect())(box.g), 400); } catch (e) {} box = null; } }
  /* tune: "E4 1,E4 1,E4 2" (note, beats). Plays like a tinkly music box. Returns length in seconds. */
  function tune(str, bpm = 120, at = 0.15) {
    stopTune();
    const c = live(); if (!c) return 0;
    const g = c.createGain(); g.gain.value = 1; g.connect(c.destination);
    box = { g };
    const beat = 60 / bpm; let t = at;
    String(str).split(",").forEach(tok => {
      const [n, b] = tok.trim().split(/\s+/); const d = (+b || 1) * beat, f = freq(n);
      if (f) {
        tone(f * 2, Math.max(1.1, d * 1.6), { vol: 0.16, at: t, decay: true, dest: g });
        tone(f * 4, 0.5, { vol: 0.035, at: t, decay: true, dest: g });
        tone(f * 6.01, 0.25, { type: "triangle", vol: 0.015, at: t, decay: true, dest: g });
      }
      t += d;
    });
    return t;
  }

  /* ---------- background music (only when files exist) ---------- */
  let track = null, trackName = "";
  function music(name) {
    if (!musicOn || muted || !urls[name]) name = "";
    if (name === trackName) return;
    trackName = name;
    if (track) { const old = track; track = null; fade(old, 0, () => old.pause()); }
    if (!name) return;
    const a = new Audio(urls[name]); a.loop = true; a.volume = 0;
    a.play().then(() => fade(a, name === "music_think" ? 0.22 : 0.32)).catch(() => {});
    track = a;
  }
  function fade(a, to, done) {
    const from = a.volume, t0 = Date.now();
    const id = setInterval(() => { const k = Math.min(1, (Date.now() - t0) / 800); a.volume = from + (to - from) * k; if (k >= 1) { clearInterval(id); done && done(); } }, 50);
  }

  load();
  return {
    play(name, at) { if (muted) return; if (playFile(name, at)) return; if (lib[name]) lib[name](at || 0); },
    /* Alarm: alarm_<id>.mp3, else the shared alarm.mp3 plus the round's synth extras, else all synth. */
    alarm(id, cues) {
      if (muted) return;
      if (playFile("alarm_" + id, 0)) return;
      const shared = playFile("alarm", 0);
      (cues || [["siren", 0]]).forEach(([n, at]) => { if (shared && (n === "siren" || n === "klaxon")) return; lib[n] && lib[n](at); });
    },
    has: name => !!(buffers[name] || urls[name]),
    tune, stopTune, music,
    unlock: () => { const c = ac(true); Object.keys(raw).forEach(decode); return !!c; },
    setMuted(m) { muted = !!m; if (muted) { stopTune(); music(""); } },
    setMusic(on) { musicOn = !!on; if (!musicOn) music(""); },
    get muted() { return muted; },
    get musicOn() { return musicOn; },
    get musicName() { return trackName; }
  };
})();
