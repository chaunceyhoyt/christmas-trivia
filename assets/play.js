/* Player phone: join with a team name, answer questions, see results. The big screen does all scoring. */
(() => {
  const $ = s => document.querySelector(s);
  const LETTERS = "ABCD";
  const cleanCode = s => String(s || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
  let code = cleanCode(new URLSearchParams(location.search).get("g"));

  let me = null;
  try { me = JSON.parse(localStorage.getItem("xmas-me") || "null"); } catch (e) {}
  if (!me || !me.pid) me = { pid: "p" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36), name: "" };
  const saveMe = () => { try { localStorage.setItem("xmas-me", JSON.stringify(me)); } catch (e) {} };
  saveMe();

  let S = null, ch = null, online = false, gotAt = 0, editing = !me.name, connectAt = 0;
  const picks = {}; // epoch -> choice index
  let seenAlarm = "", seenReveal = -1, alarmSeenAt = 0;

  function connect() {
    if (ch) ch.close();
    S = null; connectAt = Date.now();
    ch = Net.open("xmas-" + code.toLowerCase(), { state: onState }, st => {
      online = st === "SUBSCRIBED";
      if (online) { join(); ch.send("hello", {}); }
      render();
    });
  }
  function join() { if (ch && me.name && !editing) ch.send("join", { pid: me.pid, name: me.name }); }
  setInterval(join, 15000);
  setInterval(() => { if (code && online && Date.now() - gotAt > 8000) ch.send("hello", {}); render(); }, 4000);

  function onState(s) {
    if (!s || typeof s !== "object") return;
    S = s; gotAt = Date.now();
    const alarmKey = s.phase === "alarm" && s.round ? s.round.id : "";
    if (alarmKey && alarmKey !== seenAlarm) { alarmSeenAt = Date.now() - Math.min(s.alarmAge || 0, 3000); buzz([300, 120, 300, 120, 500]); }
    seenAlarm = alarmKey;
    if (s.phase === "reveal" && s.epoch !== seenReveal) {
      seenReveal = s.epoch;
      const r = s.reveal && s.reveal.res && s.reveal.res[me.pid];
      if (r) buzz(r.ok ? [80] : [250, 80, 250]);
    }
    if (inRoster() === false && me.name && !editing) join();
    render();
  }
  function buzz(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} }
  function inRoster() { return S ? S.players.some(p => p.id === me.pid) : null; }
  function myRow() { return S ? S.players.find(p => p.id === me.pid) : null; }
  function rank() { if (!S) return 0; const i = S.players.findIndex(p => p.id === me.pid); return i + 1; }

  /* ---------- views ---------- */
  function vCode() {
    return `<form class="card" id="codeForm"><h1>Join the game</h1><p>Type the four-letter code from the big screen.</p>
      <div class="field"><label for="codeIn">Game code</label><input id="codeIn" class="code-input" maxlength="4" autocomplete="off" autocapitalize="characters" value="${esc(code)}" required></div>
      <p></p><button class="btn red big-btn" type="submit">Find the game</button></form>`;
  }
  function vName() {
    return `<form class="card" id="nameForm"><h1>Pick a team name</h1><p>It shows up on the big screen. Keep it clean-ish.</p>
      <div class="field"><label for="nameIn">Team name</label><input id="nameIn" maxlength="24" autocomplete="off" value="${esc(me.name)}" placeholder="The Wet Bandits" required></div>
      <p></p><button class="btn red big-btn" type="submit">${me.name ? "Save name" : "Join the game"}</button></form>`;
  }
  function vWait(title, text) { return `<div class="card"><h1>${esc(title)}</h1><p>${esc(text)}</p></div>`; }
  function scoreCard() {
    const r = myRow(); if (!r) return "";
    return `<div class="card"><p class="mono">YOUR ORDER TOTAL</p><h1>${r.score} point${r.score === 1 ? "" : "s"}</h1><p class="mono">Place ${rank()} of ${S.players.length}</p></div>`;
  }
  const waits = ["Topping off the eggnog.", "Untangling the lights.", "Rewinding the tape.", "Fighting over the last Turbo-Man.", "Checking it twice.", "Waiting on the host to flip the page."];
  function vQuestion() {
    const r = S.round, picked = picks[S.epoch], open = S.phase === "question", rev = S.phase === "reveal";
    const res = rev && S.reveal && S.reveal.res ? S.reveal.res[me.pid] : null;
    const tLeft = open && S.tLeft ? Math.max(0, Math.ceil((S.tLeft - (Date.now() - gotAt)) / 1000)) : 0;
    let status = "";
    if (open) status = picked == null ? "Tap your answer" : (S.answered.includes(me.pid) ? "Order received ✓ Tap another to change it" : "Sending…");
    else if (S.phase === "locked") status = picked == null ? "Orders closed. You didn’t answer." : "Orders closed. Fingers crossed.";
    let result = "";
    if (rev) {
      const right = S.choices[S.reveal.correct];
      if (res && res.c >= 0) {
        result = `<div class="card result ${res.ok ? "ok" : "bad"}"><div class="mark">${res.ok ? "✓" : "✗"}</div>
          <div class="delta">${res.d > 0 ? "+" : ""}${res.d} pt${Math.abs(res.d) === 1 ? "" : "s"}</div>
          ${res.ok ? "" : `<p>The answer was <b>${esc(right)}</b></p>`}
          ${res.first ? "<p><b>Fastest finger!</b> Bonus point.</p>" : ""}${res.stole ? "<p>You stole a point from the leader.</p>" : ""}
          ${res.robbed ? `<p>The Grinch took ${res.robbed} from you.</p>` : ""}</div>
          ${!res.ok && r.squirrel ? `<div class="squirrel">YELL “SQUIRREL!”</div>` : ""}`;
      } else {
        result = `<div class="card result bad"><div class="mark">–</div><p>No answer this time. It was <b>${esc(right)}</b></p>${res && res.robbed ? `<p>The Grinch took ${res.robbed} from you.</p>` : ""}</div>`;
      }
    }
    return `${result}<div class="card"><p class="p-item"><span>${esc(r.title)}</span><span>${S.qi + 1} of ${r.n}${tLeft ? ` · <span class="p-timer" id="pTimer">${tLeft}</span>s` : ""}</span></p>
      ${r.lead ? `<p class="mono">${esc(r.lead)}</p>` : ""}<p class="p-q${r.big ? " emoji" : ""}">${esc(S.q)}</p></div>
      <div class="p-choices">${S.choices.map((c, i) => {
        const cls = `p-ch c${i}${picked === i ? " picked" : ""}`;
        const mark = rev ? (i === S.reveal.correct ? " ✓" : "") : "";
        return `<button class="${cls}" data-pick="${i}"${open ? "" : " disabled"}><span class="letter">${LETTERS[i]}</span><span>${esc(c)}${mark}</span></button>`;
      }).join("")}</div>
      ${status ? `<p class="p-status">${status}</p>` : ""}`;
  }
  function vAlarm() {
    const r = S.round, revealed = Date.now() - alarmSeenAt > 2200;
    return `<div class="alarm p-alarm" data-fx="${esc(r.fx)}" style="--fx-a:${esc(r.c1)};--fx-b:${esc(r.c2)};--fx-ink:${esc(r.ink || "#fff")}">
      <div class="beacon"></div><div class="rain">${emojiRain(r.emoji, 16)}</div>
      <div class="alarm-inner">${revealed
        ? `<div class="uhoh small">UH OH…</div><div class="itsa">it’s a</div><h1 class="alarm-title">${esc(r.title.toUpperCase())}!</h1><p class="tagline">${esc(r.tagline)}</p>
           <div class="alarm-cards"><p><b>House rule</b>${esc(r.rule)}</p><p><b>Do it right now</b>${esc(r.gag)}</p></div>`
        : `<div class="uhoh">UH OH…</div><div class="alarm-line">${esc(r.alarm)}</div>`}</div></div>`;
  }
  function vScores() {
    return `<div class="card"><h2>Order totals</h2><ol class="ranklist">${S.players.map((p, i) => `<li class="${p.id === me.pid ? "me" : ""}"><span>${i + 1}.</span><span>${esc(p.name)}</span><span>${p.score}</span></li>`).join("")}</ol></div>`;
  }

  function render() {
    const active = document.activeElement;
    if (active && active.matches("input")) return; // don't wipe what someone is typing
    const r = S && S.round;
    document.documentElement.style.setProperty("--theme", r && r.kind === "alarm" && ["alarm", "intro", "question", "locked", "reveal"].includes(S.phase) ? (r.c1 === "#ffd166" ? "#c98c06" : r.c1) : "var(--red)");
    const row = myRow();
    $("#head").innerHTML = `<div><div class="script">Rewind</div><div class="slab">Christmas Trivia</div></div>
      <div class="me">${me.name && !editing ? `<b>${esc(me.name)}</b>${row ? `${row.score} pts · #${rank()}` : ""}` : code ? `Game ${esc(code)}` : ""}</div>`;
    let html = "", over = "";
    if (!code) html = vCode();
    else if (editing) html = vName();
    else if (!S) html = Date.now() - connectAt > 9000
      ? vWait("Can’t find that game", `Nothing is answering for code ${code}. Check the code on the big screen.`) + `<button class="btn big-btn" data-act="code">Enter a different code</button>`
      : vWait("Finding the big screen…", `Game ${code}`);
    else if (!inRoster()) html = vWait("Signing you in…", "Hang on a second.");
    else {
      switch (S.phase) {
        case "lobby": html = vWait(`You’re in, ${me.name}!`, "Watch the big screen. The game starts soon.") + `<p class="p-status">${S.players.length} team${S.players.length === 1 ? "" : "s"} on the list</p>`; break;
        case "menu": html = scoreCard() + vWait("Between rounds", waits[Math.floor(gotAt / 30000) % waits.length]); break;
        case "intro": html = `<div class="card"><p class="mono">UP NEXT</p><h1>${esc(r.title)}</h1><p>${esc(r.sub)}</p>${r.rule ? `<p><b>${esc(r.rule)}</b></p>` : ""}<p class="mono">${r.pts} pt${r.pts > 1 ? "s" : ""} each</p></div>`; break;
        case "alarm": html = vWait(r.title, r.rule); over = vAlarm(); break;
        case "question": case "locked": case "reveal": html = vQuestion(); break;
        case "roundend": html = scoreCard() + vScores(); break;
        default: html = scoreCard();
      }
      if (S.showScores && S.phase !== "roundend") html = vScores() + html;
    }
    $("#view").innerHTML = html;
    $("#overlay").innerHTML = over;
    $("#foot").innerHTML = `<span>${online ? "● Online" : "○ Connecting"}</span>${code ? `<span>Game ${esc(code)}</span>` : ""}
      ${me.name && !editing ? `<button data-act="rename">Change team name</button>` : ""}${code ? `<button data-act="code">Different game</button>` : ""}`;
    const f = $("#nameIn") || $("#codeIn");
    if (f && !f.value) f.focus();
  }

  /* timer countdown without full re-render */
  setInterval(() => {
    const el = $("#pTimer");
    if (el && S && S.tLeft) el.textContent = Math.max(0, Math.ceil((S.tLeft - (Date.now() - gotAt)) / 1000));
    if (S && S.phase === "alarm" && Date.now() - alarmSeenAt < 2600 && Date.now() - alarmSeenAt > 2200) render();
  }, 250);

  document.addEventListener("submit", e => {
    e.preventDefault();
    if (e.target.id === "codeForm") {
      const v = cleanCode($("#codeIn").value);
      if (v.length !== 4) return;
      code = v; history.replaceState(null, "", "?g=" + code);
      $("#codeIn").blur(); connect(); render();
    } else if (e.target.id === "nameForm") {
      const v = $("#nameIn").value.trim().slice(0, 24);
      if (!v) return;
      me.name = v; saveMe(); editing = false;
      $("#nameIn").blur(); join(); render();
    }
  });
  document.addEventListener("click", e => {
    const p = e.target.closest("[data-pick]");
    if (p && S && S.phase === "question") {
      const c = +p.dataset.pick;
      picks[S.epoch] = c;
      ch.send("answer", { pid: me.pid, epoch: S.epoch, c });
      buzz([30]); render();
      return;
    }
    const a = e.target.closest("[data-act]");
    if (!a) return;
    if (a.dataset.act === "rename") { editing = true; render(); }
    if (a.dataset.act === "code") { code = ""; S = null; if (ch) ch.close(); ch = null; history.replaceState(null, "", location.pathname); render(); }
  });

  if (code) connect();
  render();
})();
