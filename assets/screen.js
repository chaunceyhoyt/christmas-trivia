/* Big screen: the game's source of truth. It keeps players, answers and scores, broadcasts
   state to phones, and takes commands from the host controller over a PIN-named channel. */
(() => {
  const R = window.ROUNDS, byId = Object.fromEntries(R.map(r => [r.id, r]));
  const FEATURES = R.filter(r => r.kind === "feature"), ALARMS = R.filter(r => r.kind === "alarm");
  const $ = s => document.querySelector(s);
  const KEY = "xmas-screen-v1", LETTERS = "ABCD";
  const pad = (n, w = 2) => String(n).padStart(w, "0");

  /* ---------- state ---------- */
  function code4() { const A = "ABCDEFGHJKLMNPQRSTUVWXYZ"; return Array.from({ length: 4 }, () => A[Math.floor(Math.random() * A.length)]).join(""); }
  function fresh() {
    return { code: code4(), pin: String(Math.floor(1000 + Math.random() * 9000)), players: {}, kicked: [], played: [],
      rid: null, qi: 0, phase: "lobby", choices: [], correct: -1, ans: {}, res: null, scored: {}, tEnd: 0, epoch: 0,
      voice: false, showScores: false, roundStart: {}, alarmAt: 0 };
  }
  let G = null;
  try { G = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {}
  if (!G || !G.code) G = fresh();
  G.showScores = false;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(G)); } catch (e) {} };
  save();
  const cur = () => (G.rid ? byId[G.rid] : null);
  const sorted = () => Object.entries(G.players).map(([id, p]) => ({ id, ...p })).sort((a, b) => b.score - a.score || a.at - b.at);

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
    new QRCode(d, { text, width: 512, height: 512, colorDark: "#2b1d14", colorLight: "#fffaf0", correctLevel: QRCode.CorrectLevel.M });
    const c = d.querySelector("canvas");
    return (qrCache[text] = c ? c.toDataURL() : "");
  }

  /* ---------- network ---------- */
  let main = null, host = null, netOk = false, hostSeen = 0;
  function connect() {
    if (main) main.close();
    if (host) host.close();
    const room = "xmas-" + G.code.toLowerCase();
    main = Net.open(room, { join: onJoin, answer: onAnswer, hello: () => publish() }, s => { netOk = s === "SUBSCRIBED"; if (netOk) publish(); renderFoot(); });
    host = Net.open(room + "-" + G.pin, { cmd: onCmd, hello: () => { hostSeen = Date.now(); renderFoot(); publish(); } }, s => { if (s === "SUBSCRIBED") publish(); });
  }

  function onJoin(p) {
    if (!p || typeof p.pid !== "string") return;
    const pid = p.pid.slice(0, 40), name = String(p.name || "").trim().slice(0, 24);
    if (!name || G.kicked.includes(pid)) return;
    const pl = G.players[pid];
    if (!pl) {
      if (Object.keys(G.players).length >= 60) return;
      G.players[pid] = { name, score: 0, at: Date.now() };
      SFX.play("pop"); save(); render();
    } else if (pl.name !== name) { pl.name = name; save(); render(); }
    publish();
  }
  function onAnswer(p) {
    if (!p || !G.players[p.pid] || G.phase !== "question" || p.epoch !== G.epoch) return;
    const c = p.c | 0;
    if (c < 0 || c >= G.choices.length) return;
    const had = G.ans[p.pid];
    G.ans[p.pid] = { c, t: had && had.c === c ? had.t : Date.now() };
    save(); render(); publish();
  }
  function onCmd(m) {
    hostSeen = Date.now();
    if (!m || typeof m.a !== "string") return;
    switch (m.a) {
      case "next": next(); break;
      case "prev": prev(); break;
      case "pick": pick(m.id); break;
      case "alarm": pickAlarm(m.id); break;
      case "lock": lock(); break;
      case "timer": startTimer(m.s); break;
      case "scores": G.showScores = !G.showScores; break;
      case "adj": if (G.players[m.pid]) G.players[m.pid].score += Math.max(-10, Math.min(10, m.d | 0)); break;
      case "kick": kick(m.pid); break;
      case "voice": G.voice = !!m.on; break;
      case "lights": lights(m.id); break;
      case "mute": SFX.setMuted(!!m.on); break;
      case "menu": toMenu(); break;
      case "lobby": G.phase = "lobby"; G.rid = null; break;
      case "hello": break;
    }
    save(); render(); publish();
  }

  let pubT = 0;
  function publish() { if (pubT) return; pubT = setTimeout(() => { pubT = 0; pub(); }, 90); }
  function pub() {
    if (!main) return;
    const r = cur(), q = r && r.qs[G.qi], inQ = ["question", "locked", "reveal"].includes(G.phase);
    const counts = [0, 0, 0, 0];
    Object.values(G.ans).forEach(a => counts[a.c]++);
    const s = {
      phase: G.phase, code: G.code, epoch: G.epoch, showScores: G.showScores,
      round: r ? { id: r.id, title: r.title, sub: r.sub || "", kind: r.kind, pts: r.pts, rule: r.rule || "", lead: r.lead || "", big: !!r.big,
        dark: !!r.dark, squirrel: !!r.squirrel, c1: r.c1 || "", c2: r.c2 || "", ink: r.ink || "", fx: r.fx || "", alarm: r.alarm || "",
        tagline: r.tagline || "", gag: r.gag || "", emoji: r.emoji || "", n: r.qs.length, idx: R.indexOf(r) } : null,
      qi: G.qi, q: inQ ? q[0] : null, choices: inQ ? G.choices : null,
      tLeft: G.tEnd ? Math.max(0, G.tEnd - Date.now()) : 0,
      answered: Object.keys(G.ans),
      players: sorted().map(p => ({ id: p.id, name: p.name, score: p.score })),
      reveal: G.phase === "reveal" ? { correct: G.correct, note: q[3] || "", res: G.res, counts } : null,
      alarmAge: G.phase === "alarm" && G.alarmAt ? Date.now() - G.alarmAt : 99999
    };
    main.send("state", s);
    host.send("hoststate", Object.assign({}, s, {
      secret: q ? { answer: G.correct >= 0 ? G.choices[G.correct] : q[1], correct: G.correct, note: q[3] || "", q: q[0], choices: G.choices, ans: G.ans } : null,
      rounds: R.map(x => ({ id: x.id, title: x.title, kind: x.kind, n: x.qs.length, played: G.played.includes(x.id), c1: x.c1 || "", phrase: x.phrase || "" })),
      voice: G.voice, muted: SFX.muted, roundN: r ? r.qs.length : 0
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
  function pick(id) {
    const r = byId[id]; if (!r) return;
    G.rid = id; G.qi = 0; G.showScores = false; G.ans = {}; G.res = null; G.tEnd = 0;
    if (!G.played.includes(id)) G.played.push(id);
    G.roundStart = Object.fromEntries(Object.entries(G.players).map(([k, p]) => [k, p.score]));
    if (r.kind === "alarm") { G.phase = "alarm"; G.alarmAt = Date.now(); fireAlarm(r); }
    else { G.phase = "intro"; SFX.play("stinger"); }
  }
  function pickAlarm(id) {
    let r = id && byId[id];
    if (!r || r.kind !== "alarm") {
      let pool = ALARMS.filter(x => !G.played.includes(x.id));
      if (!pool.length) pool = ALARMS;
      r = pool[Math.floor(Math.random() * pool.length)];
    }
    pick(r.id);
  }
  let alarmT = 0;
  function fireAlarm(r) {
    (r.sfx || [["siren", 0]]).forEach(([n, at]) => SFX.play(n, at));
    clearTimeout(alarmT);
    alarmT = setTimeout(() => { render(); }, 2300);
    if (G.voice && r.phrase) setTimeout(() => say("Hey Google, " + r.phrase), 3800);
  }
  function openQ() {
    const r = cur(), q = r.qs[G.qi];
    Object.assign(G, makeChoices(r, q));
    G.ans = {}; G.res = null; G.phase = "question"; G.epoch++;
    G.tEnd = r.timer ? Date.now() + r.timer * 1000 : 0;
    lastSec = -1;
  }
  function lock() { if (G.phase === "question") { G.phase = "locked"; G.tEnd = 0; SFX.play("buzz"); } }
  function startTimer(s) { if (G.phase === "question") { G.tEnd = Date.now() + Math.max(5, Math.min(120, (s | 0) || 15)) * 1000; lastSec = -1; } }
  function reveal() {
    const r = cur(), key = r.id + ":" + G.qi;
    const prevDeltas = G.scored[key];
    if (prevDeltas) Object.entries(prevDeltas).forEach(([pid, d]) => { if (G.players[pid]) G.players[pid].score -= d; });
    const res = {};
    const entries = Object.entries(G.ans).filter(([pid]) => G.players[pid]);
    entries.forEach(([pid, a]) => { const ok = a.c === G.correct; res[pid] = { c: a.c, ok, d: ok ? r.pts : -(r.wrong || 0) }; });
    if (r.first) {
      const oks = entries.filter(([, a]) => a.c === G.correct).sort((x, y) => x[1].t - y[1].t);
      if (oks[0]) { res[oks[0][0]].d += 1; res[oks[0][0]].first = true; }
    }
    if (r.steal) {
      const leader = sorted()[0];
      if (leader && leader.score > 0) {
        let loss = 0;
        Object.entries(res).forEach(([pid, x]) => { if (x.ok && pid !== leader.id) { x.d += 1; x.stole = true; loss++; } });
        if (loss) { res[leader.id] = res[leader.id] || { c: -1, ok: false, d: 0 }; res[leader.id].d -= loss; res[leader.id].robbed = loss; }
      }
    }
    const deltas = {};
    Object.entries(res).forEach(([pid, x]) => { G.players[pid].score += x.d; deltas[pid] = x.d; });
    G.scored[key] = deltas; G.res = res; G.phase = "reveal"; G.tEnd = 0;
    SFX.play("ding");
  }
  function next() {
    const r = cur();
    switch (G.phase) {
      case "lobby": G.phase = "menu"; break;
      case "menu": { const f = FEATURES.find(x => !G.played.includes(x.id)); if (f) pick(f.id); break; }
      case "intro": case "alarm": openQ(); break;
      case "question": case "locked": reveal(); break;
      case "reveal": if (G.qi + 1 < r.qs.length) { G.qi++; openQ(); } else endRound(); break;
      case "roundend": toMenu(); break;
    }
  }
  function prev() {
    const r = cur(); if (!r) { if (G.phase === "menu") G.phase = "lobby"; return; }
    if (["question", "locked", "reveal"].includes(G.phase)) {
      if (G.qi > 0) { G.qi--; openQ(); }
      else { G.phase = r.kind === "alarm" ? "alarm" : "intro"; G.alarmAt = 0; G.tEnd = 0; }
    } else if (G.phase === "roundend") { G.qi = r.qs.length - 1; openQ(); }
    else if (G.phase === "intro" || G.phase === "alarm") toMenu();
  }
  function endRound() {
    const r = cur();
    G.phase = "roundend"; G.tEnd = 0;
    SFX.play("stinger");
    if (r.kind === "alarm" && G.voice) say("Hey Google, " + window.LIGHTS_NORMAL);
  }
  function toMenu() { G.phase = "menu"; G.rid = null; G.showScores = false; G.tEnd = 0; }
  function kick(pid) { if (!G.players[pid]) return; delete G.players[pid]; delete G.ans[pid]; G.kicked.push(pid); }
  function lights(id) { const r = byId[id]; say("Hey Google, " + (r && r.phrase ? r.phrase : window.LIGHTS_NORMAL)); }
  function say(text) {
    try {
      const u = new SpeechSynthesisUtterance(String(text).slice(0, 100));
      u.rate = 0.95; u.volume = 1;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) {}
  }

  /* timer */
  let lastSec = -1;
  setInterval(() => {
    if (G.phase !== "question" || !G.tEnd) return;
    const left = G.tEnd - Date.now();
    if (left <= 0) { lock(); save(); render(); publish(); return; }
    const s = Math.ceil(left / 1000);
    if (s !== lastSec) { lastSec = s; if (s <= 5) SFX.play("tick"); const el = $("#timer"); if (el) el.textContent = s; }
  }, 200);

  /* ---------- rendering ---------- */
  function theme() {
    const r = cur();
    document.documentElement.style.setProperty("--theme", r && r.kind === "alarm" ? r.c1 === "#ffd166" ? "#c98c06" : r.c1 : "var(--red)");
  }
  function mast() {
    const r = cur(), page = r ? `PAGE ${R.indexOf(r) + 1}${pad(G.qi + 1)}` : G.phase === "lobby" ? "NOW TAKING ORDERS" : "CATALOG INDEX";
    const showTag = G.phase !== "lobby";
    $("#mast").innerHTML = `<div class="mast-brand"><span class="script">Rewind</span><span class="slab">Christmas Trivia Catalog</span><span class="mono">FALL / WINTER 1989 · ${page}</span></div>
      ${showTag ? `<div class="join-tag">${qr(joinUrl()) ? `<img src="${qr(joinUrl())}" alt="QR code to join">` : ""}<div class="lines"><span class="mono">JOIN AT</span><b>${esc(shortJoin())}</b><span class="mono">GAME CODE</span><span class="code">${G.code}</span></div></div>` : ""}`;
  }
  function board(title, withDelta) {
    const ps = sorted().slice(0, 12);
    const rows = ps.map((p, i) => {
      const d = p.score - (G.roundStart[p.id] ?? 0);
      return `<tr class="${i === 0 && p.score > 0 ? "top" : ""}"><td class="mono">${pad(i + 1)}</td><td>${esc(p.name)}</td>${withDelta ? `<td class="delta${d < 0 ? " neg" : ""}">${d > 0 ? "+" : ""}${d}</td>` : ""}<td class="pts">${p.score}</td></tr>`;
    }).join("");
    return `<div class="order-form"><h2 class="slab">${esc(title)}</h2><table><thead><tr><th>No.</th><th>Customer</th>${withDelta ? "<th>This round</th>" : ""}<th>Points</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="4" class="empty">No customers yet. Scan the tag to join.</td></tr>`}</tbody></table></div>`;
  }
  function vLobby() {
    const ps = sorted();
    const img = qr(joinUrl());
    return `<section class="lobby">
      <div class="gift-tag"><p class="script">Scan to join!</p>${img ? `<img src="${img}" alt="QR code to join the game">` : ""}
        <p class="mono">${esc(shortJoin())}<br>game code <span class="code">${G.code}</span></p></div>
      <div class="lobby-side">
        <h1 class="slab">Now taking orders</h1>
        <p>Grab your phone, scan the tag, and pick a team name. Every phone is one team.</p>
        <ul class="name-tags">${ps.map(p => `<li>${esc(p.name)}</li>`).join("")}</ul>
        <p class="mono">${ps.length ? `${ps.length} on the list` : "Nobody yet. Be the first!"}</p>
        <div class="lobby-actions"><button class="btn red" data-k="next">Open the catalog ▶</button><button class="btn" data-k="hostqr">Host controller</button></div>
      </div></section>`;
  }
  function vMenu() {
    return `<section class="menu">
      <div class="index"><h2 class="slab">Catalog index</h2>
        <ol class="idx">${FEATURES.map((r, i) => `<li class="${G.played.includes(r.id) ? "done" : ""}"><span>${esc(r.title)}</span><span class="dots"></span><span class="mono">p. ${pad(i + 1)}</span></li>`).join("")}</ol>
        <p class="mono hint">The host is flipping pages. Brace yourselves: the alarm can go off at any time.</p></div>
      ${board("Order totals", false)}</section>`;
  }
  function vIntro() {
    const r = cur();
    return `<section class="divider">
      <p class="mono">SECTION ${pad(R.indexOf(r) + 1)} · ${r.qs.length} ITEMS</p>
      <h1 class="slab">${esc(r.title)}</h1><p class="script sub">${esc(r.sub || "")}</p>
      ${r.rule ? `<p class="rule">${esc(r.rule)}</p>` : ""}
      <div class="burst"><span>${r.pts}<small>PT${r.pts > 1 ? "S" : ""} EACH</small></span></div>
      <p class="mono hint">Phones ready. Next question coming up.</p></section>`;
  }
  function vQuestion() {
    const r = cur(), q = r.qs[G.qi], rev = G.phase === "reveal", dark = r.dark && !rev;
    const counts = [0, 0, 0, 0];
    Object.values(G.ans).forEach(a => counts[a.c]++);
    const n = Object.keys(G.players).length, k = Object.keys(G.ans).length;
    const long = q[0].length > 110;
    return `<section class="listing">
      <div class="listing-main">
        <p class="item mono">ITEM NO. ${pad(R.indexOf(r) + 1)} C ${pad(G.qi + 1, 3)} · ${esc(r.title.toUpperCase())} · ${G.qi + 1} OF ${r.qs.length}</p>
        ${r.lead && !dark ? `<p class="lead script">${esc(r.lead)}</p>` : ""}
        ${dark ? `<h2 class="qtext dark">Lights out! The question is on your phones.</h2>` : `<h2 class="qtext${r.big ? " emoji" : ""}${long ? " long" : ""}">${esc(q[0])}</h2>`}
        <ol class="choices">${G.choices.map((c, i) => `<li class="ch ch-${i}${rev ? (i === G.correct ? " right" : " wrong") : ""}">
          <span class="letter">${LETTERS[i]}</span><span class="ctext">${dark ? "• • •" : esc(c)}</span>
          ${rev ? `<span class="count mono">${counts[i]} ordered</span>` : ""}${rev && i === G.correct ? `<span class="stamp">IN STOCK</span>` : ""}</li>`).join("")}</ol>
        ${rev && q[3] ? `<p class="note">${esc(q[3])}</p>` : ""}
        ${rev ? revealExtras(r) : ""}
      </div>
      <aside class="listing-side">
        <div class="burst"><span>${r.pts}<small>PT${r.pts > 1 ? "S" : ""}</small></span></div>
        <div class="stat"><b>${k}</b><span class="mono">of ${n} orders in</span></div>
        ${G.tEnd ? `<div class="stat timer"><b id="timer">${Math.max(0, Math.ceil((G.tEnd - Date.now()) / 1000))}</b><span class="mono">seconds left</span></div>` : ""}
        ${G.phase === "locked" ? `<div class="closed">ORDERS CLOSED</div>` : ""}
      </aside></section>`;
  }
  function names(ids) { return ids.map(id => G.players[id] && esc(G.players[id].name)).filter(Boolean).join(", "); }
  function revealExtras(r) {
    const res = G.res || {};
    const ok = Object.keys(res).filter(id => res[id].ok), bad = Object.keys(res).filter(id => !res[id].ok && res[id].c >= 0);
    let out = `<p class="who">${ok.length ? `Got it: <b>${names(ok)}</b>` : "Nobody got this one!"}</p>`;
    const first = Object.keys(res).find(id => res[id].first);
    if (first) out += `<p class="who">Fastest finger: <b>${names([first])}</b> +1 bonus</p>`;
    const robbed = Object.keys(res).find(id => res[id].robbed);
    if (robbed) out += `<p class="who miss">The Grinch stole <b>${res[robbed].robbed}</b> from <b>${names([robbed])}</b></p>`;
    if (r.squirrel && bad.length) out += `<p class="who miss">Yell SQUIRREL: <b>${names(bad)}</b></p>`;
    else if (r.wrong && bad.length) out += `<p class="who miss">Lose ${r.wrong}: <b>${names(bad)}</b></p>`;
    return out;
  }
  function vRoundEnd() {
    const r = cur();
    return `<section class="roundend"><div><p class="mono">END OF SECTION ${pad(R.indexOf(r) + 1)}</p><h1 class="slab">${esc(r.title)}</h1><p class="script">is sold out!</p></div>${board("Round totals", true)}</section>`;
  }
  function vAlarm() {
    const r = cur(), revealed = !G.alarmAt || Date.now() - G.alarmAt > 2200;
    return `<div class="alarm" data-fx="${esc(r.fx)}" style="--fx-a:${r.c1};--fx-b:${r.c2};--fx-ink:${r.ink || "#fff"}">
      <div class="beacon"></div><div class="rain">${emojiRain(r.emoji, 30)}</div>
      <div class="alarm-inner">${!revealed
        ? `<div class="uhoh">UH OH…</div><div class="alarm-line">${esc(r.alarm)}</div>`
        : `<div class="uhoh small">UH OH…</div><div class="itsa">it’s a</div><h1 class="alarm-title">${esc(r.title.toUpperCase())}!</h1>
           <p class="tagline">${esc(r.tagline)}</p>
           <div class="alarm-cards"><p><b>House rule</b>${esc(r.rule)}</p><p><b>Do it right now</b>${esc(r.gag)}</p></div>
           <p class="mono hint">The host starts the first question when everyone’s done.</p>`}
      </div></div>`;
  }
  function overlay() {
    let html = "";
    if (G.phase === "alarm") html += vAlarm();
    if (G.showScores) html += `<div class="modal"><div class="modal-card">${board("Order totals", false)}</div></div>`;
    if (showHostQr) html += `<div class="modal" data-k="closeqr"><div class="modal-card"><h2 class="slab">Host controller</h2>
      <p>Scan this with <b>your</b> phone. Keep it away from the guests: it has the host PIN.</p>
      ${qr(hostUrl()) ? `<img src="${qr(hostUrl())}" alt="QR code for the host controller">` : ""}
      <p class="mono">Game ${G.code} · PIN ${G.pin}</p><button class="btn" data-k="closeqr">Close</button></div></div>`;
    $("#overlay").innerHTML = html;
  }
  let showHostQr = false, resetArmed = false, resetT = 0, soundOn = false;
  function renderFoot() {
    const hostOn = Date.now() - hostSeen < 12000;
    $("#foot").innerHTML = `<span><span class="dot${netOk ? " on" : ""}"></span>${netOk ? "Online" : "Connecting…"}</span>
      <span>Game ${G.code}</span><span>${Object.keys(G.players).length} players</span>
      <span><span class="dot${hostOn ? " on" : ""}"></span>${hostOn ? "Host phone connected" : "No host phone"}</span>
      ${location.protocol === "file:" ? `<span style="color:var(--red)">Opened from a file: phones can’t join until this is on the web</span>` : ""}
      <span class="right"><span>Keys: Space next · ← back · A alarm · S scores · L lock · T timer</span>
      <button data-k="hostqr">Host QR</button><button data-k="mute">${SFX.muted ? "Sound off" : "Sound on"}</button>
      <button data-k="voice">${G.voice ? "Voice lights on" : "Voice lights off"}</button>
      <button data-k="reset">${resetArmed ? "Click again: new game" : "New game"}</button></span>`;
  }
  function render() {
    theme(); mast();
    const v = { lobby: vLobby, menu: vMenu, intro: vIntro, alarm: vIntro, question: vQuestion, locked: vQuestion, reveal: vQuestion, roundend: vRoundEnd }[G.phase] || vLobby;
    $("#stage").innerHTML = cur() || G.phase === "lobby" || G.phase === "menu" ? v() : vLobby();
    overlay(); renderFoot();
  }

  /* ---------- local controls ---------- */
  function act(k) {
    switch (k) {
      case "next": next(); break;
      case "prev": prev(); break;
      case "alarm": pickAlarm(); break;
      case "scores": G.showScores = !G.showScores; break;
      case "lock": lock(); break;
      case "timer": startTimer(15); break;
      case "hostqr": showHostQr = !showHostQr; break;
      case "closeqr": showHostQr = false; break;
      case "mute": SFX.setMuted(!SFX.muted); break;
      case "voice": G.voice = !G.voice; if (G.voice) say("Voice lights are on."); break;
      case "reset":
        if (!resetArmed) { resetArmed = true; clearTimeout(resetT); resetT = setTimeout(() => { resetArmed = false; renderFoot(); }, 4000); renderFoot(); return; }
        resetArmed = false; G = fresh(); save(); connect(); break;
      default: return;
    }
    save(); render(); publish();
  }
  document.addEventListener("click", e => {
    if (!soundOn) { soundOn = SFX.unlock(); $("#soundBanner").hidden = true; }
    const b = e.target.closest("[data-k]");
    if (b) act(b.dataset.k);
  });
  document.addEventListener("keydown", e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!soundOn) { soundOn = SFX.unlock(); $("#soundBanner").hidden = true; }
    const map = { " ": "next", Enter: "next", ArrowRight: "next", PageDown: "next", ArrowLeft: "prev", PageUp: "prev", a: "alarm", A: "alarm", s: "scores", S: "scores", l: "lock", L: "lock", t: "timer", T: "timer", h: "hostqr", H: "hostqr", Escape: "closeqr" };
    const k = map[e.key];
    if (!k) return;
    if (document.activeElement && document.activeElement.matches("button") && (e.key === " " || e.key === "Enter")) return;
    e.preventDefault(); act(k);
  });

  connect();
  render();
})();
