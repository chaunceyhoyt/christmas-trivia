/* Big screen: the game's source of truth. It keeps players, answers and scores, runs the autopilot,
   broadcasts state to phones, and takes commands from the host controller over a PIN-named channel. */
(() => {
  const R = window.ROUNDS, byId = Object.fromEntries(R.map(r => [r.id, r]));
  const $ = s => document.querySelector(s);
  const KEY = "xmas-screen-v2", PKEY = "xmas-photos-v2", LETTERS = "ABCD";
  /* How long the autopilot holds each screen (ms). */
  const HOLD = { intro: 8000, alarm: 11000, land: 3200, reveal: 8000, note: 2500, roundend: 14000, menu: 6000, silly: 16000 };
  const QPHASES = ["ready", "question", "locked", "reveal"];

  /* ---------- state ---------- */
  function code4() { const A = "ABCDEFGHJKLMNPQRSTUVWXYZ"; return Array.from({ length: 4 }, () => A[Math.floor(Math.random() * A.length)]).join(""); }
  function fresh() {
    return { code: code4(), pin: String(Math.floor(1000 + Math.random() * 9000)), players: {}, kicked: [], played: [],
      rid: null, order: [], qi: 0, phase: "lobby", choices: [], correct: -1, ans: {}, res: null, scored: {},
      tEnd: 0, tLimit: 20, qOpenAt: 0, readMs: 0, stepAt: 0, epoch: 0, golden: -1, silly: "",
      showScores: false, roundStart: {}, alarmAt: 0, queue: [], auto: true, surprise: false, kid: false,
      paused: false, pausedAt: 0, lastKind: "" };
  }
  let G = null, photos = {};
  try { G = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {}
  try { photos = JSON.parse(localStorage.getItem(PKEY) || "{}") || {}; } catch (e) {}
  G = G && G.code ? Object.assign(fresh(), G) : fresh();
  G.showScores = false;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(G)); } catch (e) {} };
  const savePhotos = () => { try { localStorage.setItem(PKEY, JSON.stringify(photos)); } catch (e) {} };
  save();
  const cur = () => (G.rid ? byId[G.rid] : null);
  const qIndex = () => G.order[G.qi];
  const curQ = () => { const r = cur(); return r ? r.qs[qIndex()] : null; };
  const toughOf = (r, i) => +((r.tough || "")[i]) || 2;
  const timerFor = r => (G.kid ? Math.max(30, r.timer || 20) : r.timer || 20);
  const sorted = () => Object.entries(G.players).map(([id, p]) => ({ id, ...p })).sort((a, b) => b.score - a.score || a.at - b.at);
  const pl = id => { const p = G.players[id]; return p ? { id, av: p.av, photo: p.ph && photos[id] ? photos[id] : "" } : { id }; };
  const active = () => Object.keys(G.players).filter(id => Date.now() - (G.players[id].seen || 0) < 45000);

  /* ---------- media availability ---------- */
  const mediaOk = {};
  const mediaSrc = q => q[4] && (q[4].img || q[4].audio || q[4].video);
  function probeMedia() {
    R.forEach(r => r.qs.forEach((q, i) => {
      const src = mediaSrc(q); if (!src) return;
      const k = r.id + ":" + i, done = ok => { if (mediaOk[k] !== ok) { mediaOk[k] = ok; render(); publish(); } };
      if (q[4].img) { const im = new Image(); im.onload = () => done(true); im.onerror = () => done(false); im.src = src; }
      else { const el = document.createElement(q[4].video ? "video" : "audio"); el.preload = "metadata"; el.onloadedmetadata = () => done(true); el.onerror = () => done(false); el.src = src; }
    }));
  }
  const playable = r => r.qs.map((q, i) => i).filter(i => !mediaSrc(r.qs[i]) || mediaOk[r.id + ":" + i]);

  /* ---------- links + QR ---------- */
  const base = location.href.replace(/[#?].*$/, "").replace(/[^/]*$/, "");
  const joinUrl = () => base + "play.html?g=" + G.code;
  const hostUrl = () => base + "host.html?g=" + G.code + "#" + G.pin;
  const shortJoin = () => (base.replace(/^https?:\/\//, "") + "play.html");
  const qrCache = {};
  function qr(text) {
    if (qrCache[text]) return qrCache[text];
    if (!window.QRCode) return "";
    const d = document.createElement("div");
    new QRCode(d, { text, width: 512, height: 512, colorDark: "#3a1420", colorLight: "#fff8ea", correctLevel: QRCode.CorrectLevel.M });
    const c = d.querySelector("canvas");
    return (qrCache[text] = c ? c.toDataURL() : "");
  }

  /* ---------- network ---------- */
  let main = null, host = null, netOk = false, hostSeen = 0;
  function connect() {
    if (main) main.close();
    if (host) host.close();
    const room = "xmas-" + G.code.toLowerCase();
    main = Net.open(room, { join: onJoin, answer: onAnswer, photo: onPhoto, hello: p => { seen(p && p.pid); publish(); } },
      s => { netOk = s === "SUBSCRIBED"; if (netOk) publish(); renderFoot(); });
    host = Net.open(room + "-" + G.pin, { cmd: onCmd, hello: () => { hostSeen = Date.now(); renderFoot(); publish(); } }, s => { if (s === "SUBSCRIBED") publish(); });
  }
  function seen(pid) { if (pid && G.players[pid]) G.players[pid].seen = Date.now(); }
  function onJoin(p) {
    if (!p || typeof p.pid !== "string") return;
    const pid = p.pid.slice(0, 40), name = String(p.name || "").trim().slice(0, 24);
    if (!name || G.kicked.includes(pid)) return;
    /* A photo avatar arrives separately ("photo" event); the join only says whether the player wants one. */
    const av = typeof p.av === "string" && p.av.length <= 12 ? p.av : "🎄", wantsPhoto = !!p.ph;
    const cur = G.players[pid];
    if (!cur) {
      if (Object.keys(G.players).length >= 60) return;
      G.players[pid] = { name, score: 0, at: Date.now(), av, ph: "", streak: 0, seen: Date.now() };
      SFX.play("join"); save(); render();
    } else {
      cur.seen = Date.now();
      const ph = wantsPhoto ? cur.ph || "" : "";
      if (!wantsPhoto && photos[pid]) { delete photos[pid]; savePhotos(); }
      if (cur.name !== name || cur.av !== av || cur.ph !== ph) { cur.name = name; cur.av = av; cur.ph = ph; save(); render(); }
    }
    publish();
  }
  function onPhoto(p) {
    if (!p || !G.players[p.pid] || typeof p.data !== "string") return;
    if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(p.data) || p.data.length > 60000) return;
    photos[p.pid] = p.data; G.players[p.pid].ph = String(p.ph || "").slice(0, 16);
    savePhotos(); save(); render(); publish();
  }
  function onAnswer(p) {
    if (!p || !G.players[p.pid] || G.phase !== "question" || G.paused || p.epoch !== G.epoch) return;
    const c = p.c | 0;
    if (c < 0 || c >= G.choices.length) return;
    const had = G.ans[p.pid];
    G.ans[p.pid] = { c, t: had && had.c === c ? had.t : Date.now() };
    seen(p.pid); lastAnsAt = Date.now();
    save(); renderTray(); publish();
  }
  function onCmd(m) {
    hostSeen = Date.now();
    if (!m || typeof m.a !== "string") return;
    switch (m.a) {
      case "next": next(); break;
      case "prev": prev(); break;
      case "pick": pick(m.id); break;
      case "surprise": surpriseNow(m.id); break;
      case "queue": if (byId[m.id] && !G.queue.includes(m.id)) G.queue.push(m.id); break;
      case "unqueue": G.queue.splice(m.i | 0, 1); break;
      case "qup": { const i = m.i | 0; if (i > 0 && i < G.queue.length) [G.queue[i - 1], G.queue[i]] = [G.queue[i], G.queue[i - 1]]; break; }
      case "queueAll": defaultPool().filter(r => !G.queue.includes(r.id)).forEach(r => G.queue.push(r.id)); break;
      case "clearQueue": G.queue = []; break;
      case "lock": if (G.phase === "question") lock(); break;
      case "skip": if (QPHASES.includes(G.phase)) advanceQ(); break;
      case "pause": setPaused(true); break;
      case "resume": setPaused(false); break;
      case "addTime": if (G.phase === "question" && G.tEnd) { G.tEnd += 10000; G.stepAt = G.tEnd; G.tLimit += 10; } break;
      case "auto": G.auto = !!m.on; if (G.auto && G.stepAt && G.stepAt < Date.now() + 2500) G.stepAt = Date.now() + 3000; break;
      case "surpriseOn": G.surprise = !!m.on; break;
      case "kid": G.kid = !!m.on; break;
      case "scores": G.showScores = !G.showScores; break;
      case "adj": if (G.players[m.pid]) G.players[m.pid].score += Math.max(-500, Math.min(500, m.d | 0)); break;
      case "kick": kick(m.pid); break;
      case "mute": SFX.setMuted(!!m.on); break;
      case "music": SFX.setMusic(!!m.on); break;
      case "replay": replayMedia(); break;
      case "menu": toMenu(); break;
      case "lobby": stopMedia(); G.phase = "lobby"; G.rid = null; G.stepAt = 0; break;
      case "hello": break;
    }
    arm(); save(); render(); publish();
  }

  let pubT = 0;
  function publish() { if (pubT) return; pubT = setTimeout(() => { pubT = 0; pub(); }, 90); }
  function pub() {
    if (!main) return;
    const r = cur(), q = curQ(), inQ = r && QPHASES.includes(G.phase), now = Date.now(), pausedNow = G.paused ? G.pausedAt : now;
    const counts = [0, 0, 0, 0];
    Object.values(G.ans).forEach(a => counts[a.c]++);
    const m = q && q[4] ? q[4] : {};
    const s = {
      phase: G.phase, code: G.code, epoch: G.epoch, showScores: G.showScores, paused: G.paused, kid: G.kid, auto: G.auto,
      round: r ? { id: r.id, title: r.title, sub: r.sub || "", kind: r.kind, rule: r.rule || "", lead: r.lead || "", big: !!r.big,
        dark: !!r.dark, squirrel: !!r.squirrel, c1: r.c1 || "", c2: r.c2 || "", ink: r.ink || "", fx: r.fx || "", alarm: r.alarm || "",
        tagline: r.tagline || "", emoji: r.emoji || "", n: G.order.length, timer: timerFor(r), mult: r.mult || 1 } : null,
      qi: G.qi, q: inQ ? q[0] : null, choices: inQ && G.phase !== "ready" ? G.choices : null,
      media: inQ ? (m.tune ? "tune" : m.audio ? "audio" : m.img ? "img" : m.video ? "video" : "") : "",
      tough: inQ ? toughOf(r, qIndex()) : 0, golden: inQ && G.qi === G.golden,
      tLeft: G.phase === "question" && G.tEnd ? Math.max(0, G.tEnd - pausedNow) : 0, tLimit: G.tLimit,
      stepLeft: G.stepAt ? Math.max(0, G.stepAt - pausedNow) : 0,
      answered: Object.keys(G.ans),
      players: sorted().map(p => ({ id: p.id, name: p.name, score: p.score, av: p.av, ph: p.ph || "", streak: p.streak || 0 })),
      reveal: G.phase === "reveal" ? { correct: G.correct, note: q[3] || "", res: G.res, counts } : null,
      silly: G.phase === "silly" ? G.silly : "",
      next: G.queue.slice(0, 3).map(id => byId[id] ? byId[id].title : ""),
      alarmAge: G.phase === "alarm" && G.alarmAt ? now - G.alarmAt : 99999
    };
    main.send("state", s);
    host.send("hoststate", Object.assign({}, s, {
      secret: q ? { answer: G.correct >= 0 ? G.choices[G.correct] : q[1], correct: G.correct, note: q[3] || "", q: q[0], choices: G.choices, ans: G.ans } : null,
      rounds: R.map(x => ({ id: x.id, title: x.title, kind: x.kind, n: playable(x).length, total: x.qs.length, played: G.played.includes(x.id),
        c1: x.c1 || "", timer: timerFor(x), extra: !!x.extra })),
      queue: G.queue.slice(), surprise: G.surprise, muted: SFX.muted, music: SFX.musicOn,
      hasMusic: SFX.has("music_lobby") || SFX.has("music_think")
    }));
  }
  setInterval(pub, 3000);

  /* ---------- game flow ---------- */
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function makeChoices(r, q) {
    let opts;
    if (r.years) {
      const y = +q[1], set = new Set([y]);
      while (set.size < 4) set.add(y + (Math.floor(Math.random() * 4) + 1) * (Math.random() < 0.5 ? -1 : 1));
      opts = [...set].map(String);
    } else opts = [q[1], ...q[2]];
    shuffle(opts);
    return { choices: opts, correct: opts.indexOf(String(q[1])) };
  }
  const defaultPool = () => R.filter(r => (G.kid ? r.kind === "kid" : r.kind === "feature" || r.kind === "media") && !r.extra && !G.played.includes(r.id) && playable(r).length);
  const surprisePool = () => R.filter(r => (G.kid ? r.kind === "kid" : r.kind === "alarm") && !G.played.includes(r.id) && !G.queue.includes(r.id));

  function pick(id) {
    const r = byId[id]; if (!r) return;
    const order = playable(r); if (!order.length) return;
    stopMedia();
    G.rid = id; G.order = order; G.qi = 0; G.showScores = false; G.ans = {}; G.res = null; G.tEnd = 0;
    G.golden = order.length > 4 ? 1 + Math.floor(Math.random() * (order.length - 1)) : -1;
    G.queue = G.queue.filter(x => x !== id);
    if (!G.played.includes(id)) G.played.push(id);
    G.roundStart = Object.fromEntries(Object.entries(G.players).map(([k, p]) => [k, p.score]));
    G.lastKind = r.kind;
    if (r.kind === "alarm") { G.phase = "alarm"; G.alarmAt = Date.now(); G.stepAt = Date.now() + HOLD.alarm; SFX.alarm(r.id, r.sfx); clearTimeout(alarmT); alarmT = setTimeout(render, 2300); }
    else { G.phase = "intro"; G.stepAt = Date.now() + HOLD.intro; SFX.play("round_intro"); }
  }
  let alarmT = 0;
  function surpriseNow(id) {
    let r = id && byId[id];
    if (!r) { let pool = surprisePool(); if (!pool.length) pool = R.filter(x => x.kind === (G.kid ? "kid" : "alarm")); r = pool[Math.floor(Math.random() * pool.length)]; }
    if (r) pick(r.id);
  }
  function startFromQueue() {
    const pool = surprisePool();
    if (G.surprise && pool.length && G.lastKind !== "alarm" && Math.random() < 0.3) return pick(pool[Math.floor(Math.random() * pool.length)].id);
    while (G.queue.length) { const id = G.queue[0]; if (byId[id] && playable(byId[id]).length) return pick(id); G.queue.shift(); }
    const f = defaultPool()[0]; if (f) pick(f.id);
  }
  function openReady() {
    const r = cur(), q = curQ();
    Object.assign(G, makeChoices(r, q));
    G.ans = {}; G.res = null; G.phase = "ready"; G.epoch++; G.tEnd = 0;
    const m = q[4] || {}, words = String(q[0]).split(/\s+/).length;
    G.readMs = m.tune || m.audio || m.video ? 1800 : Math.min(6500, Math.max(2500, 1200 + words * 230)) + (G.kid ? 1500 : 0);
    G.stepAt = Date.now() + G.readMs;
    startMedia(q, true);
    SFX.play("question");
    if (G.qi === G.golden) SFX.play("golden", 0.35);
  }
  function openQuestion() {
    const r = cur();
    G.phase = "question"; G.tLimit = timerFor(r); G.qOpenAt = Date.now(); G.tEnd = G.qOpenAt + G.tLimit * 1000; G.stepAt = G.tEnd;
    lastSec = -1;
  }
  function lock() {
    G.phase = "locked"; G.tEnd = 0; G.stepAt = Date.now() + HOLD.land;
    SFX.play("timeup"); if (Object.keys(G.ans).length) SFX.play("land", 0.55);
  }
  function reveal() {
    const r = cur(), qi = qIndex(), q = r.qs[qi], key = r.id + ":" + qi;
    const prev = G.scored[key];
    if (prev) {
      Object.entries(prev.d || {}).forEach(([pid, d]) => { if (G.players[pid]) G.players[pid].score -= d; });
      Object.entries(prev.s || {}).forEach(([pid, s]) => { if (G.players[pid]) G.players[pid].streak = s; });
    }
    const base = TOUGH[toughOf(r, qi)].pts * (r.mult || 1), golden = G.qi === G.golden, limit = G.tLimit * 1000;
    const leader = sorted()[0];
    const res = {}, oldStreak = {};
    Object.entries(G.players).forEach(([pid, p]) => {
      oldStreak[pid] = p.streak || 0;
      const a = G.ans[pid];
      if (!a) { p.streak = 0; return; }
      const ok = a.c === G.correct, x = { c: a.c, ok, d: 0 };
      if (ok) {
        const frac = Math.max(0, Math.min(1, 1 - (a.t - G.qOpenAt) / limit));
        x.base = base; x.speed = Math.round((base * frac) / 10) * 10;
        x.d = x.base + x.speed;
        if (golden) { x.golden = true; x.d *= 2; }
        p.streak = (p.streak || 0) + 1; x.streak = p.streak;
        if (p.streak >= 3) { x.sb = Math.min(250, 50 * (p.streak - 2)); x.d += x.sb; }
      } else { p.streak = 0; if (r.wrong) { x.d -= r.wrong; x.lost = r.wrong; } }
      if (r.everyone) { x.d += r.everyone; x.everyone = r.everyone; }
      res[pid] = x;
    });
    if (r.first) {
      const oks = Object.entries(res).filter(([, x]) => x.ok).sort((a, b) => G.ans[a[0]].t - G.ans[b[0]].t);
      if (oks[0]) { oks[0][1].d += r.first; oks[0][1].first = r.first; }
    }
    if (r.steal && leader && leader.score > 0) {
      let loss = 0;
      Object.entries(res).forEach(([pid, x]) => { if (x.ok && pid !== leader.id) { x.d += r.steal; x.stole = r.steal; loss += r.steal; } });
      loss = Math.min(loss, leader.score + ((res[leader.id] && res[leader.id].d) || 0));
      if (loss > 0) { res[leader.id] = res[leader.id] || { c: -1, ok: false, d: 0 }; res[leader.id].d -= loss; res[leader.id].robbed = loss; }
    }
    const deltas = {};
    Object.entries(res).forEach(([pid, x]) => { if (r.kind === "kid") x.d = Math.max(0, x.d); G.players[pid].score += x.d; deltas[pid] = x.d; });
    G.scored[key] = { d: deltas, s: oldStreak }; G.res = res; G.phase = "reveal"; G.tEnd = 0;
    G.stepAt = Date.now() + HOLD.reveal + (q[3] ? HOLD.note : 0);
    SFX.play("correct");
    if (Object.values(res).some(x => x.streak >= 3)) SFX.play("streak", 1.1);
  }
  function advanceQ() {
    const r = cur();
    if (G.qi + 1 >= G.order.length) return endRound();
    G.qi++;
    if (r.sillies && r.sillies.length && G.qi % 4 === 0) {
      G.silly = r.sillies[(G.qi / 4 - 1) % r.sillies.length]; G.phase = "silly"; G.stepAt = Date.now() + HOLD.silly; stopMedia(); SFX.play("silly");
    } else openReady();
  }
  function next() {
    switch (G.phase) {
      case "lobby": case "menu": startFromQueue(); if (G.phase === "lobby") toMenu(); break;
      case "intro": case "alarm": case "silly": openReady(); break;
      case "ready": openQuestion(); break;
      case "question": lock(); break;
      case "locked": reveal(); break;
      case "reveal": advanceQ(); break;
      case "roundend": toMenu(); break;
    }
  }
  function prev() {
    const r = cur(); if (!r) { if (G.phase === "menu") { G.phase = "lobby"; G.stepAt = 0; } return; }
    if (QPHASES.includes(G.phase)) {
      if (G.phase !== "ready" && G.phase !== "question") openReady();
      else if (G.qi > 0) { G.qi--; openReady(); }
      else { stopMedia(); G.phase = r.kind === "alarm" ? "alarm" : "intro"; G.alarmAt = 0; G.tEnd = 0; G.stepAt = Date.now() + HOLD.intro; }
    } else if (G.phase === "silly") openReady();
    else if (G.phase === "roundend") { G.qi = G.order.length - 1; openReady(); }
    else if (G.phase === "intro" || G.phase === "alarm") toMenu();
  }
  function endRound() {
    stopMedia();
    G.phase = "roundend"; G.tEnd = 0; G.stepAt = Date.now() + HOLD.roundend;
    SFX.play("round_end");
  }
  function toMenu() { stopMedia(); G.phase = "menu"; G.rid = null; G.showScores = false; G.tEnd = 0; G.stepAt = 0; arm(); }
  /* In the menu, the autopilot starts the next round on its own when something is queued. */
  function arm() {
    if (G.phase !== "menu") return;
    if (G.auto && G.queue.length) { if (!G.stepAt) G.stepAt = Date.now() + HOLD.menu; }
    else G.stepAt = 0;
  }
  function setPaused(on) {
    if (on === G.paused) return;
    if (on) { G.paused = true; G.pausedAt = Date.now(); if (media.el && media.el.pause) media.el.pause(); if (media.audio) media.audio.pause(); }
    else {
      const d = Date.now() - G.pausedAt;
      G.paused = false;
      if (G.stepAt) G.stepAt += d;
      if (G.tEnd) G.tEnd += d;
      if (G.qOpenAt) G.qOpenAt += d;
      Object.values(G.ans).forEach(a => { a.t += d; });
      if (media.el && media.el.play && G.phase !== "reveal") media.el.play().catch(() => {});
      if (media.audio) media.audio.play().catch(() => {});
    }
  }
  function kick(pid) { if (!G.players[pid]) return; delete G.players[pid]; delete G.ans[pid]; delete photos[pid]; savePhotos(); G.kicked.push(pid); }

  /* ---------- media on the TV ---------- */
  const media = { epoch: -1, el: null, audio: null, kind: "" };
  function startMedia(q, play) {
    stopMedia();
    const m = q && q[4]; if (!m) return;
    media.epoch = G.epoch;
    if (m.tune) { media.kind = "tune"; if (play) SFX.tune(m.tune, m.bpm || 120); }
    else if (m.img) { const im = new Image(); im.src = m.img; im.alt = ""; im.className = "media-img fx-" + (m.fx || "none"); media.el = im; media.kind = "img"; }
    else if (m.audio) { const a = new Audio(m.audio); a.muted = SFX.muted; if (play) a.play().catch(() => {}); media.audio = a; media.kind = "audio"; }
    else if (m.video) {
      const v = document.createElement("video");
      v.src = m.video + (m.start || m.end ? `#t=${m.start || 0}${m.end ? "," + m.end : ""}` : ""); v.playsInline = true; v.muted = SFX.muted; v.className = "media-video";
      if (play) v.play().catch(() => {});
      media.el = v; media.kind = "video";
    }
  }
  function stopMedia() {
    SFX.stopTune();
    if (media.audio) { media.audio.pause(); media.audio = null; }
    if (media.el && media.el.pause) media.el.pause();
    media.el = null; media.kind = ""; media.epoch = -1;
  }
  function replayMedia() {
    const q = curQ(), m = q && q[4]; if (!m || !QPHASES.includes(G.phase)) return;
    if (m.tune) SFX.tune(m.tune, m.bpm || 120);
    else if (media.audio) { media.audio.currentTime = 0; media.audio.play().catch(() => {}); }
    else if (media.el && media.el.play) { media.el.currentTime = m.start || 0; media.el.play().catch(() => {}); }
  }
  /* Put the media element into its slot. The same element is reused across re-renders so video keeps playing. */
  function attachMedia() {
    const slot = $("#mslot"), q = curQ();
    if (!slot || !q || !q[4]) return;
    if (media.epoch !== G.epoch) startMedia(q, false);
    if (media.kind === "tune" || media.kind === "audio") return;
    const el = media.el; if (!el) return;
    if (el.parentNode !== slot) slot.appendChild(el);
    if (el.tagName === "IMG") {
      const clear = G.phase === "locked" || G.phase === "reveal";
      el.classList.toggle("start", G.phase === "ready");
      el.classList.toggle("run", G.phase === "question");
      el.classList.toggle("clear", clear);
      if (G.phase === "question") { el.style.animationDuration = G.tLimit + "s"; el.style.animationDelay = -((G.paused ? G.pausedAt : Date.now()) - G.qOpenAt) / 1000 + "s"; }
    }
  }

  /* ---------- clock ---------- */
  let lastSec = -1, lastAnsAt = 0, musicT = 0;
  setInterval(() => {
    const now = Date.now();
    if (now - musicT > 1000) { musicT = now; music(); }
    renderChip();
    if (G.paused) return;
    if (G.phase === "question" && G.tEnd) {
      const s = Math.max(0, Math.ceil((G.tEnd - now) / 1000));
      if (s !== lastSec) { lastSec = s; if (s <= 5 && s > 0) SFX.play("tick"); const el = $("#timer"); if (el) el.textContent = s; }
      const act = active();
      if (act.length && act.every(id => G.ans[id]) && now - lastAnsAt > 900) { lock(); save(); render(); publish(); return; }
    }
    if (G.stepAt && now >= G.stepAt && (G.auto || G.phase === "ready" || G.phase === "question")) { next(); save(); render(); publish(); }
  }, 200);
  function music() {
    const ph = G.phase, busy = media.kind === "tune" || media.kind === "audio" || media.kind === "video";
    let want = "";
    if (G.paused || ["lobby", "menu", "roundend", "intro"].includes(ph)) want = "music_lobby";
    else if (QPHASES.includes(ph) && !busy) want = "music_think";
    SFX.music(want);
  }

  /* ---------- rendering ---------- */
  const pad = (n, w = 2) => String(n).padStart(w, "0");
  function theme() {
    const r = cur(), on = r && (r.kind === "alarm" || r.kind === "kid") && r.c1;
    document.documentElement.style.setProperty("--theme", on ? (r.c1 === "#ffd166" ? "#c98c06" : r.c1) : "var(--cran)");
    document.body.classList.toggle("kid", !!G.kid);
    $("#tv").classList.toggle("paused", !!G.paused);
  }
  function mast() {
    const r = cur(), inQ = r && QPHASES.includes(G.phase);
    const mid = r ? `<div class="mast-round"><span class="label">${r.kind === "alarm" ? "SURPRISE ROUND" : r.kind === "kid" ? "KID ROUND" : "NOW PLAYING"}</span><b>${esc(r.title)}</b>
        ${inQ ? `<span class="qn">Question ${G.qi + 1} of ${G.order.length}</span>${toughMeter(toughOf(r, qIndex()), r.mult)}` : ""}</div>`
      : `<div class="mast-round"><span class="label">${G.kid ? "KID MODE" : "TONIGHT ONLY"}</span><b>${G.phase === "lobby" ? "Doors open!" : "Intermission"}</b></div>`;
    return `<div class="sampler"><span class="n1">Rewind</span><span class="n2">Christmas Trivia</span></div>${mid}
      ${G.phase !== "lobby" ? `<div class="join-tag">${qr(joinUrl()) ? `<img src="${qr(joinUrl())}" alt="QR code to join">` : ""}<div class="lines"><span>JOIN AT</span><b>${esc(shortJoin())}</b><span>CODE</span><span class="code">${G.code}</span></div></div>` : ""}`;
  }
  function race(title, withDelta) {
    const ps = sorted().slice(0, 10), top = Math.max(1, ...ps.map(p => p.score));
    const pos = s => (Math.max(0, s) / top) * 100;
    const lanes = ps.map((p, i) => {
      const from = withDelta ? G.roundStart[p.id] ?? 0 : p.score, d = p.score - from;
      return `<li class="lane${i === 0 && p.score > 0 ? " lead" : ""}"><span class="rk">${i + 1}</span>
        <span class="track"><span class="sled" style="--from:${pos(from).toFixed(1)};--to:${pos(p.score).toFixed(1)}">${ornament(pl(p.id))}<span class="sleigh">🛷</span></span></span>
        <span class="nm">${esc(p.name)}${p.streak >= 3 ? ` <i class="hot">❄️${p.streak}</i>` : ""}</span>
        ${withDelta ? `<span class="delta${d < 0 ? " neg" : ""}">${d > 0 ? "+" : ""}${d}</span>` : ""}<span class="sc">${p.score}</span></li>`;
    }).join("");
    return `<div class="race doily"><h2>${esc(title)}</h2><ol>${lanes || `<li class="empty">Nobody here yet. Scan the code to join!</li>`}</ol><div class="finish">🏁 NORTH POLE</div></div>`;
  }
  function vLobby() {
    const ps = sorted(), img = qr(joinUrl());
    return `<section class="lobby">
      <div class="frame"><div class="mat"><p class="script">Scan to join!</p>${img ? `<img src="${img}" alt="QR code to join the game">` : ""}
        <p class="small">${esc(shortJoin())}</p><p class="code-line">CODE <span class="code">${G.code}</span></p></div></div>
      <div class="lobby-side">
        <h1>Pull up a chair, the cocoa’s hot!</h1>
        <p>Scan the code, pick a name and a Christmas face. Every phone is one player.</p>
        <ul class="hanging">${ps.map(p => `<li>${ornament(pl(p.id))}<span>${esc(p.name)}</span></li>`).join("")}</ul>
        <p class="count">${ps.length ? `${ps.length} on the nice list` : "Nobody yet. Be the first!"}</p>
        <div class="lobby-actions"><button class="btn red" data-k="next">Start the show ▶</button><button class="btn" data-k="hostqr">Host controller</button></div>
      </div></section>`;
  }
  function vMenu() {
    const q = G.queue.map(id => byId[id]).filter(Boolean);
    return `<section class="menu">
      <div class="marquee doily"><p class="label">COMING UP NEXT</p>
        ${q.length ? `<ol class="upnext">${q.slice(0, 6).map((r, i) => `<li${i === 0 ? ' class="first"' : ""}><b>${esc(r.title)}</b><span>${esc(r.sub || "")}</span></li>`).join("")}</ol>`
          : `<p class="waiting">The host is picking the next round…</p>`}
        ${G.surprise ? `<p class="hint">Careful: a surprise round could sneak in at any time.</p>` : ""}</div>
      ${race("The Sleigh Race", false)}</section>`;
  }
  function chips(r) {
    return `<div class="chips"><span>⏱ ${timerFor(r)} seconds a question</span><span>🎁 ${G.order.length} questions</span><span>⚡ Faster answers score more</span>${r.mult > 1 ? "<span>✨ Double points</span>" : ""}</div>`;
  }
  function vIntro() {
    const r = cur();
    return `<section class="intro${r.kind === "kid" ? " kid" : ""}">${r.kind === "kid" ? `<div class="rain">${emojiRain(r.emoji, 18)}</div>` : ""}
      <p class="label">${r.kind === "kid" ? "KID ROUND" : r.kind === "media" ? "SPECIAL FEATURE" : "NEXT ROUND"}</p>
      <h1>${esc(r.title)}</h1><p class="script sub">${esc(r.sub || "")}</p>
      ${r.rule ? `<p class="rule doily">${esc(r.rule)}</p>` : ""}${chips(r)}</section>`;
  }
  function vSilly() {
    const r = cur();
    return `<section class="silly"><div class="rain">${emojiRain(r.emoji || "🤪🎄⛄", 24)}</div>
      <h1 class="jiggle">JINGLE JIGGLE!</h1><p class="script">Everybody, right now…</p><p class="dare doily">${esc(G.silly)}</p></section>`;
  }
  function mediaBlock(q) {
    const m = q[4]; if (!m) return "";
    if (m.tune) return `<div class="musicbox"><span class="box">🎶</span><span class="notes"><i>♪</i><i>♫</i><i>♪</i><i>♬</i></span><span class="mb-label">Grandma’s music box is playing…</span></div>`;
    if (m.audio) return `<div class="musicbox"><span class="box">📻</span><span class="notes"><i>♪</i><i>♫</i><i>♪</i><i>♬</i></span><span class="mb-label">Listen closely…</span></div>`;
    return `<div class="media-slot" id="mslot"></div>`;
  }
  function vReady() {
    const r = cur(), q = curQ(), dark = r.dark, m = q[4];
    return `<section class="ready${m ? " has-media" : ""}">
      ${G.qi === G.golden ? `<div class="golden-banner">🌟 GOLDEN ORNAMENT! This one’s worth double! 🌟</div>` : ""}
      ${r.lead && !dark ? `<p class="lead script">${esc(r.lead)}</p>` : ""}
      ${dark ? `<h2 class="qtext dark">Lights out! Look at your phones…</h2>` : m ? "" : `<h2 class="qtext${r.big ? " emoji" : ""}">${esc(q[0])}</h2>`}
      ${mediaBlock(q)}
      <div class="getready"><span>Get ready…</span><i style="animation-duration:${G.readMs}ms"></i></div></section>`;
  }
  function dropOrn(pid, k, gain) {
    const x = G.res && G.res[pid], p = G.players[pid];
    return `<span class="drop" style="animation-delay:${Math.min(k * 70, 1400)}ms">${ornament(pl(pid))}
      ${gain && x ? `<b class="gain">+${x.d}</b>` : ""}${gain && p && p.streak >= 3 ? `<i class="hot">❄️${p.streak}</i>` : ""}${x && x.golden ? `<i class="gold">🌟</i>` : ""}</span>`;
  }
  function vQuestion() {
    const r = cur(), q = curQ(), ph = G.phase, landed = ph === "locked" || ph === "reveal", rev = ph === "reveal", dark = r.dark && !rev;
    const m = q[4], vis = m && (m.img || m.video);
    const counts = [0, 0, 0, 0];
    Object.values(G.ans).forEach(a => counts[a.c]++);
    const big = Math.max(...counts), sz = big > 14 ? "xs" : big > 7 ? "sm" : "";
    const now = G.paused ? G.pausedAt : Date.now();
    const choiceHtml = G.choices.map((c, i) => {
      const who = landed ? Object.entries(G.ans).filter(([pid, a]) => a.c === i && G.players[pid]).sort((a, b) => a[1].t - b[1].t) : [];
      return `<li class="ch ch-${i}${rev ? (i === G.correct ? " right" : " wrong") : ""}">
        <span class="letter">${LETTERS[i]}</span><span class="ctext">${dark ? "• • •" : esc(c)}</span>
        ${rev && i === G.correct ? `<span class="stamp">Ding ding!</span>` : ""}
        ${landed ? `<div class="landed ${sz}">${who.map(([pid], k) => dropOrn(pid, k, rev && i === G.correct)).join("")}</div>` : ""}</li>`;
    }).join("");
    let side;
    if (ph === "question") {
      const el = (now - G.qOpenAt) / 1000;
      side = `<div class="clock"><span class="cap"></span><b id="timer">${Math.max(0, Math.ceil((G.tEnd - now) / 1000))}</b><small>seconds</small></div>
        <div class="cane"><i style="animation-duration:${G.tLimit}s;animation-delay:-${el.toFixed(2)}s"></i></div>`;
    } else side = `<div class="clock done"><span class="cap"></span><b>${rev ? "✓" : "⏰"}</b><small>${rev ? "the answer" : "time’s up!"}</small></div>`;
    return `<section class="listing${vis ? " visual" : ""}">
      <div class="listing-main">
        ${dark ? `<h2 class="qtext dark">Lights out! The question is on your phones.</h2>` : vis ? `<h2 class="qtext small">${esc(q[0])}</h2>` : `<h2 class="qtext${r.big ? " emoji" : ""}${q[0].length > 110 ? " long" : ""}">${esc(q[0])}</h2>`}
        ${m ? mediaBlock(q) : ""}
        <ol class="choices">${choiceHtml}</ol>
        ${rev && q[3] ? `<p class="note">${esc(q[3])}</p>` : ""}
        ${rev ? revealExtras(r) : ""}
      </div>
      <aside class="listing-side">${side}
        <div class="stat"><b id="nAns">${Object.keys(G.ans).length}</b><span>of ${Object.keys(G.players).length} answered</span></div>
        ${G.qi === G.golden ? `<div class="golden-tag">🌟<span>Golden ornament<br>double points</span></div>` : ""}
      </aside></section>`;
  }
  function names(ids) { return ids.map(id => G.players[id] && esc(G.players[id].name)).filter(Boolean).join(", "); }
  function revealExtras(r) {
    const res = G.res || {};
    const ok = Object.keys(res).filter(id => res[id].ok), bad = Object.keys(res).filter(id => !res[id].ok && res[id].c >= 0);
    const fastest = ok.slice().sort((a, b) => G.ans[a].t - G.ans[b].t)[0];
    let out = `<p class="who">${ok.length ? `Quickest elf: <b>${names([fastest])}</b> (+${res[fastest].d})` : "Nobody got this one! Bah, humbug."}</p>`;
    const first = Object.keys(res).find(id => res[id].first);
    if (first) out += `<p class="who">Turbo bonus: <b>${names([first])}</b> +${res[first].first}</p>`;
    const robbed = Object.keys(res).find(id => res[id].robbed);
    if (robbed) out += `<p class="who miss">The Grinch stole <b>${res[robbed].robbed}</b> from <b>${names([robbed])}</b></p>`;
    const hot = ok.filter(id => res[id].streak >= 3);
    if (hot.length) out += `<p class="who">❄️ Snowball streak: <b>${hot.map(id => `${esc(G.players[id].name)} ×${res[id].streak}`).join(", ")}</b></p>`;
    if (r.squirrel && bad.length) out += `<p class="who miss">Yell SQUIRREL: <b>${names(bad)}</b></p>`;
    else if (r.wrong && bad.length) out += `<p class="who miss">Lose ${r.wrong}: <b>${names(bad)}</b></p>`;
    return out;
  }
  function vRoundEnd() {
    const r = cur();
    return `<section class="roundend"><div class="wrap"><p class="label">THAT’S A WRAP ON</p><h1>${esc(r.title)}</h1>
      <p class="script">${G.queue.length ? "Next up: " + esc(byId[G.queue[0]] ? byId[G.queue[0]].title : "") : "Stretch your legs, refill the eggnog!"}</p></div>${race("The Sleigh Race", true)}</section>`;
  }
  function vAlarm() {
    const r = cur(), revealed = !G.alarmAt || Date.now() - G.alarmAt > 2200;
    return `<div class="alarm" data-fx="${esc(r.fx)}" style="--fx-a:${r.c1};--fx-b:${r.c2};--fx-ink:${r.ink || "#fff"}">
      <div class="beacon"></div><div class="rain">${emojiRain(r.emoji, 30)}</div>
      <div class="alarm-inner">${!revealed
        ? `<div class="uhoh">UH OH…</div><div class="alarm-line">${esc(r.alarm)}</div>`
        : `<div class="uhoh small">UH OH…</div><div class="itsa">it’s a</div><h1 class="alarm-title">${esc(r.title.toUpperCase())}!</h1>
           <p class="tagline">${esc(r.tagline)}</p>
           <div class="alarm-cards"><p><b>House rule</b>${esc(r.rule)}</p></div>`}
      </div></div>`;
  }
  function overlay() {
    let html = "";
    if (G.phase === "alarm" && cur()) html += vAlarm();
    if (G.showScores) html += `<div class="modal"><div class="modal-card">${race("The Sleigh Race", false)}</div></div>`;
    if (G.paused) html += `<div class="pause-card doily"><b>Paused</b><span>Go grab a cookie. We’ll wait.</span></div>`;
    if (showHostQr) html += `<div class="modal" data-k="closeqr"><div class="modal-card doily"><h2>Host controller</h2>
      <p>Scan this with <b>your</b> phone. Keep it away from the guests: it has the host PIN.</p>
      ${qr(hostUrl()) ? `<img src="${qr(hostUrl())}" alt="QR code for the host controller">` : ""}
      <p class="small">Game ${G.code} · PIN ${G.pin}</p><button class="btn" data-k="closeqr">Close</button></div></div>`;
    return html;
  }
  function trayHtml() {
    if (!["ready", "question"].includes(G.phase)) return "";
    const ps = sorted();
    return ps.map(p => `<span class="t-item${G.ans[p.id] ? " in" : ""}">${ornament(pl(p.id))}<span>${esc(p.name)}</span></span>`).join("");
  }
  let showHostQr = false, resetArmed = false, resetT = 0, soundOn = false;
  const last = {};
  function put(sel, html) { if (last[sel] === html) return false; last[sel] = html; $(sel).innerHTML = html; return true; }
  function renderTray() {
    put("#tray", trayHtml()); $("#tray").hidden = !last["#tray"];
    const n = $("#nAns"); if (n) n.textContent = Object.keys(G.ans).length;
  }
  function renderChip() {
    const el = $("#chip"); if (!el) return;
    let t = "";
    if (G.paused) t = "⏸ Paused";
    else if (G.stepAt && G.auto && !["ready", "question"].includes(G.phase)) { const s = Math.ceil((G.stepAt - Date.now()) / 1000); if (s > 0) t = `▶ Autopilot · next in ${s}`; }
    else if (!G.auto && ["locked", "reveal", "intro", "alarm", "silly", "roundend"].includes(G.phase)) t = "Waiting for the host";
    if (el.textContent !== t) { el.textContent = t; el.hidden = !t; }
  }
  function renderFoot() {
    const hostOn = Date.now() - hostSeen < 12000;
    put("#foot", `<span><span class="dot${netOk ? " on" : ""}"></span>${netOk ? "Online" : "Connecting…"}</span>
      <span>Game ${G.code}</span><span>${Object.keys(G.players).length} players</span>
      <span><span class="dot${hostOn ? " on" : ""}"></span>${hostOn ? "Host phone connected" : "No host phone"}</span>
      ${G.kid ? "<span>🧸 Kid mode</span>" : ""}
      ${location.protocol === "file:" ? `<span class="warn">Opened from a file: phones can’t join until this is on the web</span>` : ""}
      <span class="right"><span>Space next · ← back · P pause · S scores · A surprise</span>
      <button data-k="hostqr">Host QR</button><button data-k="mute">${SFX.muted ? "Sound off" : "Sound on"}</button>
      <button data-k="reset">${resetArmed ? "Click again: new game" : "New game"}</button></span>`);
  }
  function render() {
    theme();
    put("#mast", mast());
    const r = cur();
    const v = { lobby: vLobby, menu: vMenu, intro: vIntro, alarm: vIntro, silly: vSilly, ready: vReady, question: vQuestion, locked: vQuestion, reveal: vQuestion, roundend: vRoundEnd }[G.phase] || vLobby;
    put("#stage", r || G.phase === "lobby" || G.phase === "menu" ? v() : vLobby());
    attachMedia();
    renderTray();
    put("#overlay", overlay());
    renderFoot(); renderChip();
  }

  /* ---------- local controls ---------- */
  function act(k) {
    switch (k) {
      case "next": next(); break;
      case "prev": prev(); break;
      case "alarm": surpriseNow(); break;
      case "scores": G.showScores = !G.showScores; break;
      case "pause": setPaused(!G.paused); break;
      case "hostqr": showHostQr = !showHostQr; break;
      case "closeqr": showHostQr = false; break;
      case "mute": SFX.setMuted(!SFX.muted); break;
      case "reset":
        if (!resetArmed) { resetArmed = true; clearTimeout(resetT); resetT = setTimeout(() => { resetArmed = false; renderFoot(); }, 4000); renderFoot(); return; }
        resetArmed = false; stopMedia(); G = fresh(); photos = {}; savePhotos(); save(); connect(); break;
      default: return;
    }
    arm(); save(); render(); publish();
  }
  function unlockSound() { if (!soundOn) { soundOn = SFX.unlock(); $("#soundBanner").hidden = true; } }
  document.addEventListener("click", e => {
    unlockSound();
    const b = e.target.closest("[data-k]");
    if (b) act(b.dataset.k);
  });
  document.addEventListener("keydown", e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    unlockSound();
    const map = { " ": "next", Enter: "next", ArrowRight: "next", PageDown: "next", ArrowLeft: "prev", PageUp: "prev", a: "alarm", A: "alarm", s: "scores", S: "scores", p: "pause", P: "pause", h: "hostqr", H: "hostqr", m: "mute", M: "mute", Escape: "closeqr" };
    const k = map[e.key];
    if (!k) return;
    if (document.activeElement && document.activeElement.matches("button") && (e.key === " " || e.key === "Enter")) return;
    e.preventDefault(); act(k);
  });

  $("#lightsTop").innerHTML = stringLights(28);
  connect();
  probeMedia();
  render();
})();
