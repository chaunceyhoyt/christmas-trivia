/* Host controller: drives the big screen over a channel named with the game's PIN.
   Pick rounds into the playlist and the autopilot plays them back to back, so the game can run by itself.
   The big screen sends back everything, including the correct answer, so the host can read ahead. */
(() => {
  const $ = s => document.querySelector(s);
  const LETTERS = "ABCD";
  let code = String(new URLSearchParams(location.search).get("g") || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
  let pin = location.hash.slice(1).replace(/\D/g, "").slice(0, 4);
  let H = null, ch = null, seen = 0, gotAt = 0, kickArm = "", kickT = 0;

  function connect() {
    if (ch) ch.close();
    ch = Net.open("xmas-" + code.toLowerCase() + "-" + pin, { hoststate: h => { if (h && typeof h === "object") { H = h; seen = gotAt = Date.now(); render(); } } },
      st => { if (st === "SUBSCRIBED") ch.send("hello", {}); render(); });
  }
  setInterval(() => { if (ch && Date.now() - seen > 6000) ch.send("hello", {}); renderHead(); tick(); }, 1000);
  function cmd(a, extra) { if (!ch) return; ch.send("cmd", Object.assign({ a }, extra || {})); try { navigator.vibrate && navigator.vibrate(15); } catch (e) {} }

  const nextLabel = () => {
    if (!H) return "Next";
    const last = H.round && H.qi + 1 >= H.round.n;
    return { lobby: "Start the show", menu: H.queue.length ? "Start the next round now" : "Play the next round", intro: "First question", alarm: "First question", silly: "Next question",
      ready: "Open answers now", question: "Lock answers now", locked: "Reveal the answer", reveal: last ? "Finish the round" : "Next question", roundend: "Back to intermission" }[H.phase] || "Next";
  };
  const phaseName = p => ({ lobby: "Lobby", menu: "Intermission", intro: "Round intro", alarm: "SURPRISE!", silly: "Jingle Jiggle", ready: "Reading time", question: "Answers open", locked: "Avatars landing", reveal: "Answer revealed", roundend: "Round over" }[p] || p);
  const left = ms => Math.max(0, Math.ceil((ms - (H && !H.paused ? Date.now() - gotAt : 0)) / 1000));

  function renderHead() {
    const live = Date.now() - seen < 8000;
    $("#head").innerHTML = `<div class="brand"><span class="n1">Host</span><span class="n2">Controller</span></div>
      <div class="me"><span><b>${code ? esc(code) : "No game"}</b><span class="status-pill">${live ? "● Connected" : "○ Looking for screen"}</span></span></div>`;
  }
  function tick() {
    const el = $("#autoLine"); if (!el || !H) return;
    el.textContent = autoText();
    const t = $("#hTimer"); if (t && H.phase === "question") t.textContent = left(H.tLeft) + "s";
  }
  function autoText() {
    if (H.paused) return "⏸ Paused. Nothing moves until you resume.";
    if (H.phase === "question") return `Answers open · ${left(H.tLeft)}s left`;
    if (H.phase === "ready") return "Players are reading the question…";
    if (!H.auto) return H.phase === "menu" || H.phase === "lobby" ? "Autopilot is off. Tap the red button to play." : "Autopilot is off. Tap the red button to move on.";
    if (H.stepLeft) return `▶ Autopilot · next step in ${left(H.stepLeft)}s`;
    if (H.phase === "menu") return H.queue.length ? "▶ Autopilot is starting the next round…" : "Add rounds to the playlist and the autopilot takes it from there.";
    return "▶ Autopilot is on";
  }
  function vLogin() {
    return `<form class="card" id="loginForm"><h1>Connect to the big screen</h1>
      <p>Scan the host QR on the big screen, or type the game code and PIN shown there.</p>
      <div class="field"><label for="codeIn">Game code</label><input id="codeIn" class="code-input" maxlength="4" value="${esc(code)}" autocomplete="off" required></div><p></p>
      <div class="field"><label for="pinIn">Host PIN</label><input id="pinIn" class="code-input" maxlength="4" inputmode="numeric" value="${esc(pin)}" autocomplete="off" required></div><p></p>
      <button class="btn green big-btn" type="submit">Connect</button></form>`;
  }
  function vNow() {
    const r = H.round, sec = H.secret;
    let body = "";
    if (r && ["ready", "question", "locked", "reveal"].includes(H.phase) && sec) {
      const counts = [0, 0, 0, 0];
      Object.values(sec.ans || {}).forEach(a => counts[a.c]++);
      body = `<p class="p-item"><span>${esc(r.title)} · Q ${H.qi + 1}/${r.n}</span><span>${phaseName(H.phase)} · ${H.answered.length}/${H.players.length} in${H.phase === "question" ? ` · <b id="hTimer">${left(H.tLeft)}s</b>` : ""}</span></p>
        <div class="p-meta">${toughMeter(H.tough, r.mult)}${H.golden ? `<span class="gold-pill">🌟 Golden</span>` : ""}${H.media ? `<span class="gold-pill">${{ tune: "🎶 Music box", audio: "📻 Sound clip", img: "🖼 Picture", video: "📺 Video" }[H.media]}</span>` : ""}</div>
        <p class="p-q${r.big ? " emoji" : ""}">${esc(sec.q)}</p>
        <ul class="h-choices">${(sec.choices || []).map((c, i) => `<li class="${i === sec.correct ? "right" : ""}"><b>${LETTERS[i]}</b><span>${esc(c)}${i === sec.correct ? " ✓" : ""}</span><span class="n">${counts[i]}</span></li>`).join("")}</ul>
        ${sec.note ? `<p class="small">${esc(sec.note)}</p>` : ""}`;
    } else if (r) {
      body = `<p class="p-item"><span>${phaseName(H.phase)}</span><span>${r.n} questions · ${r.timer}s each</span></p><h2>${esc(r.title)}</h2>${r.rule ? `<p>${esc(r.rule)}</p>` : ""}${H.silly ? `<p><b>Jingle Jiggle:</b> ${esc(H.silly)}</p>` : ""}`;
    } else {
      body = `<p class="p-item"><span>${phaseName(H.phase)}</span><span>${H.players.length} player${H.players.length === 1 ? "" : "s"}</span></p><h2>${H.phase === "lobby" ? "Waiting for guests to join" : H.queue.length ? "Next: " + esc(roundTitle(H.queue[0])) : "Pick rounds for the playlist"}</h2>`;
    }
    return `<div class="card h-now">${body}<p class="auto-line" id="autoLine">${esc(autoText())}</p></div>`;
  }
  const roundTitle = id => { const x = H.rounds.find(r => r.id === id); return x ? x.title : id; };
  function roundBtn(x) {
    const queued = H.queue.indexOf(x.id), none = !x.n;
    const tag = none ? "needs files" : x.played ? "played" : queued >= 0 ? `#${queued + 1} in playlist` : `${x.n} Q · ${x.timer}s`;
    return `<div class="h-round${x.played ? " played" : ""}${queued >= 0 ? " queued" : ""}${none ? " none" : ""}" style="--c:${x.c1 ? esc(x.c1) : "var(--pine)"}">
      <button class="h-add" data-q="${esc(x.id)}"${none ? " disabled" : ""}><b>${esc(x.title)}</b><span>${tag}</span></button>
      <button class="h-now-btn" data-now="${esc(x.id)}" data-kind="${x.kind}"${none ? " disabled" : ""} aria-label="Play ${esc(x.title)} now">▶</button></div>`;
  }
  function section(title, list, note) {
    if (!list.length) return "";
    return `<p class="h-sec">${title}</p>${note ? `<p class="small">${note}</p>` : ""}<div class="h-rounds">${list.map(roundBtn).join("")}</div>`;
  }
  function vMain() {
    const R = H.rounds, by = k => R.filter(x => x.kind === k);
    const feats = by("feature").filter(x => !x.extra), extra = by("feature").filter(x => x.extra);
    const inQ = H.phase === "question";
    return `${vNow()}
      <button class="btn red h-next" data-c="next">${esc(nextLabel())} ▶</button>
      <div class="h-row three">
        <button class="btn" data-c="prev">◀ Back</button>
        <button class="btn ${H.paused ? "green" : "gold"}" data-c="${H.paused ? "resume" : "pause"}">${H.paused ? "▶ Resume" : "⏸ Pause"}</button>
        <button class="btn" data-c="scores">${H.showScores ? "Hide scores" : "Scores"}</button>
      </div>
      <div class="h-row three">
        <button class="btn" data-c="addTime"${inQ ? "" : " disabled"}>+10 sec</button>
        <button class="btn" data-c="skip"${["ready", "question", "locked", "reveal"].includes(H.phase) ? "" : " disabled"}>Skip question</button>
        <button class="btn" data-c="replay"${H.media && H.media !== "img" ? "" : " disabled"}>Replay clip</button>
      </div>
      <div class="card toggles">
        <label class="toggle"><input type="checkbox" data-t="auto"${H.auto ? " checked" : ""}><span><b>Autopilot</b><small>Moves through questions and plays the playlist by itself</small></span></label>
        <label class="toggle"><input type="checkbox" data-t="surpriseOn"${H.surprise ? " checked" : ""}><span><b>Surprise rounds</b><small>Now and then, a ${H.kid ? "kid" : "surprise"} round sneaks in between playlist rounds</small></span></label>
        <label class="toggle"><input type="checkbox" data-t="kid"${H.kid ? " checked" : ""}><span><b>Kid mode 🧸</b><small>At least 30 seconds a question, kid rounds, Jingle Jiggle breaks</small></span></label>
      </div>
      <p class="h-sec">PLAYLIST (${H.queue.length})</p>
      ${H.queue.length ? `<ol class="playlist">${H.queue.map((id, i) => `<li><span class="nm">${i + 1}. ${esc(roundTitle(id))}</span>${i ? `<button data-up="${i}" aria-label="Move up">↑</button>` : ""}<button class="x" data-unq="${i}" aria-label="Remove">✕</button></li>`).join("")}</ol>`
        : `<p class="small">Tap a round below to add it. ▶ plays a round right now.</p>`}
      <div class="h-row"><button class="btn" data-c="queueAll">Add all unplayed</button><button class="btn" data-c="clearQueue"${H.queue.length ? "" : " disabled"}>Clear playlist</button></div>
      ${H.kid ? section("KID ROUNDS 🧸", by("kid")) : ""}
      ${section("ROUNDS", feats)}
      ${section("PICTURES, SOUNDS &amp; VIDEO", by("media"), "These use files you add to assets/media. Rounds without files are greyed out.")}
      ${section("SURPRISE ROUNDS 🚨", by("alarm"))}
      <button class="btn red big-btn" data-c="surprise">Sound a random surprise round now</button>
      ${!H.kid ? section("KID ROUNDS 🧸", by("kid")) : ""}
      ${section("TIEBREAKERS", extra)}
      <p class="h-sec">PLAYERS (${H.players.length})</p>
      <ul class="h-players">${H.players.map(p => `<li>${ornament({ id: p.id, av: p.ph ? "📸" : p.av }, "tiny")}<span class="nm">${esc(p.name)}</span><span class="sc">${p.score}</span>
        <button data-adj="${esc(p.id)}" data-d="-100">−100</button><button data-adj="${esc(p.id)}" data-d="100">+100</button>
        <button class="x" data-kick="${esc(p.id)}">${kickArm === p.id ? "Sure?" : "✕"}</button></li>`).join("") || `<li><span class="nm">Nobody has joined yet.</span></li>`}</ul>
      <p class="h-sec">BIG SCREEN</p>
      <div class="h-row"><button class="btn" data-c="mute">${H.muted ? "Turn sound on" : "Mute sound"}</button>
        <button class="btn" data-c="music"${H.hasMusic ? "" : " disabled"}>${!H.hasMusic ? "No music files" : H.music ? "Music off" : "Music on"}</button>
        <button class="btn" data-c="menu">Go to intermission</button><button class="btn" data-c="lobby">Back to lobby</button></div>`;
  }
  const last = {};
  function render() {
    renderHead();
    if (document.activeElement && document.activeElement.matches("input[type=text], input:not([type])")) return;
    let html;
    if (!code || !pin) html = vLogin();
    else if (!H) html = `<div class="card"><h1>Looking for the big screen…</h1><p>Game ${esc(code)}. Make sure the big screen is open. If this never connects, the PIN may be wrong.</p></div>
      <button class="btn big-btn" data-c="relogin">Enter the code and PIN again</button>`;
    else html = vMain();
    if (last.view !== html) { last.view = html; $("#view").innerHTML = html; }
    $("#foot").innerHTML = `<span>Keep this page private. It shows every answer.</span>`;
  }

  document.addEventListener("submit", e => {
    if (e.target.id !== "loginForm") return;
    e.preventDefault();
    code = $("#codeIn").value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
    pin = $("#pinIn").value.replace(/\D/g, "").slice(0, 4);
    if (code.length !== 4 || pin.length !== 4) return;
    history.replaceState(null, "", "?g=" + code + "#" + pin);
    document.activeElement.blur(); H = null; connect(); render();
  });
  document.addEventListener("change", e => { const t = e.target.dataset.t; if (t) cmd(t, { on: e.target.checked }); });
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-c],[data-q],[data-now],[data-adj],[data-kick],[data-unq],[data-up]");
    if (!t || t.disabled) return;
    if (t.dataset.c) {
      const c = t.dataset.c;
      if (c === "relogin") { pin = ""; H = null; if (ch) ch.close(); ch = null; render(); return; }
      if (c === "mute") cmd("mute", { on: !H.muted });
      else if (c === "music") cmd("music", { on: !H.music });
      else cmd(c);
    } else if (t.dataset.q) { const i = H.queue.indexOf(t.dataset.q); if (i >= 0) cmd("unqueue", { i }); else cmd("queue", { id: t.dataset.q }); }
    else if (t.dataset.now) cmd(t.dataset.kind === "alarm" ? "surprise" : "pick", { id: t.dataset.now });
    else if (t.dataset.unq) cmd("unqueue", { i: +t.dataset.unq });
    else if (t.dataset.up) cmd("qup", { i: +t.dataset.up });
    else if (t.dataset.adj) cmd("adj", { pid: t.dataset.adj, d: +t.dataset.d });
    else if (t.dataset.kick) {
      if (kickArm !== t.dataset.kick) { kickArm = t.dataset.kick; clearTimeout(kickT); kickT = setTimeout(() => { kickArm = ""; render(); }, 3000); render(); return; }
      kickArm = ""; cmd("kick", { pid: t.dataset.kick });
    }
  });

  if (code && pin) connect();
  render();
})();
