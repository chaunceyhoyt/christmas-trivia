/* Host controller: drives the big screen over a channel named with the game's PIN.
   The big screen sends back everything, including the correct answer, so the host can read ahead. */
(() => {
  const $ = s => document.querySelector(s);
  const LETTERS = "ABCD";
  let code = String(new URLSearchParams(location.search).get("g") || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
  let pin = location.hash.slice(1).replace(/\D/g, "").slice(0, 4);
  let H = null, ch = null, seen = 0, kickArm = "", kickT = 0;

  function connect() {
    if (ch) ch.close();
    ch = Net.open("xmas-" + code.toLowerCase() + "-" + pin, { hoststate: h => { if (h && typeof h === "object") { H = h; seen = Date.now(); render(); } } },
      st => { if (st === "SUBSCRIBED") ch.send("hello", {}); render(); });
  }
  setInterval(() => { if (ch && Date.now() - seen > 6000) ch.send("hello", {}); renderHead(); }, 3000);
  function cmd(a, extra) { if (!ch) return; ch.send("cmd", Object.assign({ a }, extra || {})); try { navigator.vibrate && navigator.vibrate(15); } catch (e) {} }

  const nextLabel = () => {
    if (!H) return "Next";
    const last = H.round && H.qi + 1 >= H.round.n;
    return { lobby: "Open the catalog", menu: "Play the next round", intro: "First question", alarm: "First question",
      question: "Reveal the answer", locked: "Reveal the answer", reveal: last ? "Finish the round" : "Next question", roundend: "Back to the catalog" }[H.phase] || "Next";
  };
  const phaseName = p => ({ lobby: "Lobby", menu: "Between rounds", intro: "Round intro", alarm: "ALARM!", question: "Answers open", locked: "Answers locked", reveal: "Answer revealed", roundend: "Round over" }[p] || p);

  function renderHead() {
    const live = Date.now() - seen < 8000;
    $("#head").innerHTML = `<div><div class="script">Host</div><div class="slab">Controller</div></div>
      <div class="me"><b>${code ? esc(code) : "No game"}</b><span class="status-pill">${live ? "● Connected" : "○ Looking for screen"}</span></div>`;
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
    if (r && ["question", "locked", "reveal"].includes(H.phase) && sec) {
      const counts = [0, 0, 0, 0];
      Object.values(sec.ans || {}).forEach(a => counts[a.c]++);
      body = `<p class="p-item"><span>${esc(r.title)}</span><span>Q ${H.qi + 1} of ${r.n} · ${H.answered.length}/${H.players.length} in</span></p>
        <p class="p-q${r.big ? " emoji" : ""}">${esc(sec.q)}</p>
        <ul class="h-choices">${(sec.choices || []).map((c, i) => `<li class="${i === sec.correct ? "right" : ""}"><b>${LETTERS[i]}</b><span>${esc(c)}${i === sec.correct ? " ✓" : ""}</span><span class="n">${counts[i]}</span></li>`).join("")}</ul>
        ${sec.note ? `<p class="mono">${esc(sec.note)}</p>` : ""}`;
    } else if (r) {
      body = `<p class="p-item"><span>${phaseName(H.phase)}</span><span>${r.n} questions · ${r.pts} pt${r.pts > 1 ? "s" : ""}</span></p><h2>${esc(r.title)}</h2>${r.rule ? `<p>${esc(r.rule)}</p>` : ""}${H.phase === "alarm" && r.gag ? `<p><b>Gag:</b> ${esc(r.gag)}</p>` : ""}`;
    } else {
      body = `<p class="p-item"><span>${phaseName(H.phase)}</span><span>${H.players.length} team${H.players.length === 1 ? "" : "s"}</span></p><h2>${H.phase === "lobby" ? "Waiting for guests to join" : "Pick the next round below"}</h2>`;
    }
    return `<div class="card h-now">${body}</div>`;
  }
  function roundBtn(x) {
    return `<button class="h-round${x.played ? " played" : ""}" data-round="${esc(x.id)}" data-kind="${x.kind}" style="--c:${x.kind === "alarm" ? esc(x.c1) : "var(--green)"}"><b>${esc(x.title)}</b><span>${x.n} Q${x.played ? " · played" : ""}</span></button>`;
  }
  function vMain() {
    const inQ = H.phase === "question";
    const alarms = H.rounds.filter(x => x.kind === "alarm"), feats = H.rounds.filter(x => x.kind === "feature");
    return `${vNow()}
      <button class="btn red h-next" data-c="next">${esc(nextLabel())} ▶</button>
      <div class="h-row">
        <button class="btn" data-c="prev">◀ Back</button>
        <button class="btn" data-c="scores">${H.showScores ? "Hide scores" : "Show scores"}</button>
        <button class="btn" data-c="lock"${inQ ? "" : " disabled"}>Lock answers</button>
        <button class="btn" data-c="timer"${inQ ? "" : " disabled"}>15-second timer</button>
      </div>
      <p class="h-sec">ALARM ROUNDS</p>
      <button class="btn red big-btn" data-c="alarm">Sound a random alarm</button>
      <div class="h-rounds">${alarms.map(roundBtn).join("")}</div>
      <p class="h-sec">FEATURE ROUNDS</p>
      <div class="h-rounds">${feats.map(roundBtn).join("")}</div>
      <p class="h-sec">LIGHTS (GOOGLE HOME)</p>
      <div class="card">
        <label class="toggle"><input type="checkbox" id="voiceT"${H.voice ? " checked" : ""}> Big screen says “Hey Google, …” on every alarm</label>
        <p class="mono">Say a light scene now:</p>
        <div class="phrases">${alarms.map(x => `<button data-lights="${esc(x.id)}">${esc(x.phrase)}</button>`).join("")}<button data-lights="normal">trivia mode</button></div>
      </div>
      <p class="h-sec">TEAMS (${H.players.length})</p>
      <ul class="h-players">${H.players.map(p => `<li><span class="nm">${esc(p.name)}</span><span class="sc">${p.score}</span>
        <button data-adj="${esc(p.id)}" data-d="-1">−1</button><button data-adj="${esc(p.id)}" data-d="1">+1</button>
        <button class="x" data-kick="${esc(p.id)}">${kickArm === p.id ? "Sure?" : "✕"}</button></li>`).join("") || `<li><span class="nm">Nobody has joined yet.</span></li>`}</ul>
      <p class="h-sec">BIG SCREEN</p>
      <div class="h-row"><button class="btn" data-c="mute">${H.muted ? "Turn sound on" : "Mute sound"}</button><button class="btn" data-c="menu">Go to catalog</button></div>`;
  }
  function render() {
    renderHead();
    if (document.activeElement && document.activeElement.matches("input[type=text], input:not([type])")) return;
    let html;
    if (!code || !pin) html = vLogin();
    else if (!H) html = `<div class="card"><h1>Looking for the big screen…</h1><p>Game ${esc(code)}. Make sure the big screen is open. If this never connects, the PIN may be wrong.</p></div>
      <button class="btn big-btn" data-c="relogin">Enter the code and PIN again</button>`;
    else html = vMain();
    $("#view").innerHTML = html;
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
  document.addEventListener("change", e => { if (e.target.id === "voiceT") cmd("voice", { on: e.target.checked }); });
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-c],[data-round],[data-lights],[data-adj],[data-kick]");
    if (!t) return;
    if (t.dataset.c) {
      const c = t.dataset.c;
      if (c === "relogin") { pin = ""; H = null; if (ch) ch.close(); ch = null; render(); return; }
      if (c === "timer") cmd("timer", { s: 15 });
      else if (c === "mute") cmd("mute", { on: !H.muted });
      else cmd(c);
    } else if (t.dataset.round) cmd(t.dataset.kind === "alarm" ? "alarm" : "pick", { id: t.dataset.round });
    else if (t.dataset.lights) cmd("lights", { id: t.dataset.lights });
    else if (t.dataset.adj) cmd("adj", { pid: t.dataset.adj, d: +t.dataset.d });
    else if (t.dataset.kick) {
      if (kickArm !== t.dataset.kick) { kickArm = t.dataset.kick; clearTimeout(kickT); kickT = setTimeout(() => { kickArm = ""; render(); }, 3000); render(); return; }
      kickArm = ""; cmd("kick", { pid: t.dataset.kick });
    }
  });

  if (code && pin) connect();
  render();
})();
