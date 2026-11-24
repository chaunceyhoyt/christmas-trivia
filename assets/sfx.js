/* All sounds are synthesized with Web Audio, so there are no audio files to host. */
window.SFX = (() => {
  let ctx = null, muted = false;
  function ac() {
    if (muted) return null;
    try {
      if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); }
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    } catch (e) { return null; }
  }
  function tone(f, dur, { type = "sine", vol = 0.15, at = 0, to = null } = {}) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.setValueAtTime(vol, t + Math.max(0.02, dur - 0.05)); g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, { at = 0, vol = 0.2, freq = 1200, to = null } = {}) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + at, len = Math.floor(c.sampleRate * dur);
    const b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = b; f.type = "bandpass"; f.frequency.setValueAtTime(freq, t);
    if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(c.destination); s.start(t); s.stop(t + dur);
  }
  function siren(sec, at) {
    const c = ac(); if (!c) return;
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
  const lib = {
    siren: (at = 0) => siren(3, at),
    klaxon: (at = 0) => { for (let i = 0; i < 6; i++) tone(i % 2 ? 440 : 587, 0.42, { type: "square", vol: 0.08, at: at + i * 0.5 }); },
    honk: (at = 0) => { tone(330, 0.2, { type: "sawtooth", vol: 0.12, at }); tone(262, 0.3, { type: "sawtooth", vol: 0.12, at: at + 0.22 }); },
    slide: (at = 0) => tone(1600, 0.9, { vol: 0.16, at, to: 180 }),
    slideUp: (at = 0) => tone(220, 0.7, { vol: 0.16, at, to: 1800 }),
    boing: (at = 0) => { tone(140, 0.55, { type: "triangle", vol: 0.22, at, to: 560 }); tone(560, 0.3, { type: "triangle", vol: 0.12, at: at + 0.5, to: 280 }); },
    scream: (at = 0) => { tone(950, 1.1, { type: "sawtooth", vol: 0.06, at, to: 480 }); noise(1.1, { at, vol: 0.08, freq: 2600, to: 1100 }); },
    boom: (at = 0) => { noise(1.8, { at, vol: 0.55, freq: 500, to: 50 }); tone(90, 1.2, { vol: 0.3, at, to: 30 }); },
    jingle: (at = 0) => { for (let i = 0; i < 10; i++) tone(2400 + Math.random() * 1800, 0.12, { type: "triangle", vol: 0.06, at: at + i * 0.07 }); },
    wobble: (at = 0) => { tone(300, 1.6, { vol: 0.12, at, to: 760 }); tone(760, 1.4, { vol: 0.12, at: at + 1.6, to: 240 }); },
    powerup: (at = 0) => { [262, 330, 392, 523, 659, 784].forEach((f, i) => tone(f, 0.12, { type: "square", vol: 0.07, at: at + i * 0.08 })); },
    wahwah: (at = 0) => { [392, 370, 349, 330].forEach((f, i) => tone(f, i === 3 ? 0.9 : 0.4, { type: "sawtooth", vol: 0.08, at: at + i * 0.45, to: i === 3 ? 290 : null })); },
    stinger: (at = 0) => { [1046.5, 1318.5, 1568, 2093].forEach((f, i) => tone(f, 0.8, { type: "triangle", vol: 0.12, at: at + i * 0.09 })); },
    ding: () => { tone(1318, 0.5, { type: "triangle", vol: 0.15 }); tone(1760, 0.6, { type: "triangle", vol: 0.12, at: 0.1 }); },
    buzz: () => tone(140, 0.5, { type: "square", vol: 0.08 }),
    tick: () => tone(1200, 0.05, { type: "square", vol: 0.05 }),
    pop: () => tone(600, 0.09, { vol: 0.14, to: 1300 })
  };
  return {
    play: (name, at) => { if (lib[name]) lib[name](at || 0); },
    unlock: () => !!ac(),
    setMuted: m => { muted = !!m; },
    get muted() { return muted; }
  };
})();
