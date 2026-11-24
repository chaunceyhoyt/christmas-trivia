/* Big screen: the game's source of truth. It keeps players, answers and scores, runs the autopilot,
   broadcasts state to phones, and takes commands from the host controller over a PIN-named channel. */
(() => {
  const R = window.ROUNDS, byId = Object.fromEntries(R.map(r => [r.id, r]));
  const $ = s => document.querySelector(s);
  const KEY = "xmas-screen-v2", PKEY = "xmas-photos-v2", LETTERS = "ABCD";
  /* How long the autopilot holds each screen (ms). */
  const HOLD = { intro: 8000, alarm: 11000, land: 3200, reveal: 8000, note: 2500, roundend: 14000, silly: 16000, drawpick: 25000 };
  /* Phases that always move on by themselves when their clock runs out, even with the autopilot off. */
  const TIMED = ["ready", "question", "drawpick", "drawing", "finale", "gifpick", "gifvote", "fibwrite", "fibvote"];
  const GIFKEY = (window.TRIVIA_CONFIG && TRIVIA_CONFIG.giphyKey) || "";
  const giphyUrl = u => typeof u === "string" && /^https:\/\/(media\d*|i)\.giphy\.com\/[\w\-./?=&%]+$/.test(u) && u.length < 400;
  const QPHASES = ["ready", "question", "locked", "reveal"];

  /* ---------- state ---------- */
  function code4() { const A = "ABCDEFGHJKLMNPQRSTUVWXYZ"; return Array.from({ length: 4 }, () => A[Math.floor(Math.random() * A.length)]).join(""); }
  function fresh() {
    return { code: code4(), pin: String(Math.floor(1000 + Math.random() * 9000)), players: {}, kicked: [], played: [],
      rid: null, order: [], qi: 0, phase: "lobby", choices: [], correct: -1, ans: {}, res: null, scored: {},
      tEnd: 0, tLimit: 20, qOpenAt: 0, readMs: 0, stepAt: 0, epoch: 0, golden: -1, silly: "",
      showScores: false, roundStart: {}, alarmAt: 0, queue: [], auto: true, surprise: false, kid: false,
      paused: false, pausedAt: 0, lastKind: "", hold: false, breakSec: 20, drawings: {}, drawSeq: 0, stats: {}, finale: null, gif: null, fib: null };
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
  const curQ = () => {
    const r = cur(); if (!r) return null;
    if (r.kind !== "draw") return r.qs[qIndex()];
    const pid = qIndex(), d = G.drawings[pid]; if (!d) return null;
    const who = G.players[pid] ? G.players[pid].name : "Someone";
    return [`What movie did ${who} draw?`, d.opts[d.pick], d.decoys, "", { draw: pid }];
  };
  const artistNow = () => { const r = cur(); return r && r.kind === "draw" ? qIndex() : ""; };
  const toughOf = (r, i) => +((r.tough || "")[i]) || 2;
  const timerFor = r => (G.kid ? Math.max(30, r.timer || 20) : r.timer || 20);
  const sorted = () => Object.entries(G.players).map(([id, p]) => ({ id, ...p })).sort((a, b) => b.score - a.score || a.at - b.at);
  const pl = id => { const p = G.players[id]; return p ? { id, av: p.av, photo: p.ph && photos[id] ? photos[id] : "" } : { id }; };
  const active = () => Object.keys(G.players).filter(id => Date.now() - (G.players[id].seen || 0) < 45000 && id !== artistNow());

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
    main = Net.open(room, { join: onJoin, answer: onAnswer, photo: onPhoto, drawpick: onDrawPick, drawing: onDrawing, gifsub: onGifSub, gifvote: onGifVote, fibsub: onFibSub, fibvote: onFibVote, hello: p => { seen(p && p.pid); publish(); } },
      s => { netOk = s === "SUBSCRIBED"; if (netOk) publish(); renderFoot(); });
    host = Net.open(room + "-" + G.pin, { cmd: onCmd, hello: () => { hostSeen = Date.now(); renderFoot(); publish(); } }, s => { if (s === "SUBSCRIBED") publish(); });
  }
  function seen(pid) { if (pid && G.players[pid]) G.players[pid].seen = Date.now(); }
  function onJoin(p) {
    if (!p || typeof p.pid !== "string") return;
    const pid = p.pid.slice(0, 40), name = String(p.name || "").trim().slice(0, 24);
    if (!name) return;
    /* A removed player can come back, but only by tapping "Join again" on their phone. */
    if (G.kicked.includes(pid)) { if (!p.again) return; G.kicked = G.kicked.filter(x => x !== pid); }
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
  function onDrawPick(p) {
    const d = p && G.drawings[p.pid];
    if (!d || G.phase !== "drawpick" || p.seq !== G.drawSeq) return;
    const i = p.i | 0; if (i < 0 || i > 2) return;
    d.pick = i; seen(p.pid); lastAnsAt = Date.now(); save(); renderTray(); publish();
  }
  function onDrawing(p) {
    const d = p && G.drawings[p.pid];
    if (!d || p.seq !== G.drawSeq || !["drawing", "drawpick"].includes(G.phase) || !Array.isArray(p.s)) return;
    let pts = 0;
    const strokes = p.s.slice(0, 600).map(x => ({ c: Math.max(0, Math.min(PALETTE.length - 1, x.c | 0)), w: Math.max(0, Math.min(BRUSH.length - 1, x.w | 0)),
      p: Array.isArray(x.p) ? x.p.slice(0, 4000).map(v => Math.max(0, Math.min(1000, v | 0))) : [] })).filter(x => x.p.length >= 2 && (pts += x.p.length) < 24000);
    d.strokes = strokes; if (d.pick < 0) d.pick = 0;
    seen(p.pid); save(); renderTray(); publish();
  }
  function onGifSub(p) {
    const g = G.gif;
    if (!p || !g || !G.players[p.pid] || G.phase !== "gifpick" || p.seq !== g.seq || p.pi !== g.pi || !p.gif) return;
    const x = p.gif; if (!giphyUrl(x.s) || !giphyUrl(x.b)) return;
    g.subs[p.pid] = { s: x.s, b: x.b, cap: String(p.cap || "").trim().slice(0, 80), at: Date.now() };
    seen(p.pid); lastAnsAt = Date.now(); save(); renderTray(); publish();
  }
  function onGifVote(p) {
    const g = G.gif;
    if (!p || !g || !G.players[p.pid] || G.phase !== "gifvote" || p.seq !== g.seq || p.pi !== g.pi) return;
    if (!g.subs[p.for] || p.for === p.pid) return;
    g.votes[p.pid] = p.for; seen(p.pid); lastAnsAt = Date.now(); save(); renderTray(); publish();
  }
  /* Simplified text for comparing answers: lowercase letters and digits only, no leading "the/a/an". */
  const norm = t => String(t || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, "").replace(/^(the|a|an) /, "").replace(/\s+/g, " ").trim();
  function onFibSub(p) {
    const f = G.fib;
    if (!p || !f || !G.players[p.pid] || G.phase !== "fibwrite" || p.seq !== f.seq || p.pi !== f.pi) return;
    const t = String(p.t || "").replace(/\s+/g, " ").trim().slice(0, 40); if (!t) return;
    const n = norm(t), truth = norm(f.prompts[f.pi].a);
    if (!n) return;
    if (n === truth || (truth.length > 3 && (n.includes(truth) || truth.includes(n) && n.length > 3))) { f.oops[p.pid] = Date.now(); delete f.subs[p.pid]; }
    else { f.subs[p.pid] = { t, n }; delete f.oops[p.pid]; }
    seen(p.pid); lastAnsAt = Date.now(); save(); renderTray(); publish();
  }
  function onFibVote(p) {
    const f = G.fib;
    if (!p || !f || !G.players[p.pid] || G.phase !== "fibvote" || p.seq !== f.seq || p.pi !== f.pi) return;
    const o = f.opts[p.i | 0]; if (!o || o.authors.includes(p.pid)) return;
    f.votes[p.pid] = p.i | 0; seen(p.pid); lastAnsAt = Date.now(); save(); renderTray(); publish();
  }
  function onAnswer(p) {
    if (!p || !G.players[p.pid] || G.phase !== "question" || G.paused || p.epoch !== G.epoch || p.pid === artistNow()) return;
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
      case "finale": startFinale(); break;
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
      case "menu": toMenu(); G.hold = true; G.stepAt = 0; break;
      case "breakSec": G.breakSec = Math.max(5, Math.min(600, m.s | 0)); arm(true); break;
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
      tLeft: ["question", "drawing", "gifpick", "gifvote", "fibwrite", "fibvote"].includes(G.phase) && G.tEnd ? Math.max(0, G.tEnd - pausedNow) : 0, tLimit: G.tLimit,
      stepLeft: G.stepAt ? Math.max(0, G.stepAt - pausedNow) : 0,
      answered: Object.keys(G.ans),
      players: sorted().map(p => ({ id: p.id, name: p.name, score: p.score, av: p.av, ph: p.ph || "", streak: p.streak || 0 })),
      reveal: G.phase === "reveal" ? { correct: G.correct, note: q[3] || "", res: G.res, counts } : null,
      silly: G.phase === "silly" ? G.silly : "",
      finale: G.phase === "finale" && G.finale ? { k: G.finale.k, award: (G.finale.k || "").startsWith("award") ? G.finale.awards[+G.finale.k.slice(5)] : null, mine: (G.finale.awards || []).map(a => ({ pid: a.pid, title: a.title, e: a.e })) } : null,
      gif: r && r.kind === "gif" && G.gif ? { seq: G.gif.seq, pi: G.gif.pi, n: G.gif.prompts.length, prompt: G.gif.prompts[G.gif.pi] || "",
        rating: G.kid ? "g" : "pg", done: Object.keys(G.gif.subs), voted: Object.keys(G.gif.votes),
        cards: G.phase === "gifvote" || G.phase === "gifresult" ? G.gif.order.map(k => ({ pid: k, s: G.gif.subs[k].s, cap: G.gif.subs[k].cap })) : null,
        res: G.phase === "gifresult" ? G.gif.res : null } : null,
      fib: r && r.kind === "fib" && G.fib ? { seq: G.fib.seq, pi: G.fib.pi, n: G.fib.prompts.length, q: (G.fib.prompts[G.fib.pi] || {}).q || "",
        done: Object.keys(G.fib.subs), voted: Object.keys(G.fib.votes), oops: Object.keys(G.fib.oops),
        opts: G.phase === "fibvote" || G.phase === "fibresult" ? G.fib.opts.map(o => ({ t: o.t, authors: o.authors, real: G.phase === "fibresult" ? !!o.real : undefined, house: G.phase === "fibresult" ? !!o.house : undefined })) : null,
        res: G.phase === "fibresult" ? G.fib.res : null } : null,
      kicked: G.kicked.slice(-60), hold: G.hold, breakSec: G.breakSec,
      draw: r && r.kind === "draw" ? { seq: G.drawSeq, sec: drawSecs(r), artist: artistNow(),
        opts: G.phase === "drawpick" || G.phase === "drawing" ? Object.fromEntries(Object.entries(G.drawings).map(([k, d]) => [k, d.opts])) : null,
        picks: Object.fromEntries(Object.entries(G.drawings).map(([k, d]) => [k, d.pick])),
        done: Object.keys(G.drawings).filter(k => G.drawings[k].strokes) } : null,
      next: G.queue.slice(0, 3).map(id => byId[id] ? byId[id].title : ""),
      alarmAge: G.phase === "alarm" && G.alarmAt ? now - G.alarmAt : 99999
    };
    main.send("state", s);
    host.send("hoststate", Object.assign({}, s, {
      secret: q ? { answer: G.correct >= 0 ? G.choices[G.correct] : q[1], correct: G.correct, note: q[3] || "", q: q[0], choices: G.choices, ans: G.ans } : null,
      rounds: R.map(x => ({ id: x.id, title: x.title, kind: x.kind, n: x.kind === "draw" || x.kind === "fib" ? 1 : x.kind === "gif" ? (GIFKEY ? 1 : 0) : playable(x).length, total: x.qs.length, played: G.played.includes(x.id),
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

  const drawSecs = r => (G.kid ? Math.max(120, r.drawSec || 90) : r.drawSec || 90);
  function pick(id) {
    const r = byId[id]; if (!r) return;
    if (r.kind === "draw") return startDraw(r);
    if (r.kind === "gif") return startGif(r);
    if (r.kind === "fib") return startFib(r);
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
  /* Draw the Halls: everybody gets three movies, picks one and draws it. Then the drawings become questions. */
  function startDraw(r) {
    const ps = active().length ? active() : Object.keys(G.players);
    if (!ps.length) return;
    stopMedia();
    let pool = shuffle(DRAW_PROMPTS.filter(x => !G.kid || x.kid).map(x => x.t));
    const drawings = {};
    ps.forEach(pid => {
      if (pool.length < 3) pool = shuffle(DRAW_PROMPTS.map(x => x.t));
      drawings[pid] = { opts: pool.splice(0, 3), pick: -1, strokes: null };
    });
    G.rid = r.id; G.order = []; G.qi = 0; G.golden = -1; G.ans = {}; G.res = null; G.tEnd = 0; G.showScores = false; G.hold = false;
    G.drawings = drawings; G.drawSeq++;
    G.queue = G.queue.filter(x => x !== r.id);
    if (!G.played.includes(r.id)) G.played.push(r.id);
    G.roundStart = Object.fromEntries(Object.entries(G.players).map(([k, p]) => [k, p.score]));
    G.lastKind = r.kind;
    G.phase = "drawpick"; G.stepAt = Date.now() + HOLD.drawpick; SFX.play("round_intro");
  }
  /* GIF Wrapped: a few prompts; for each, everyone picks a Christmas GIF, then everyone votes. */
  const gifSecs = (r, k) => (G.kid ? Math.max(k === "pickSec" ? 90 : 35, r[k]) : r[k]);
  function startGif(r) {
    if (!GIFKEY) return;
    stopMedia();
    const prompts = shuffle(GIF_PROMPTS.filter(x => !G.kid || x.kid).map(x => x.t)).slice(0, r.prompts || 4);
    G.rid = r.id; G.order = []; G.qi = 0; G.golden = -1; G.ans = {}; G.res = null; G.tEnd = 0; G.showScores = false; G.hold = false;
    G.gif = { seq: (G.gif ? G.gif.seq : 0) + 1, prompts, pi: -1, subs: {}, votes: {}, order: [], res: null };
    G.queue = G.queue.filter(x => x !== r.id);
    if (!G.played.includes(r.id)) G.played.push(r.id);
    G.roundStart = Object.fromEntries(Object.entries(G.players).map(([k, p]) => [k, p.score]));
    G.lastKind = r.kind;
    G.phase = "intro"; G.stepAt = Date.now() + HOLD.intro; SFX.play("round_intro");
  }
  function gifOpen() {
    const r = cur(), g = G.gif;
    g.pi++; g.subs = {}; g.votes = {}; g.order = []; g.res = null; G.qi = g.pi;
    G.phase = "gifpick"; G.tLimit = gifSecs(r, "pickSec"); G.tEnd = Date.now() + G.tLimit * 1000; G.stepAt = G.tEnd + 2500; lastSec = -1;
    SFX.play("question");
  }
  function gifToVote() {
    const r = cur(), g = G.gif;
    g.order = shuffle(Object.keys(g.subs).filter(k => G.players[k]));
    if (g.order.length < 2) return gifResult();
    G.phase = "gifvote"; G.tLimit = gifSecs(r, "voteSec"); G.tEnd = Date.now() + G.tLimit * 1000; G.stepAt = G.tEnd; lastSec = -1;
    SFX.play("question");
  }
  function gifResult() {
    const r = cur(), g = G.gif;
    if (!g.order.length) g.order = Object.keys(g.subs).filter(k => G.players[k]);
    const count = {}; g.order.forEach(k => { count[k] = 0; });
    Object.values(g.votes).forEach(k => { if (k in count) count[k]++; });
    const top = Math.max(0, ...Object.values(count));
    const res = {};
    g.order.forEach(k => { const best = top > 0 && count[k] === top; res[k] = { votes: count[k], best, d: count[k] * (r.perVote || 100) + (best ? r.best || 200 : 0) }; });
    Object.entries(res).forEach(([k, x]) => { G.players[k].score += x.d; st(k).laughs = (st(k).laughs || 0) + x.votes; });
    g.res = res; G.phase = "gifresult"; G.tEnd = 0; G.stepAt = Date.now() + 12000;
    SFX.play("correct"); if (top > 0) SFX.play("award", 0.8);
  }
  /* Fa-La-La Lies: everyone writes a fake answer, then everyone hunts for the truth among the fakes. */
  const fibSecs = (r, k) => (G.kid ? Math.max(k === "writeSec" ? 90 : 35, r[k]) : r[k]);
  function startFib(r) {
    stopMedia();
    const prompts = shuffle(FIB_PROMPTS.filter(x => !G.kid || x.kid)).slice(0, r.prompts || 4);
    G.rid = r.id; G.order = []; G.qi = 0; G.golden = -1; G.ans = {}; G.res = null; G.tEnd = 0; G.showScores = false; G.hold = false;
    G.fib = { seq: (G.fib ? G.fib.seq : 0) + 1, prompts, pi: -1, subs: {}, oops: {}, opts: [], votes: {}, res: null };
    G.queue = G.queue.filter(x => x !== r.id);
    if (!G.played.includes(r.id)) G.played.push(r.id);
    G.roundStart = Object.fromEntries(Object.entries(G.players).map(([k, p]) => [k, p.score]));
    G.lastKind = r.kind;
    G.phase = "intro"; G.stepAt = Date.now() + HOLD.intro; SFX.play("round_intro");
  }
  function fibOpen() {
    const r = cur(), f = G.fib;
    f.pi++; f.subs = {}; f.oops = {}; f.opts = []; f.votes = {}; f.res = null; G.qi = f.pi;
    G.phase = "fibwrite"; G.tLimit = fibSecs(r, "writeSec"); G.tEnd = Date.now() + G.tLimit * 1000; G.stepAt = G.tEnd + 2500; lastSec = -1;
    SFX.play("question");
  }
  function fibToVote() {
    const r = cur(), f = G.fib, P = f.prompts[f.pi];
    const opts = [{ t: P.a, real: true, authors: [] }], byNorm = {};
    Object.entries(f.subs).forEach(([pid, x]) => {
      if (!G.players[pid]) return;
      if (byNorm[x.n]) byNorm[x.n].authors.push(pid);
      else { byNorm[x.n] = { t: x.t, authors: [pid] }; opts.push(byNorm[x.n]); }
    });
    const taken = new Set(opts.map(o => norm(o.t)));
    for (const h of shuffle(P.h.slice())) { if (opts.length >= 4) break; if (!taken.has(norm(h))) { opts.push({ t: h, house: true, authors: [] }); taken.add(norm(h)); } }
    f.opts = shuffle(opts);
    G.phase = "fibvote"; G.tLimit = fibSecs(r, "voteSec"); G.tEnd = Date.now() + G.tLimit * 1000; G.stepAt = G.tEnd; lastSec = -1;
    SFX.play("question");
  }
  function fibResult() {
    const r = cur(), f = G.fib, res = {};
    const x = pid => (res[pid] = res[pid] || { d: 0, truth: false, fooled: 0, fell: -1 });
    Object.entries(f.votes).forEach(([voter, i]) => {
      const o = f.opts[i]; if (!o || !G.players[voter]) return;
      if (o.real) { x(voter).truth = true; x(voter).d += r.truth || 300; }
      else { x(voter).fell = i; o.authors.forEach(a => { if (G.players[a]) { x(a).fooled++; x(a).d += r.fooled || 150; } }); }
    });
    Object.entries(res).forEach(([pid, v]) => { G.players[pid].score += v.d; st(pid).fibs = (st(pid).fibs || 0) + v.fooled; });
    f.res = res; G.phase = "fibresult"; G.tEnd = 0; G.stepAt = Date.now() + 13000;
    SFX.play("correct");
  }
  function fibAfter() { const f = G.fib; if (f.pi + 1 < f.prompts.length) fibOpen(); else endRound(); }
  function gifAfter() { const g = G.gif; if (g.pi + 1 < g.prompts.length) gifOpen(); else endRound(); }
  function startDrawing() {
    const r = cur();
    Object.values(G.drawings).forEach(d => { if (d.pick < 0) d.pick = Math.floor(Math.random() * 3); });
    G.phase = "drawing"; G.tLimit = drawSecs(r); G.tEnd = Date.now() + G.tLimit * 1000; G.stepAt = G.tEnd + 4000; lastSec = -1;
    SFX.play("question");
  }
  function startGuessing() {
    const all = DRAW_PROMPTS.map(x => x.t);
    Object.values(G.drawings).forEach(d => {
      const others = d.opts.filter((_, i) => i !== d.pick);
      const extra = shuffle(all.filter(t => !d.opts.includes(t)))[0];
      d.decoys = [...others, extra];
    });
    G.order = shuffle(Object.keys(G.drawings).filter(k => G.drawings[k].strokes && G.drawings[k].strokes.length && G.players[k]));
    G.qi = 0; G.tEnd = 0;
    if (!G.order.length) return endRound();
    openReady();
  }
  function surpriseNow(id) {
    let r = id && byId[id];
    if (!r) { let pool = surprisePool(); if (!pool.length) pool = R.filter(x => x.kind === (G.kid ? "kid" : "alarm")); r = pool[Math.floor(Math.random() * pool.length)]; }
    if (r) pick(r.id);
  }
  function startFromQueue() {
    const pool = surprisePool();
    if (G.surprise && pool.length && G.lastKind !== "alarm" && Math.random() < 0.3) return pick(pool[Math.floor(Math.random() * pool.length)].id);
    while (G.queue.length) { const id = G.queue[0]; if (byId[id] && (byId[id].kind === "draw" || byId[id].kind === "fib" || (byId[id].kind === "gif" && GIFKEY) || playable(byId[id]).length)) return pick(id); G.queue.shift(); }
    const f = defaultPool()[0]; if (f) pick(f.id);
  }
  function openReady() {
    const r = cur(), q = curQ();
    Object.assign(G, makeChoices(r, q));
    G.ans = {}; G.res = null; G.phase = "ready"; G.epoch++; G.tEnd = 0;
    const m = q[4] || {}, words = String(q[0]).split(/\s+/).length;
    G.readMs = m.draw ? 4500 : m.tune || m.audio || m.video ? 1800 : Math.min(6500, Math.max(2500, 1200 + words * 230)) + (G.kid ? 1500 : 0);
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
    const r = cur(), qi = qIndex(), q = curQ(), key = r.id + ":" + (r.kind === "draw" ? G.drawSeq + ":" : "") + qi, artist = artistNow();
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
      if (pid === artist) return;
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
    if (artist && G.players[artist]) {
      const fans = Object.values(res).filter(x => x.ok).length;
      res[artist] = { c: -1, ok: false, d: fans * (r.artist || 100), artist: fans };
    }
    const deltas = {};
    Object.entries(res).forEach(([pid, x]) => { if (r.kind === "kid") x.d = Math.max(0, x.d); G.players[pid].score += x.d; deltas[pid] = x.d; });
    if (!prev) tally(res, artist);
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
      case "lobby": case "menu": G.hold = false; startFromQueue(); if (G.phase === "lobby") toMenu(); break;
      case "intro": if (cur() && cur().kind === "gif") gifOpen(); else if (cur() && cur().kind === "fib") fibOpen(); else openReady(); break;
      case "fibwrite": fibToVote(); break;
      case "fibvote": fibResult(); break;
      case "fibresult": fibAfter(); break;
      case "alarm": case "silly": openReady(); break;
      case "gifpick": gifToVote(); break;
      case "gifvote": gifResult(); break;
      case "gifresult": gifAfter(); break;
      case "drawpick": startDrawing(); break;
      case "drawing": startGuessing(); break;
      case "finale": finaleNext(); break;
      case "ready": openQuestion(); break;
      case "question": lock(); break;
      case "locked": reveal(); break;
      case "reveal": advanceQ(); break;
      case "roundend": toMenu(); break;
    }
  }
  function prev() {
    const r = cur(); if (!r) { if (G.phase === "menu") { G.phase = "lobby"; G.stepAt = 0; } return; }
    if (QPHASES.includes(G.phase) && r.kind === "draw" && G.qi === 0 && (G.phase === "ready" || G.phase === "question")) { stopMedia(); startDrawing(); }
    else if (QPHASES.includes(G.phase)) {
      if (G.phase !== "ready" && G.phase !== "question") openReady();
      else if (G.qi > 0) { G.qi--; openReady(); }
      else { stopMedia(); G.phase = r.kind === "alarm" ? "alarm" : "intro"; G.alarmAt = 0; G.tEnd = 0; G.stepAt = Date.now() + HOLD.intro; }
    } else if (G.phase === "silly") openReady();
    else if (G.phase === "roundend") { G.qi = G.order.length - 1; openReady(); }
    else if (G.phase === "intro" || G.phase === "alarm" || G.phase === "drawpick" || G.phase.startsWith("gif") || G.phase.startsWith("fib")) toMenu();
    else if (G.phase === "drawing") { G.phase = "drawpick"; G.tEnd = 0; G.stepAt = Date.now() + HOLD.drawpick; }
  }
  /* Running totals for the finale awards. */
  const st = pid => (G.stats[pid] = G.stats[pid] || { a: 0, ok: 0, wr: 0, bl: 0, t: 0, best: 0, gold: 0, fans: 0, lost: 0, quick: 0, round: 0 });
  function tally(res, artist) {
    const fastest = Object.keys(res).filter(id => res[id].ok).sort((a, b) => G.ans[a].t - G.ans[b].t)[0];
    Object.keys(G.players).forEach(pid => {
      if (pid === artist) { st(pid).fans += (res[pid] && res[pid].artist) || 0; return; }
      const x = res[pid], s = st(pid);
      if (!x || x.c < 0) { s.bl++; if (x && x.robbed) s.lost += x.robbed; return; }
      s.a++; s.t += Math.max(0, G.ans[pid].t - G.qOpenAt);
      if (x.ok) { s.ok++; if (x.golden) s.gold++; } else s.wr++;
      s.best = Math.max(s.best, G.players[pid].streak || 0);
      s.lost += (x.lost || 0) + (x.robbed || 0);
    });
    if (fastest) st(fastest).quick++;
  }
  function endRound() {
    stopMedia();
    Object.entries(G.players).forEach(([pid, p]) => { const s = st(pid); s.round = Math.max(s.round, p.score - (G.roundStart[pid] ?? p.score)); });
    G.phase = "roundend"; G.tEnd = 0; G.stepAt = Date.now() + HOLD.roundend;
    SFX.play("round_end");
  }
  /* ---------- Finale ceremony: silly awards, then the podium ---------- */
  function makeAwards() {
    const ids = Object.keys(G.players), S = id => st(id), nm = n => n === 1 ? "" : "s";
    const avg = id => (S(id).a ? S(id).t / S(id).a / 1000 : 99);
    const defs = [
      { e: "🧝", title: "The Quickest Elf", pick: () => ids.filter(id => S(id).a >= 3).sort((a, b) => avg(a) - avg(b))[0], line: id => `Answered in ${avg(id).toFixed(1)} seconds on average. Buddy would be proud.` },
      { e: "❄️", title: "Snowball Fight Champion", pick: () => ids.filter(id => S(id).best >= 3).sort((a, b) => S(b).best - S(a).best)[0], line: id => `${S(id).best} right answers in a row. That snowball got huge.` },
      { e: "💡", title: "The Clark Griswold", pick: () => ids.filter(id => S(id).round > 0).sort((a, b) => S(b).round - S(a).round)[0], line: id => `+${S(id).round} points in one round. Lit up the whole neighborhood.` },
      { e: "🌟", title: "Golden Ornament Collector", pick: () => ids.filter(id => S(id).gold > 0).sort((a, b) => S(b).gold - S(a).gold)[0], line: id => `Nailed ${S(id).gold} golden ornament question${nm(S(id).gold)}.` },
      { e: "🤣", title: "The Jester of Whoville", pick: () => ids.filter(id => S(id).laughs > 0).sort((a, b) => S(b).laughs - S(a).laughs)[0], line: id => `${S(id).laughs} vote${nm(S(id).laughs)} for the funniest GIF. The Whos are still laughing.` },
      { e: "🤥", title: "The Bad Santa", pick: () => ids.filter(id => S(id).fibs > 0).sort((a, b) => S(b).fibs - S(a).fibs)[0], line: id => `Fooled ${S(id).fibs} ${S(id).fibs === 1 ? "person" : "people"} with made-up answers. Shameless.` },
      { e: "🎨", title: "The Picasso Elf", pick: () => ids.filter(id => S(id).fans > 0).sort((a, b) => S(b).fans - S(a).fans)[0], line: id => `${S(id).fans} correct guess${S(id).fans === 1 ? "" : "es"} on their drawing. Straight to the fridge.` },
      { e: "🚐", title: "The Cousin Eddie", pick: () => ids.filter(id => S(id).wr >= 3).sort((a, b) => S(b).wr - S(a).wr)[0], line: id => `${S(id).wr} wrong answers, and still having the best time. Merry Christmas, Clark!` },
      { e: "🏠", title: "The Kevin McCallister", pick: () => ids.filter(id => S(id).bl >= 2).sort((a, b) => S(b).bl - S(a).bl)[0], line: id => `Left ${S(id).bl} questions home alone.` },
      { e: "💚", title: "The Grinch", pick: () => ids.filter(id => S(id).lost >= 100).sort((a, b) => S(b).lost - S(a).lost)[0], line: id => `Lost ${S(id).lost} points to penalties and thieves. Heart still two sizes too small.` },
      { e: "🩼", title: "The Tiny Tim", pick: () => (ids.length >= 4 ? sorted()[ids.length - 1].id : null), line: () => `Dead last, but God bless us, every one!` }
    ];
    const used = new Set(), out = [];
    for (const d of defs) {
      if (out.length >= 6) break;
      const id = d.pick(); if (!id || used.has(id)) continue;
      used.add(id); out.push({ e: d.e, title: d.title, pid: id, line: d.line(id) });
    }
    return out;
  }
  const finaleSteps = () => ["intro", ...G.finale.awards.map((_, i) => "award" + i), "p3", "p2", "p1", "end"].filter(k => k !== "p3" || sorted().length >= 3).filter(k => k !== "p2" || sorted().length >= 2);
  function startFinale() {
    if (!Object.keys(G.players).length) return;
    stopMedia();
    G.rid = null; G.showScores = false; G.hold = false; G.tEnd = 0;
    G.finale = { awards: makeAwards(), i: 0 };
    G.phase = "finale"; finaleStep();
  }
  function finaleStep() {
    const steps = finaleSteps(), k = steps[G.finale.i];
    G.finale.k = k;
    G.stepAt = k === "end" ? 0 : Date.now() + (k === "intro" ? 6000 : k === "p1" ? 9000 : k.startsWith("p") ? 6000 : 8000);
    if (k === "intro" || k.startsWith("p")) SFX.play("drumroll");
    if (k.startsWith("award")) SFX.play("award", 0.2);
    if (k.startsWith("p")) SFX.play(k === "p1" ? "fanfare" : "award", 2.6);
  }
  function finaleNext() { if (G.finale.k === "end") return toMenu(); G.finale.i++; finaleStep(); }

  function toMenu() { stopMedia(); G.phase = "menu"; G.rid = null; G.showScores = false; G.tEnd = 0; G.stepAt = 0; arm(); }
  /* In the menu, the autopilot starts the next round on its own when something is queued. */
  function arm(reset) {
    if (G.phase !== "menu") return;
    if (G.auto && G.queue.length && !G.hold) { if (!G.stepAt || reset) G.stepAt = Date.now() + G.breakSec * 1000; }
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
    if (m.draw) {
      const d = G.drawings[m.draw], cv = document.createElement("canvas"); cv.width = cv.height = 720; cv.className = "media-draw";
      const ctx = cv.getContext("2d"), t0 = performance.now(), len = play ? 3800 : 0;
      const step = () => { const k = len ? Math.min(1, (performance.now() - t0) / len) : 1; drawStrokes(ctx, (d && d.strokes) || [], 720, k); if (k < 1 && media.el === cv) requestAnimationFrame(step); };
      media.el = cv; media.kind = "draw"; step();
    }
    else if (m.tune) { media.kind = "tune"; if (play) SFX.tune(m.tune, m.bpm || 120); }
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
    else if (m.draw) startMedia(q, true);
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
    if (G.phase === "drawing" && G.tEnd) {
      const s = Math.max(0, Math.ceil((G.tEnd - now) / 1000));
      if (s !== lastSec) { lastSec = s; if (s <= 5 && s > 0) SFX.play("tick"); const el = $("#timer"); if (el) el.textContent = s; }
    }
    const ds = Object.keys(G.drawings), drawWho = ds.filter(k => active().includes(k) || G.drawings[k].strokes);
    if (G.phase === "drawpick" && drawWho.length && drawWho.every(k => G.drawings[k].pick >= 0) && now - lastAnsAt > 1500) { lastAnsAt = now; next(); save(); render(); publish(); return; }
    if (G.phase === "drawing" && drawWho.length && drawWho.every(k => G.drawings[k].strokes)) { next(); save(); render(); publish(); return; }
    if ((G.phase === "fibwrite" || G.phase === "fibvote") && G.tEnd) {
      const s = Math.max(0, Math.ceil((G.tEnd - now) / 1000));
      if (s !== lastSec) { lastSec = s; if (s <= 5 && s > 0) SFX.play("tick"); const el = $("#timer"); if (el) el.textContent = s; }
      const act = Object.keys(G.players).filter(id => Date.now() - (G.players[id].seen || 0) < 45000), f = G.fib;
      const done = G.phase === "fibwrite" ? act.every(k => f.subs[k]) : act.every(k => k in f.votes);
      if (act.length && done && now - lastAnsAt > 1500) { next(); save(); render(); publish(); return; }
    }
    if ((G.phase === "gifpick" || G.phase === "gifvote") && G.tEnd) {
      const s = Math.max(0, Math.ceil((G.tEnd - now) / 1000));
      if (s !== lastSec) { lastSec = s; if (s <= 5 && s > 0) SFX.play("tick"); const el = $("#timer"); if (el) el.textContent = s; }
      const act = Object.keys(G.players).filter(id => Date.now() - (G.players[id].seen || 0) < 45000), g = G.gif;
      const done = G.phase === "gifpick" ? act.every(k => g.subs[k]) : act.every(k => g.votes[k] || (g.order.length === 1 && g.order[0] === k));
      if (act.length && done && now - lastAnsAt > 1500) { next(); save(); render(); publish(); return; }
    }
    if (G.stepAt && now >= G.stepAt && (G.auto || TIMED.includes(G.phase))) { next(); save(); render(); publish(); }
  }, 200);
  function music() {
    const ph = G.phase, busy = media.kind === "tune" || media.kind === "audio" || media.kind === "video";
    let want = "";
    if (G.paused || ["lobby", "menu", "roundend", "intro"].includes(ph)) want = "music_lobby";
    else if ((QPHASES.includes(ph) && !busy) || ["drawpick", "drawing", "gifpick", "gifvote", "gifresult", "fibwrite", "fibvote", "fibresult"].includes(ph)) want = "music_think";
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
      : `<div class="mast-round"><span class="label">${G.kid ? "KID MODE" : "TONIGHT ONLY"}</span><b>${G.phase === "lobby" ? "Doors open!" : G.phase === "finale" ? "The Grand Finale" : "Intermission"}</b></div>`;
    return `<div class="sampler"><span class="n1">Rewind</span><span class="n2">Christmas Trivia</span></div>${mid}
      ${G.phase !== "lobby" ? `<div class="join-tag">${qr(joinUrl()) ? `<img src="${qr(joinUrl())}" alt="QR code to join">` : ""}<div class="lines"><span>JOIN AT</span><b>${esc(shortJoin())}</b><span>CODE</span><span class="code">${G.code}</span></div></div>` : ""}`;
  }
  function race(title, withDelta) {
    const ps = sorted().slice(0, 10), top = Math.max(1, ...ps.map(p => p.score));
    const pos = s => (Math.max(0, s) / top) * 100;
    const lanes = ps.map((p, i) => {
      const from = withDelta ? G.roundStart[p.id] ?? 0 : p.score, d = p.score - from;
      return `<li class="lane${i === 0 && p.score > 0 ? " top" : ""}"><span class="rk">${i + 1}</span>
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
  /* A cozy brick fireplace. Drop assets/media/fireplace.mp4 in to show your own crackling-fire video instead. */
  function fireplace() {
    return `<div class="hearth"><div class="mantel"><span class="clock-orn">🕰️</span><span class="candle">🕯️</span><span class="candle">🕯️</span></div>
      <div class="stockings">${["🧦", "🧦", "🧦", "🧦", "🧦"].map((x, i) => `<span style="animation-delay:-${i * 0.7}s">${x}</span>`).join("")}</div>
      <div class="firebox">${fireOk ? `<video src="assets/media/fireplace.mp4" autoplay muted loop playsinline></video>`
        : `<div class="glow"></div><div class="flames">${"<i></i>".repeat(7)}</div><div class="logs"><i></i><i></i></div>`}</div></div>`;
  }
  function vFinale() {
    const f = G.finale, k = f.k || "intro", ps = sorted();
    if (k === "intro") return `<section class="intro finale"><div class="rain">${emojiRain("✨🏆🎄⭐", 22)}</div><p class="label">THE GRAND FINALE</p>
      <h1>And the awards go to…</h1><p class="script sub">Everybody grab a cookie and settle in.</p><div class="drum">🥁</div></section>`;
    if (k.startsWith("award")) {
      const a = f.awards[+k.slice(5)], p = G.players[a.pid];
      return `<section class="intro finale award" style="--n:${k}"><p class="label">AWARD ${+k.slice(5) + 1} OF ${f.awards.length}</p>
        <div class="trophy">${a.e}</div><h1>${esc(a.title)}</h1>
        <div class="winner">${ornament(pl(a.pid), "big")}<b>${esc(p ? p.name : "")}</b></div><p class="rule doily">${esc(a.line)}</p></section>`;
    }
    const shown = { p3: 1, p2: 2, p1: 3, end: 3 }[k];
    const spot = (place, cls) => {
      const p = ps[place - 1]; if (!p) return "";
      const on = shown >= 4 - place;
      return `<div class="step s${place}${on ? " on" : ""}">${on ? `<div class="who">${place === 1 ? '<span class="crown">👑</span>' : ""}${ornament(pl(p.id), "big")}<b>${esc(p.name)}</b><span>${p.score.toLocaleString()} pts</span></div>` : `<div class="who mystery">?</div>`}
        <div class="block ${cls}">${place}</div></div>`;
    };
    return `<section class="podium-wrap${k === "end" ? " end" : ""}">${k === "p1" || k === "end" ? `<div class="rain">${emojiRain("🎉✨❄️🎄⭐🎁", 34)}</div>` : ""}
      <h1>${k === "end" ? "Merry Christmas, ya filthy animals!" : k === "p1" ? "Our trivia champion!" : "The winners’ mantel"}</h1>
      <div class="podium">${spot(2, "silver")}${spot(1, "gold")}${spot(3, "bronze")}</div>
      ${k === "end" ? race("Final standings", false) : ""}</section>`;
  }
  const giphyTag = `<span class="giphy-tag">Powered by GIPHY</span>`;
  function vGifPick() {
    const g = G.gif, now = G.paused ? G.pausedAt : Date.now();
    return `<section class="gif-pick"><p class="label">GIF WRAPPED · PROMPT ${g.pi + 1} OF ${g.prompts.length}</p>
      <div class="prompt doily">${esc(g.prompts[g.pi])}</div>
      <div class="gif-row"><div class="clock"><span class="cap"></span><b id="timer">${Math.max(0, Math.ceil((G.tEnd - now) / 1000))}</b><small>seconds</small></div>
        <p class="script sub">Find the perfect Christmas GIF on your phone.<br>Add a caption if you’re feeling funny.</p></div>${giphyTag}</section>`;
  }
  function vGifBoard() {
    const g = G.gif, res = G.phase === "gifresult" ? g.res : null, n = g.order.length, now = G.paused ? G.pausedAt : Date.now();
    const cols = n <= 2 ? n : n <= 4 ? 2 : n <= 6 ? 3 : n <= 12 ? 4 : 5;
    const voters = k => Object.keys(g.votes).filter(v => g.votes[v] === k && G.players[v]);
    const cards = g.order.map((k, i) => {
      const sub = g.subs[k], x = res && res[k], p = G.players[k];
      return `<figure class="gif-card${x && x.best ? " best" : ""}"><span class="num">${i + 1}</span>
        <img src="${esc(sub.b)}" alt="">${sub.cap ? `<figcaption>${esc(sub.cap)}</figcaption>` : ""}
        ${x ? `<div class="by">${ornament(pl(k), "tiny")}<b>${esc(p ? p.name : "")}</b><span class="gain">+${x.d}</span></div>
          <div class="landed sm">${voters(k).map((v, j) => `<span class="drop" style="animation-delay:${j * 90}ms">${ornament(pl(v))}</span>`).join("")}</div>` : ""}
        ${x && x.best ? `<span class="stamp">🏆 Best in Show</span>` : ""}</figure>`;
    }).join("");
    return `<section class="gif-board"><div class="gif-top"><p class="prompt-small">${esc(g.prompts[g.pi])}</p>
        ${G.phase === "gifvote" ? `<div class="clock mini"><b id="timer">${Math.max(0, Math.ceil((G.tEnd - now) / 1000))}</b></div><p class="label">VOTE ON YOUR PHONE FOR THE FUNNIEST</p>` : `<p class="label">THE VOTES ARE IN!</p>`}</div>
      ${n ? `<div class="gif-grid${res ? " res" : ""}" style="--cols:${cols};--rows:${Math.ceil(n / cols)}">${cards}</div>` : `<p class="waiting">Nobody picked a GIF! Bah, humbug.</p>`}${giphyTag}</section>`;
  }
  const blankify = q => esc(q).replace("____", `<span class="blank">______</span>`);
  function vFibWrite() {
    const f = G.fib, now = G.paused ? G.pausedAt : Date.now();
    return `<section class="gif-pick fib"><p class="label">FA-LA-LA LIES · ${f.pi + 1} OF ${f.prompts.length}</p>
      <div class="prompt doily">${blankify(f.prompts[f.pi].q)}</div>
      <div class="gif-row"><div class="clock"><span class="cap"></span><b id="timer">${Math.max(0, Math.ceil((G.tEnd - now) / 1000))}</b><small>seconds</small></div>
        <p class="script sub">Type a FAKE answer on your phone.<br>Make it believable enough to fool everyone!</p></div></section>`;
  }
  function vFibBoard() {
    const f = G.fib, res = G.phase === "fibresult", now = G.paused ? G.pausedAt : Date.now();
    const voters = i => Object.keys(f.votes).filter(v => f.votes[v] === i && G.players[v]);
    const tiles = f.opts.map((o, i) => {
      const who = voters(i);
      let tag = "";
      if (res) tag = o.real ? `<span class="truth">✓ THE TRUTH</span>` : o.house ? `<span class="fibber">👵 Grandma’s fib</span>`
        : `<span class="fibber">${o.authors.map(a => `${ornament(pl(a), "tiny")} ${esc(G.players[a] ? G.players[a].name : "")}${who.length ? ` <b>+${who.length * (cur().fooled || 150)}</b>` : ""}`).join(" · ")}</span>`;
      return `<li class="ch ch-${i % 4} fib-opt${res ? (o.real ? " right" : " wrong") : ""}" style="animation-delay:${res && !o.real ? 0 : i * 80}ms">
        <span class="letter">${i + 1}</span><span class="ctext">${esc(o.t)}</span>
        ${res ? `<div class="landed sm">${tag}${who.map((v, j) => `<span class="drop" style="animation-delay:${j * 90}ms">${ornament(pl(v))}</span>`).join("")}</div>` : ""}</li>`;
    }).join("");
    return `<section class="fib-board"><div class="gif-top"><p class="prompt-small">${blankify(f.prompts[f.pi].q)}</p>
        ${!res ? `<div class="clock mini"><b id="timer">${Math.max(0, Math.ceil((G.tEnd - now) / 1000))}</b></div><p class="label">WHICH ONE IS TRUE? VOTE ON YOUR PHONE</p>` : `<p class="label">THE TRUTH IS OUT!</p>`}</div>
      <ol class="choices fib-list" style="--cols:${f.opts.length > 6 ? 3 : 2}">${tiles}</ol></section>`;
  }
  function vMenu() {
    const q = G.queue.map(id => byId[id]).filter(Boolean);
    const status = G.hold ? "Taking a break. The host will start the next round." : !q.length ? "The host is picking the next round…" : !G.auto ? "Waiting for the host to start it." : "";
    return `<section class="menu">
      <div class="cozy">${fireplace()}
        <div class="marquee doily"><p class="label">${G.hold ? "INTERMISSION" : "COMING UP NEXT"}</p>
          ${q.length ? `<ol class="upnext">${q.slice(0, 3).map((r, i) => `<li${i === 0 ? ' class="first"' : ""}><b>${esc(r.title)}</b><span>${esc(r.sub || "")}</span></li>`).join("")}</ol>` : ""}
          ${status ? `<p class="waiting">${status}</p>` : ""}
          ${G.surprise && !G.hold ? `<p class="hint">Careful: a surprise round could sneak in at any time.</p>` : ""}</div></div>
      ${race("The Sleigh Race", false)}</section>`;
  }
  function vDrawPick() {
    const r = cur();
    return `<section class="intro draw"><div class="rain">${emojiRain(r.emoji, 16)}</div><p class="label">DRAW THE HALLS</p><h1>Check your phone!</h1>
      <p class="script sub">Pick one of your three movies. Keep it secret!</p><p class="rule doily">${esc(r.rule)}</p>
      <div class="chips"><span>🖍️ ${drawSecs(r)} seconds to draw</span><span>🚫 No letters or numbers</span><span>🎨 Then everyone guesses</span></div></section>`;
  }
  function vDrawing() {
    const now = G.paused ? G.pausedAt : Date.now();
    return `<section class="intro draw drawing"><p class="label">DRAW THE HALLS</p><h1>Everybody’s drawing…</h1>
      <div class="crayons"><span>🖍️</span><span>✏️</span><span>🎨</span><span>🖌️</span></div>
      <div class="clock"><span class="cap"></span><b id="timer">${Math.max(0, Math.ceil((G.tEnd - now) / 1000))}</b><small>seconds</small></div>
      <p class="script sub">No peeking at your neighbor’s phone!</p></section>`;
  }
  const artCache = {};
  function artUrl(pid) {
    const k = G.drawSeq + ":" + pid; if (artCache[k]) return artCache[k];
    const d = G.drawings[pid]; if (!d || !d.strokes) return "";
    const cv = document.createElement("canvas"); cv.width = cv.height = 360; drawStrokes(cv.getContext("2d"), d.strokes, 360, 1);
    return (artCache[k] = cv.toDataURL("image/png"));
  }
  function vFridge() {
    const items = G.order.filter(pid => G.drawings[pid] && G.players[pid]);
    return `<section class="fridge-wrap"><div class="fridge-head"><p class="label">THAT’S A WRAP ON DRAW THE HALLS</p><h1>Grandma’s Fridge</h1></div>
      <div class="fridge">${items.map((pid, i) => { const d = G.drawings[pid]; return `<figure class="art" style="--tilt:${((i * 37) % 9) - 4}deg">
        <span class="magnet m${i % 4}"></span><img src="${artUrl(pid)}" alt=""><figcaption><b>${esc(d.opts[d.pick])}</b>by ${esc(G.players[pid].name)}</figcaption></figure>`; }).join("")}</div></section>`;
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
    if (r.kind === "draw") return vFridge();
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
    if (G.phase === "fibwrite" || G.phase === "fibvote") {
      const f = G.fib;
      return sorted().map(p => `<span class="t-item${(G.phase === "fibwrite" ? f.subs[p.id] : p.id in f.votes) ? " in" : ""}">${ornament(pl(p.id))}<span>${esc(p.name)}</span></span>`).join("");
    }
    if (G.phase === "gifpick" || G.phase === "gifvote") {
      const g = G.gif;
      return sorted().map(p => `<span class="t-item${(G.phase === "gifpick" ? g.subs[p.id] : g.votes[p.id]) ? " in" : ""}">${ornament(pl(p.id))}<span>${esc(p.name)}</span></span>`).join("");
    }
    if (G.phase === "drawpick" || G.phase === "drawing") {
      return sorted().filter(p => G.drawings[p.id]).map(p => { const d = G.drawings[p.id], ok = G.phase === "drawpick" ? d.pick >= 0 : !!d.strokes;
        return `<span class="t-item${ok ? " in" : ""}">${ornament(pl(p.id))}<span>${esc(p.name)}</span></span>`; }).join("");
    }
    if (!["ready", "question"].includes(G.phase)) return "";
    const ps = sorted().filter(p => p.id !== artistNow());
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
    else if (G.phase === "menu" && G.hold) t = "☕ Intermission";
    else if (G.phase === "drawpick" && G.stepAt) { const s = Math.ceil((G.stepAt - Date.now()) / 1000); if (s > 0) t = `Pick your movie · ${s}`; }
    else if (G.stepAt && G.auto && !TIMED.includes(G.phase)) { const s = Math.ceil((G.stepAt - Date.now()) / 1000); if (s > 0) t = `▶ ${G.phase === "menu" ? "Next round" : "Autopilot · next"} in ${s >= 60 ? Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0") : s}`; }
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
    const v = { lobby: vLobby, menu: vMenu, intro: vIntro, alarm: vIntro, silly: vSilly, ready: vReady, question: vQuestion, locked: vQuestion, reveal: vQuestion, roundend: vRoundEnd, drawpick: vDrawPick, drawing: vDrawing, finale: vFinale, gifpick: vGifPick, gifvote: vGifBoard, gifresult: vGifBoard, fibwrite: vFibWrite, fibvote: vFibBoard, fibresult: vFibBoard }[G.phase] || vLobby;
    put("#stage", r || ["lobby", "menu", "finale"].includes(G.phase) ? v() : vLobby());
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
  let fireOk = false;
  { const v = document.createElement("video"); v.preload = "metadata"; v.onloadedmetadata = () => { fireOk = true; render(); }; v.src = "assets/media/fireplace.mp4"; }
  render();
})();
