/* Player phone: join with a name and a Christmas avatar (or your own face), answer questions, see results.
   The big screen does all scoring. */
(() => {
  const $ = s => document.querySelector(s);
  const LETTERS = "ABCD";
  const cleanCode = s => String(s || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
  let code = cleanCode(new URLSearchParams(location.search).get("g"));

  let me = null;
  try { me = JSON.parse(localStorage.getItem("xmas-me") || "null"); } catch (e) {}
  if (!me || !me.pid) me = { pid: "p" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36), name: "" };
  if (!me.av) me.av = AVATARS[Math.floor(Math.random() * AVATARS.length)];
  const saveMe = () => { try { localStorage.setItem("xmas-me", JSON.stringify(me)); } catch (e) {} };
  saveMe();
  const myOrn = (cls = "") => ornament({ id: me.pid, av: me.av, photo: me.photo || "" }, cls);

  let S = null, ch = null, online = false, gotAt = 0, editing = !me.name, connectAt = 0, photoSentAt = 0;
  let draftAv = me.av, draftPhoto = me.photo || "";
  const picks = {}; // epoch -> choice index
  let seenAlarm = "", seenReveal = -1, alarmSeenAt = 0;

  function connect() {
    if (ch) ch.close();
    S = null; connectAt = Date.now();
    ch = Net.open("xmas-" + code.toLowerCase(), { state: onState }, st => {
      online = st === "SUBSCRIBED";
      if (online) { join(); ch.send("hello", { pid: me.pid }); }
      render();
    });
  }
  function join(again) { if (ch && me.name && !editing) ch.send("join", { pid: me.pid, name: me.name, av: me.av, ph: me.photo ? me.ph : "", again: !!again }); }
  const removed = () => !!(S && S.kicked && S.kicked.includes(me.pid));
  setInterval(join, 15000);
  setInterval(() => { if (code && online && Date.now() - gotAt > 8000) ch.send("hello", { pid: me.pid }); render(); }, 4000);

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
    const row = myRow();
    if (inRoster() === false && me.name && !editing && !removed()) join();
    if (s.draw && pad && pad.sent && pad.seq === s.draw.seq && !s.draw.done.includes(me.pid) && Date.now() - pad.sentAt > 3000) sendDrawing();
    if (row && me.photo && row.ph !== me.ph && Date.now() - photoSentAt > 4000) { photoSentAt = Date.now(); ch.send("photo", { pid: me.pid, ph: me.ph, data: me.photo }); }
    render();
  }
  function buzz(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} }
  function inRoster() { return S ? S.players.some(p => p.id === me.pid) : null; }
  function myRow() { return S ? S.players.find(p => p.id === me.pid) : null; }
  function rank() { if (!S) return 0; return S.players.findIndex(p => p.id === me.pid) + 1; }
  function hash(str) { let h = 5381; for (let i = 0; i < str.length; i += 7) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0; return h.toString(36) + str.length.toString(36); }

  /* ---------- views ---------- */
  function vCode() {
    return `<form class="card" id="codeForm"><h1>Join the game</h1><p>Type the four-letter code from the big screen.</p>
      <div class="field"><label for="codeIn">Game code</label><input id="codeIn" class="code-input" maxlength="4" autocomplete="off" autocapitalize="characters" value="${esc(code)}" required></div>
      <p></p><button class="btn red big-btn" type="submit">Find the game</button></form>`;
  }
  function vName() {
    const preview = ornament({ id: me.pid, av: draftAv, photo: draftPhoto }, "big");
    return `<form class="card" id="nameForm"><h1>Who are you?</h1>
      <div class="pick-preview">${preview}</div>
      <div class="field"><label for="nameIn">Your name</label><input id="nameIn" maxlength="24" autocomplete="off" value="${esc(me.name)}" placeholder="Cousin Eddie" required></div>
      <p class="label">Pick your Christmas face</p>
      <div class="av-grid">${AVATARS.map(a => `<button type="button" class="av${!draftPhoto && a === draftAv ? " on" : ""}" data-av="${esc(a)}">${a}</button>`).join("")}</div>
      <label class="btn green big-btn photo-btn">📸 Use my face<input type="file" id="photoIn" accept="image/*" capture="user" hidden></label>
      ${draftPhoto ? `<button type="button" class="link" data-act="nophoto">Remove my photo</button>` : ""}
      <button class="btn red big-btn" type="submit">${me.name ? "Save" : "Join the game"}</button></form>`;
  }
  function vWait(title, text) { return `<div class="card"><h1>${esc(title)}</h1><p>${esc(text)}</p></div>`; }
  function scoreCard() {
    const r = myRow(); if (!r) return "";
    return `<div class="card score-card">${myOrn("big")}<div><p class="label">YOUR SCORE</p><h1>${r.score.toLocaleString()}</h1><p class="small">Place ${rank()} of ${S.players.length}${r.streak >= 3 ? ` · ❄️ streak ×${r.streak}` : ""}</p></div></div>`;
  }
  const waits = ["Topping off the eggnog.", "Untangling the lights.", "Rewinding the tape.", "Fighting over the last Turbo-Man.", "Checking it twice.", "Vacuuming up the tinsel.", "Hiding the fruitcake."];
  function mediaHint() {
    return { tune: "🎶 Listen to the music box on the TV!", audio: "📻 Listen to the TV!", img: "👀 Look at the picture on the TV!", video: "📺 Watch the TV!" }[S.media] || "";
  }
  function qCard() {
    const r = S.round;
    return `<div class="card"><p class="p-item"><span>${esc(r.title)}</span><span>${S.qi + 1} of ${r.n}</span></p>
      <div class="p-meta">${toughMeter(S.tough, r.mult)}${S.golden ? `<span class="gold-pill">🌟 Golden · double points</span>` : ""}</div>
      ${S.media ? `<p class="hint-line">${mediaHint()}</p>` : ""}
      ${r.lead && !S.media ? `<p class="small">${esc(r.lead)}</p>` : ""}${S.media ? "" : `<p class="p-q${r.big ? " emoji" : ""}">${esc(S.q)}</p>`}</div>`;
  }
  function vReady() {
    return `${qCard()}<div class="card getready-card"><b>Get ready…</b><div class="getready"><i id="readyBar"></i></div></div>`;
  }
  function vQuestion() {
    const r = S.round, picked = picks[S.epoch], open = S.phase === "question" && !S.paused, rev = S.phase === "reveal";
    const res = rev && S.reveal && S.reveal.res ? S.reveal.res[me.pid] : null;
    let status = "";
    if (S.phase === "question") status = S.paused ? "Paused" : picked == null ? "Tap your answer!" : (S.answered.includes(me.pid) ? "Locked in ✓ Tap another to change it" : "Sending…");
    else if (S.phase === "locked") status = picked == null ? "Time’s up! You didn’t answer." : "Time’s up! Watch your ornament land on the TV.";
    let result = "";
    if (rev) {
      const right = S.choices[S.reveal.correct];
      if (res && res.c >= 0) {
        const lines = [];
        if (res.ok) {
          lines.push(`Right answer <b>+${res.base}</b>`);
          if (res.speed) lines.push(`Speed bonus <b>+${res.speed}</b>`);
          if (res.golden) lines.push(`🌟 Golden ornament <b>×2</b>`);
          if (res.sb) lines.push(`❄️ Snowball streak ×${res.streak} <b>+${res.sb}</b>`);
        } else lines.push(`The answer was <b>${esc(right)}</b>`);
        if (res.lost) lines.push(`Wrong answer <b>−${res.lost}</b>`);
        if (res.everyone) lines.push(`Snow day bonus <b>+${res.everyone}</b>`);
        if (res.first) lines.push(`Turbo bonus <b>+${res.first}</b>`);
        if (res.stole) lines.push(`Stole from the leader <b>+${res.stole}</b>`);
        if (res.robbed) lines.push(`The Grinch took <b>${res.robbed}</b> from you`);
        result = `<div class="card result ${res.ok ? "ok" : "bad"}"><div class="mark">${res.ok ? "✓" : "✗"}</div>
          <div class="delta">${res.d > 0 ? "+" : ""}${res.d}</div><ul class="breakdown">${lines.map(l => `<li>${l}</li>`).join("")}</ul></div>
          ${!res.ok && r.squirrel ? `<div class="squirrel">YELL “SQUIRREL!”</div>` : ""}`;
      } else {
        result = `<div class="card result bad"><div class="mark">–</div><p>No answer this time. It was <b>${esc(right)}</b></p>${res && res.robbed ? `<p>The Grinch took ${res.robbed} from you.</p>` : ""}</div>`;
      }
    }
    return `${result}${qCard()}
      ${S.phase === "question" ? `<div class="p-clock"><b id="pTimer"></b><div class="cane"><i id="pCane"></i></div></div>` : ""}
      <div class="p-choices">${(S.choices || []).map((c, i) => {
        const cls = `p-ch c${i}${picked === i ? " picked" : ""}${rev && i === S.reveal.correct ? " right" : ""}`;
        return `<button class="${cls}" data-pick="${i}"${open ? "" : " disabled"}><span class="letter">${LETTERS[i]}</span><span>${esc(c)}${rev && i === S.reveal.correct ? " ✓" : ""}</span>${picked === i ? `<span class="mine">${myOrn("tiny")}</span>` : ""}</button>`;
      }).join("")}</div>
      ${status ? `<p class="p-status">${status}</p>` : ""}`;
  }
  function vAlarm() {
    const r = S.round, revealed = Date.now() - alarmSeenAt > 2200;
    return `<div class="alarm p-alarm" data-fx="${esc(r.fx)}" style="--fx-a:${esc(r.c1)};--fx-b:${esc(r.c2)};--fx-ink:${esc(r.ink || "#fff")}">
      <div class="beacon"></div><div class="rain">${emojiRain(r.emoji, 16)}</div>
      <div class="alarm-inner">${revealed
        ? `<div class="uhoh small">UH OH…</div><div class="itsa">it’s a</div><h1 class="alarm-title">${esc(r.title.toUpperCase())}!</h1><p class="tagline">${esc(r.tagline)}</p>
           <div class="alarm-cards"><p><b>House rule</b>${esc(r.rule)}</p></div>`
        : `<div class="uhoh">UH OH…</div><div class="alarm-line">${esc(r.alarm)}</div>`}</div></div>`;
  }
  function vSilly() {
    return `<div class="card silly-card"><h1 class="jiggle">JINGLE JIGGLE!</h1><p class="script">Everybody, right now…</p><p class="dare">${esc(S.silly)}</p></div>`;
  }
  function vScores() {
    return `<div class="card"><h2>The Sleigh Race</h2><ol class="ranklist">${S.players.map((p, i) => `<li class="${p.id === me.pid ? "me" : ""}"><span>${i + 1}.</span>${ornament({ id: p.id, av: p.ph ? "📸" : p.av, photo: p.id === me.pid ? me.photo : "" }, "tiny")}<span>${esc(p.name)}</span><span>${p.score.toLocaleString()}</span></li>`).join("")}</ol></div>`;
  }
  function vIntro() {
    const r = S.round;
    return `<div class="card intro-card"><p class="label">${r.kind === "kid" ? "KID ROUND" : "UP NEXT"}</p><h1>${esc(r.title)}</h1><p>${esc(r.sub)}</p>${r.rule ? `<p class="rule">${esc(r.rule)}</p>` : ""}
      <p class="small">⏱ ${r.timer} seconds a question · ⚡ faster answers score more</p></div>`;
  }

  const last = {};
  let lastViewKey = "";
  function put(sel, html) { if (last[sel] === html) return; last[sel] = html; $(sel).innerHTML = html; }
  function render() {
    const activeEl = document.activeElement;
    const viewKey = S ? S.phase + ":" + S.epoch + ":" + (S.gif ? S.gif.pi : "") + (S.fib ? S.fib.pi : "") : "";
    if (activeEl && activeEl.matches("input:not([type=file])") && viewKey === lastViewKey) return; // don't wipe what someone is typing
    lastViewKey = viewKey;
    if (cropping) return;
    const r = S && S.round;
    document.documentElement.style.setProperty("--theme", r && (r.kind === "alarm" || r.kind === "kid") && r.c1 && ["alarm", "intro", "silly", "ready", "question", "locked", "reveal"].includes(S.phase) ? (r.c1 === "#ffd166" ? "#c98c06" : r.c1) : "var(--cran)");
    const row = myRow();
    put("#head", `<div class="brand"><span class="n1">Rewind</span><span class="n2">Christmas Trivia</span></div>
      <div class="me">${me.name && !editing ? `${myOrn("head")}<span><b>${esc(me.name)}</b>${row ? `${row.score.toLocaleString()} pts · #${rank()}` : ""}</span>` : code ? `Game ${esc(code)}` : ""}</div>`);
    let html = "", over = "";
    if (!code) html = vCode();
    else if (editing) html = vName();
    else if (!S) html = Date.now() - connectAt > 9000
      ? vWait("Can’t find that game", `Nothing is answering for code ${code}. Check the code on the big screen.`) + `<button class="btn big-btn" data-act="code">Enter a different code</button>`
      : vWait("Finding the big screen…", `Game ${code}`);
    else if (removed()) html = vWait("You were taken out of the game", "No hard feelings! Tap below to hop back in.") + `<button class="btn red big-btn" data-act="again">Join again</button>`;
    else if (!inRoster()) html = vWait("Signing you in…", "Hang on a second.");
    else {
      switch (S.phase) {
        case "lobby": html = `<div class="card welcome">${myOrn("huge")}<h1>You’re in, ${esc(me.name)}!</h1><p>Look for your ornament on the big screen. The game starts soon.</p></div><p class="p-status">${S.players.length} on the nice list</p>`; break;
        case "menu": html = scoreCard() + vWait(S.hold ? "Intermission ☕" : S.next && S.next[0] ? "Up next: " + S.next[0] : "Between rounds", waits[Math.floor(gotAt / 30000) % waits.length]); break;
        case "drawpick": html = vDrawPick(); break;
        case "finale": html = vFinale(); break;
        case "gifpick": html = vGifPick(); break;
        case "fibwrite": html = vFibWrite(); break;
        case "fibvote": html = vFibVote(); break;
        case "fibresult": html = vFibResult(); break;
        case "gifvote": html = vGifVote(); break;
        case "gifresult": html = vGifResult(); break;
        case "drawing": html = vDrawing(); break;
        case "intro": html = vIntro(); break;
        case "alarm": html = vWait(r.title, r.rule); over = vAlarm(); break;
        case "silly": html = vSilly(); break;
        case "ready": html = vReady(); break;
        case "question": case "locked": case "reveal": html = S.draw && S.draw.artist === me.pid ? vArtist() : vQuestion(); break;
        case "roundend": html = scoreCard() + vScores(); break;
        default: html = scoreCard();
      }
      if (S.showScores && S.phase !== "roundend") html = vScores() + html;
      if (S.paused) over = `<div class="pause-card doily"><b>Paused</b><span>The host hit pause. Grab a cookie!</span></div>`;
    }
    put("#view", html);
    put("#overlay", over);
    put("#foot", `<span>${online ? "● Online" : "○ Connecting"}</span>${code ? `<span>Game ${esc(code)}</span>` : ""}
      ${me.name && !editing ? `<button data-act="rename">Change name or face</button>` : ""}${code ? `<button data-act="code">Different game</button>` : ""}`);
    timers(); attachPad(); attachGif(); fibStatus();
    const f = $("#nameIn") || $("#codeIn");
    if (f && !f.value) f.focus();
  }

  /* Countdown and candy-cane bars, kept in step with the big screen without re-rendering. */
  function timers() {
    if (!S) return;
    const el = $("#pTimer"), cane = $("#pCane"), rb = $("#readyBar");
    const since = Date.now() - gotAt;
    if (["question", "drawing", "gifpick", "gifvote", "fibwrite", "fibvote"].includes(S.phase) && S.tLeft) {
      const left = S.paused ? S.tLeft : Math.max(0, S.tLeft - since);
      if (el) el.textContent = Math.ceil(left / 1000);
      if (cane && !cane.dataset.e) {
        cane.dataset.e = S.epoch;
        cane.style.animationDuration = S.tLimit + "s";
        cane.style.animationDelay = -((S.tLimit * 1000 - left) / 1000) + "s";
      }
      if (cane) cane.style.animationPlayState = S.paused ? "paused" : "running";
      if (S.phase === "drawing" && pad && !pad.sent && left <= 300 && !S.paused) sendDrawing();
    }
    if (S.phase === "ready" && rb && !rb.dataset.e) {
      const left = Math.max(0, S.stepLeft - since);
      rb.dataset.e = S.epoch; rb.style.animationDuration = left + "ms";
    }
  }
  setInterval(() => {
    timers();
    if (S && S.phase === "alarm" && Date.now() - alarmSeenAt < 2600 && Date.now() - alarmSeenAt > 2200) render();
  }, 250);

  /* ---------- GIF Wrapped ---------- */
  const GIFKEY = (window.TRIVIA_CONFIG && TRIVIA_CONFIG.giphyKey) || "";
  let gif = { key: "", results: [], sel: null, sent: false, q: "" }, gifT = 0, gifReq = 0;
  let gifCache = {};
  try { gifCache = JSON.parse(localStorage.getItem("xmas-gifcache") || "{}") || {}; } catch (e) {}
  function saveGifCache() {
    const keep = Object.entries(gifCache).filter(([, v]) => Date.now() - v.at < 3600000).sort((a, b) => b[1].at - a[1].at).slice(0, 30);
    gifCache = Object.fromEntries(keep);
    try { localStorage.setItem("xmas-gifcache", JSON.stringify(gifCache)); } catch (e) {}
  }
  function vGifPick() {
    const g = S.gif;
    return `<div class="card"><p class="p-item"><span>GIF Wrapped</span><span>${g.pi + 1} of ${g.n}</span></p><p class="p-q">${esc(g.prompt)}</p></div>
      <div class="p-clock"><b id="pTimer"></b><div class="cane"><i id="pCane"></i></div></div>
      <div class="card gif-panel">
        <div class="gif-search"><input id="gifQ" type="search" placeholder="Search Christmas GIFs…" autocomplete="off" enterkeyhint="search"><button class="btn green" data-act="gifgo">Search</button></div>
        <div class="gif-chips">${["funny", "Elf", "Home Alone", "Grinch", "Santa", "Christmas Vacation", "shocked", "dancing", "fail"].map(t => `<button data-gq="${esc(t)}">${esc(t)}</button>`).join("")}</div>
        <div class="gif-res" id="gifRes"></div>
        <p class="giphy-tag dark">Powered by GIPHY</p>
      </div>
      <div class="card gif-sel" id="gifSel" hidden>
        <img id="gifSelImg" alt="">
        <div class="field"><label for="gifCap">Caption (optional)</label><input id="gifCap" maxlength="80" autocomplete="off" placeholder="Add something funny…"></div>
        <button class="btn red big-btn" data-act="gifsend">Send it! 🎁</button>
        <p class="p-status" id="gifStatus"></p>
      </div>`;
  }
  /* The GIF panel fills in without re-rendering, so typing and results aren't wiped. */
  function attachGif() {
    if (!S || S.phase !== "gifpick" || !S.gif || !$("#gifRes")) return;
    const key = S.gif.seq + ":" + S.gif.pi;
    if (gif.key !== key) { gif = { key, results: [], sel: null, sent: false, q: "" }; }
    if (!gif.results.length) searchGif("funny"); else drawGifs();
    if (gif.sel) showSel();
    const st = $("#gifStatus"); if (st) st.textContent = S.gif.done.includes(me.pid) ? "Sent! Pick another to change it." : "";
  }
  function searchGif(term) {
    gif.q = term;
    const box = $("#gifRes"); if (!box) return;
    if (!GIFKEY) { box.innerHTML = `<p class="small">The host hasn’t added a GIPHY key yet.</p>`; return; }
    box.innerHTML = `<p class="small">Looking for Christmas GIFs…</p>`;
    const id = ++gifReq;
    const q = /christmas|xmas/i.test(term) ? term : "christmas " + term;
    /* Reuse recent results for the same search, so GIPHY's hourly limit lasts the whole party. */
    const ck = (S.gif.rating + ":" + q).toLowerCase(), hit = gifCache[ck];
    if (hit && Date.now() - hit.at < 3600000) { gif.results = hit.list; drawGifs(); return; }
    fetch(`https://api.giphy.com/v1/gifs/search?api_key=${encodeURIComponent(GIFKEY)}&q=${encodeURIComponent(q)}&limit=24&rating=${S.gif.rating}&lang=en&bundle=messaging_non_clips`)
      .then(r => r.json()).then(j => {
        if (id !== gifReq) return;
        gif.results = (j.data || []).map(d => {
          const im = d.images || {}, sm = im.fixed_width_small || im.fixed_width || {}, big = im.downsized_medium || im.fixed_height || im.downsized || {};
          return { s: sm.url, b: big.url, w: +sm.width || 100, h: +sm.height || 100 };
        }).filter(x => x.s && x.b);
        if (gif.results.length) { gifCache[ck] = { at: Date.now(), list: gif.results }; saveGifCache(); }
        drawGifs();
      }).catch(() => { if (id === gifReq && $("#gifRes")) $("#gifRes").innerHTML = `<p class="small">Couldn’t reach GIPHY. Check your connection and try again.</p>`; });
  }
  function drawGifs() {
    const box = $("#gifRes"); if (!box) return;
    box.innerHTML = gif.results.length ? gif.results.map((x, i) => `<button class="gif-opt${gif.sel === x ? " on" : ""}" data-gif="${i}"><img src="${esc(x.s)}" alt="" loading="lazy"></button>`).join("")
      : `<p class="small">No Christmas GIFs for “${esc(gif.q)}”. Try another word.</p>`;
  }
  function showSel() {
    const box = $("#gifSel"); if (!box || !gif.sel) return;
    box.hidden = false; $("#gifSelImg").src = gif.sel.b;
  }
  function vGifVote() {
    const g = S.gif, mine = g.voted.includes(me.pid) ? myVote : null;
    return `<div class="card"><p class="p-item"><span>GIF Wrapped · vote!</span><span>${g.pi + 1} of ${g.n}</span></p><p class="p-q">${esc(g.prompt)}</p></div>
      <div class="p-clock"><b id="pTimer"></b><div class="cane"><i id="pCane"></i></div></div>
      <p class="p-status">Tap the funniest one. You can’t vote for your own!</p>
      <div class="gif-vote">${(g.cards || []).map((c, i) => `<button class="gif-vc${mine === c.pid ? " on" : ""}" data-gv="${esc(c.pid)}"${c.pid === me.pid ? " disabled" : ""}>
        <span class="num">${i + 1}</span><img src="${esc(c.s)}" alt="">${c.cap ? `<span class="cap">${esc(c.cap)}</span>` : ""}${c.pid === me.pid ? `<span class="yours">Yours</span>` : ""}</button>`).join("")}</div>`;
  }
  let myVote = null;
  function vGifResult() {
    const g = S.gif, x = g.res && g.res[me.pid];
    if (!x) return vWait("The votes are in!", "Look at the TV to see who won.");
    return `<div class="card welcome">${x.best ? `<div class="trophy">🏆</div><p class="label">BEST IN SHOW!</p>` : `<div class="trophy">🎁</div>`}
      <h1>${x.votes} vote${x.votes === 1 ? "" : "s"}</h1><p><b>+${x.d}</b> points</p></div>`;
  }

  /* ---------- Fa-La-La Lies ---------- */
  const blank = q => esc(q).replace("____", "<u>______</u>");
  function vFibWrite() {
    const f = S.fib;
    return `<div class="card"><p class="p-item"><span>Fa-La-La Lies</span><span>${f.pi + 1} of ${f.n}</span></p><p class="p-q">${blank(f.q)}</p></div>
      <div class="p-clock"><b id="pTimer"></b><div class="cane"><i id="pCane"></i></div></div>
      <form class="card" id="fibForm"><div class="field"><label for="fibIn">Your fake answer</label><input id="fibIn" maxlength="40" autocomplete="off" autocorrect="off" placeholder="Make it believable…" required></div>
        <p></p><button class="btn red big-btn" type="submit">Send my fib 🤫</button><p class="p-status" id="fibStatus"></p></form>`;
  }
  /* Status line under the fib box, updated without re-rendering so typing isn't interrupted. */
  function fibStatus() {
    const el = $("#fibStatus"); if (!el || !S || !S.fib) return;
    const t = S.fib.oops.includes(me.pid) ? "😳 That’s the REAL answer! Write a fake one." : S.fib.done.includes(me.pid) ? "Fib received ✓ You can send a new one to change it." : "";
    if (el.textContent !== t) el.textContent = t;
  }
  let fibPick = {};
  function vFibVote() {
    const f = S.fib, mine = fibPick[f.seq + ":" + f.pi];
    return `<div class="card"><p class="p-item"><span>Fa-La-La Lies · find the truth</span><span>${f.pi + 1} of ${f.n}</span></p><p class="p-q">${blank(f.q)}</p></div>
      <div class="p-clock"><b id="pTimer"></b><div class="cane"><i id="pCane"></i></div></div>
      <div class="p-choices">${(f.opts || []).map((o, i) => {
        const own = o.authors.includes(me.pid);
        return `<button class="p-ch c${i % 4}${mine === i ? " picked" : ""}" data-fv="${i}"${own ? " disabled" : ""}><span class="letter">${i + 1}</span><span>${esc(o.t)}${own ? " <small>(your fib)</small>" : ""}</span></button>`;
      }).join("")}</div>
      <p class="p-status">${mine != null ? "Locked in ✓ Tap another to change it" : "Which one is TRUE?"}</p>`;
  }
  function vFibResult() {
    const f = S.fib, x = (f.res || {})[me.pid] || { d: 0, truth: false, fooled: 0, fell: -1 };
    const real = (f.opts || []).find(o => o.real), fell = x.fell >= 0 ? f.opts[x.fell] : null;
    const names = ids => ids.map(id => (S.players.find(p => p.id === id) || {}).name).filter(Boolean).join(" & ");
    const lines = [];
    if (x.truth) lines.push("You found the truth! <b>+300</b>");
    else if (fell) lines.push(fell.house ? "You fell for Grandma’s fib! 👵" : `You fell for ${esc(names(fell.authors))}’s fib!`);
    if (x.fooled) lines.push(`Your fib fooled ${x.fooled} ${x.fooled === 1 ? "person" : "people"}! <b>+${x.d - (x.truth ? 300 : 0)}</b>`);
    return `<div class="card result ${x.d > 0 ? "ok" : "bad"}"><div class="mark">${x.fooled ? "🤥" : x.truth ? "✓" : "✗"}</div><div class="delta">${x.d > 0 ? "+" : ""}${x.d}</div>
      <ul class="breakdown">${lines.map(l => `<li>${l}</li>`).join("")}</ul><p>The truth: <b>${esc(real ? real.t : "")}</b></p></div>`;
  }

  /* ---------- Finale ceremony ---------- */
  let finaleBuzz = "";
  function vFinale() {
    const f = S.finale || {}, k = f.k || "intro", place = rank(), mine = (f.mine || []).find(a => a.pid === me.pid);
    if (k !== finaleBuzz) { finaleBuzz = k; if (f.award && f.award.pid === me.pid) buzz([100, 60, 100, 60, 300]); if (k === "p" + place) buzz([200, 100, 200, 100, 600]); }
    if (f.award && f.award.pid === me.pid) return `<div class="card welcome award-card"><div class="trophy">${f.award.e}</div><p class="label">THAT’S YOU!</p><h1>${esc(f.award.title)}</h1><p>${esc(f.award.line)}</p>${myOrn("big")}</div>`;
    const medal = ["", "🥇", "🥈", "🥉"][place] || "🎄";
    const revealed = { p3: 3, p2: 2, p1: 1, end: 1 }[k];
    if (revealed && place && place >= revealed && place <= 3) return `<div class="card welcome award-card"><div class="trophy">${medal}</div><p class="label">YOU FINISHED</p><h1>${place === 1 ? "First place! 👑" : place === 2 ? "Second place!" : "Third place!"}</h1>${myOrn("huge")}</div>`;
    if (k === "end") return `<div class="card welcome">${myOrn("big")}<p class="label">FINAL STANDINGS</p><h1>You finished #${place} of ${S.players.length}</h1>${mine ? `<p>${mine.e} You won <b>${esc(mine.title)}</b>!</p>` : ""}<p>Merry Christmas!</p></div>` + vScores();
    return `<div class="card welcome"><div class="trophy">🥁</div><h1>The grand finale!</h1><p>Watch the TV. You might be getting an award…</p></div>`;
  }

  /* ---------- Draw the Halls ---------- */
  const myOpts = () => (S.draw && S.draw.opts && S.draw.opts[me.pid]) || null;
  function vDrawPick() {
    const o = myOpts(), mine = S.draw.picks[me.pid];
    if (!o) return vWait("Draw the Halls", "You joined after the crayons came out. You’ll get to guess everyone’s drawings!");
    return `<div class="card"><p class="label">DRAW THE HALLS</p><h1>Pick one to draw</h1><p>Keep it secret! Everyone else will try to guess it.</p></div>
      <div class="p-choices">${o.map((t, i) => `<button class="p-ch c${i}${mine === i ? " picked" : ""}" data-dpick="${i}"><span class="letter">${"ABC"[i]}</span><span>${esc(t)}</span></button>`).join("")}</div>
      ${mine >= 0 ? `<p class="p-status">Got it! Get your crayons ready…</p>` : ""}`;
  }
  function vDrawing() {
    const o = myOpts(); if (!o) return vWait("Everybody’s drawing…", "Get ready to guess what they drew!");
    const title = o[S.draw.picks[me.pid] >= 0 ? S.draw.picks[me.pid] : 0];
    if (pad && pad.seq !== S.draw.seq) pad = null; // a new Draw the Halls round: start with a blank pad
    if (pad && pad.sent) return `<div class="card welcome"><h1>Sent to the fridge! ✓</h1><p>You drew <b>${esc(title)}</b>. Waiting for the others…</p></div>`;
    return `<div class="card draw-head"><span class="label">DRAW THIS</span><h2>${esc(title)}</h2><span class="small">No letters or numbers!</span></div>
      <div class="p-clock"><b id="pTimer"></b><div class="cane"><i id="pCane"></i></div></div>
      <div class="draw-slot" id="dslot"></div>
      <div class="palette">${PALETTE.map((c, i) => `<button class="sw${pad && pad.col === i ? " on" : ""}" data-col="${i}" style="--sw:${c}" aria-label="Color ${i + 1}"></button>`).join("")}</div>
      <div class="tools">${BRUSH.map((b, i) => `<button class="sz${pad && pad.size === i ? " on" : ""}" data-size="${i}" aria-label="Brush ${i + 1}"><i style="width:${6 + i * 7}px;height:${6 + i * 7}px"></i></button>`).join("")}
        <button class="btn" data-act="undo">Undo</button><button class="btn" data-act="clear">Clear</button><button class="btn red" data-act="drawDone">Done!</button></div>`;
  }
  function vArtist() {
    const rev = S.phase === "reveal", x = rev && S.reveal.res ? S.reveal.res[me.pid] : null;
    return `<div class="card welcome">${myOrn("big")}<h1>That’s your masterpiece!</h1>
      ${rev ? `<p><b>${x && x.artist ? x.artist : 0}</b> ${x && x.artist === 1 ? "person" : "people"} guessed it. <b>+${x ? x.d : 0}</b></p>` : `<p>Sit back and look innocent while everyone guesses.</p>`}</div>`;
  }
  let pad = null;
  function makePad() {
    const cv = document.createElement("canvas"); cv.width = cv.height = 600; cv.className = "pad";
    pad = { seq: S.draw.seq, cv, ctx: cv.getContext("2d"), strokes: [], cur: null, col: 1, size: 1, sent: false, sentAt: 0 };
    redraw();
    const pos = e => { const b = cv.getBoundingClientRect(); return [Math.round(((e.clientX - b.left) / b.width) * 1000), Math.round(((e.clientY - b.top) / b.height) * 1000)].map(v => Math.max(0, Math.min(1000, v))); };
    cv.addEventListener("pointerdown", e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); pad.cur = { c: pad.col, w: pad.size, p: pos(e) }; pad.strokes.push(pad.cur); redraw(); });
    cv.addEventListener("pointermove", e => { if (!pad.cur) return; const [x, y] = pos(e), p = pad.cur.p; if (Math.abs(p[p.length - 2] - x) + Math.abs(p[p.length - 1] - y) < 6) return; p.push(x, y); redraw(); });
    const end = () => { pad.cur = null; };
    cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
  }
  function redraw() { drawStrokes(pad.ctx, pad.strokes, 600, 1); }
  function attachPad() {
    const slot = $("#dslot");
    if (!slot) return;
    if (!pad || pad.seq !== S.draw.seq) makePad();
    if (pad.cv.parentNode !== slot) slot.appendChild(pad.cv);
  }
  function sendDrawing() {
    if (!pad || !ch) return;
    pad.sent = true; pad.sentAt = Date.now();
    ch.send("drawing", { pid: me.pid, seq: pad.seq, s: pad.strokes });
    render();
  }

  /* ---------- photo avatar: pick, drag and zoom inside a circle ---------- */
  let cropping = null;
  function openCropper(src) {
    const img = new Image();
    img.onload = () => {
      cropping = { img, z: 1, ox: 0, oy: 0 };
      $("#overlay").innerHTML = `<div class="modal"><div class="modal-card cropper"><h2>Line up your face</h2><p class="small">Drag to move. Slide to zoom.</p>
        <div class="crop-view" id="cropView"></div>
        <input type="range" id="cropZoom" min="1" max="4" step="0.01" value="1" aria-label="Zoom">
        <div class="row"><button class="btn" data-act="cropCancel">Cancel</button><button class="btn red" data-act="cropOk">Use this</button></div></div></div>`;
      last["#overlay"] = null;
      $("#cropView").appendChild(img);
      layoutCrop();
    };
    img.src = src;
  }
  function cropBounds() {
    const c = cropping, V = $("#cropView").clientWidth, s = (V / Math.min(c.img.naturalWidth, c.img.naturalHeight)) * c.z;
    return { V, s, mx: Math.max(0, (c.img.naturalWidth * s - V) / 2), my: Math.max(0, (c.img.naturalHeight * s - V) / 2) };
  }
  function layoutCrop() {
    const c = cropping; if (!c) return;
    const b = cropBounds();
    c.ox = Math.max(-b.mx, Math.min(b.mx, c.ox)); c.oy = Math.max(-b.my, Math.min(b.my, c.oy));
    c.img.style.width = c.img.naturalWidth * b.s + "px"; c.img.style.height = c.img.naturalHeight * b.s + "px";
    c.img.style.transform = `translate(calc(-50% + ${c.ox}px), calc(-50% + ${c.oy}px))`;
  }
  function finishCrop() {
    const c = cropping, b = cropBounds(), N = 120, k = N / b.V;
    const cv = document.createElement("canvas"); cv.width = cv.height = N;
    const x = cv.getContext("2d");
    x.fillStyle = "#fff8ea"; x.fillRect(0, 0, N, N);
    x.beginPath(); x.arc(N / 2, N / 2, N / 2, 0, Math.PI * 2); x.clip();
    const w = c.img.naturalWidth * b.s * k, h = c.img.naturalHeight * b.s * k;
    x.drawImage(c.img, N / 2 + c.ox * k - w / 2, N / 2 + c.oy * k - h / 2, w, h);
    draftPhoto = cv.toDataURL("image/jpeg", 0.78);
    cropping = null; last["#overlay"] = null; $("#overlay").innerHTML = "";
    keepName(); render();
  }
  let drag = null;
  document.addEventListener("pointerdown", e => { if (cropping && e.target.closest("#cropView")) { drag = { x: e.clientX, y: e.clientY, ox: cropping.ox, oy: cropping.oy }; e.preventDefault(); } });
  document.addEventListener("pointermove", e => { if (drag && cropping) { cropping.ox = drag.ox + e.clientX - drag.x; cropping.oy = drag.oy + e.clientY - drag.y; layoutCrop(); } });
  document.addEventListener("pointerup", () => { drag = null; });
  document.addEventListener("input", e => { if (e.target.id === "cropZoom" && cropping) { cropping.z = +e.target.value; layoutCrop(); } });
  document.addEventListener("change", e => {
    if (e.target.id !== "photoIn" || !e.target.files || !e.target.files[0]) return;
    keepName();
    const fr = new FileReader();
    fr.onload = () => openCropper(fr.result);
    fr.readAsDataURL(e.target.files[0]);
  });
  /* Remember what was typed in the name box before the form re-renders. */
  function keepName() { const n = $("#nameIn"); if (n) { me.name = n.value.trim().slice(0, 24) || me.name; n.blur(); } }

  document.addEventListener("keydown", e => { if (e.target.id === "gifQ" && e.key === "Enter" && e.target.value.trim()) { e.preventDefault(); clearTimeout(gifT); e.target.blur(); searchGif(e.target.value.trim()); } });
  document.addEventListener("input", e => { if (e.target.id === "gifQ") { clearTimeout(gifT); const v = e.target.value.trim(); if (v.length > 2) gifT = setTimeout(() => searchGif(v), 700); } });
  document.addEventListener("submit", e => {
    e.preventDefault();
    if (e.target.id === "codeForm") {
      const v = cleanCode($("#codeIn").value);
      if (v.length !== 4) return;
      code = v; history.replaceState(null, "", "?g=" + code);
      $("#codeIn").blur(); connect(); render();
    } else if (e.target.id === "fibForm") {
      const v = $("#fibIn").value.trim().slice(0, 40);
      if (!v || !S || S.phase !== "fibwrite") return;
      ch.send("fibsub", { pid: me.pid, seq: S.fib.seq, pi: S.fib.pi, t: v }); buzz([30]);
      const st = $("#fibStatus"); if (st) st.textContent = "Sending…";
      $("#fibIn").blur();
    } else if (e.target.id === "nameForm") {
      const v = $("#nameIn").value.trim().slice(0, 24);
      if (!v) return;
      me.name = v; me.av = draftAv; me.photo = draftPhoto || ""; me.ph = me.photo ? hash(me.photo) : "";
      saveMe(); editing = false; photoSentAt = 0;
      $("#nameIn").blur(); join(); render();
    }
  });
  document.addEventListener("click", e => {
    const p = e.target.closest("[data-pick]");
    if (p && S && S.phase === "question" && !S.paused) {
      const c = +p.dataset.pick;
      picks[S.epoch] = c;
      ch.send("answer", { pid: me.pid, epoch: S.epoch, c });
      buzz([30]); render();
      return;
    }
    const go = e.target.closest("[data-gif]");
    if (go && S && S.phase === "gifpick") { gif.sel = gif.results[+go.dataset.gif]; drawGifs(); showSel(); $("#gifSel").scrollIntoView({ behavior: "smooth", block: "nearest" }); return; }
    const gq = e.target.closest("[data-gq]");
    if (gq && S && S.phase === "gifpick") { const q = $("#gifQ"); if (q) q.value = gq.dataset.gq; searchGif(gq.dataset.gq); return; }
    const gv = e.target.closest("[data-gv]");
    if (gv && S && S.phase === "gifvote" && !gv.disabled) { myVote = gv.dataset.gv; ch.send("gifvote", { pid: me.pid, seq: S.gif.seq, pi: S.gif.pi, for: myVote }); buzz([30]); last["#view"] = null; S.gif.voted.push(me.pid); render(); return; }
    const fv = e.target.closest("[data-fv]");
    if (fv && S && S.phase === "fibvote" && !fv.disabled) { const i = +fv.dataset.fv; fibPick[S.fib.seq + ":" + S.fib.pi] = i; ch.send("fibvote", { pid: me.pid, seq: S.fib.seq, pi: S.fib.pi, i }); buzz([30]); render(); return; }
    const dp = e.target.closest("[data-dpick]");
    if (dp && S && S.phase === "drawpick") { const i = +dp.dataset.dpick; S.draw.picks[me.pid] = i; ch.send("drawpick", { pid: me.pid, seq: S.draw.seq, i }); buzz([30]); last["#view"] = null; render(); return; }
    const col = e.target.closest("[data-col]"), size = e.target.closest("[data-size]");
    if (pad && (col || size)) { if (col) pad.col = +col.dataset.col; if (size) pad.size = +size.dataset.size; render(); return; }
    const av = e.target.closest("[data-av]");
    if (av) { keepName(); draftAv = av.dataset.av; draftPhoto = ""; render(); return; }
    const a = e.target.closest("[data-act]");
    if (!a) return;
    const k = a.dataset.act;
    if (k === "rename") { editing = true; draftAv = me.av; draftPhoto = me.photo || ""; render(); }
    if (k === "nophoto") { keepName(); draftPhoto = ""; render(); }
    if (k === "cropCancel") { cropping = null; last["#overlay"] = null; $("#overlay").innerHTML = ""; render(); }
    if (k === "cropOk") finishCrop();
    if (k === "again") join(true);
    if (k === "gifgo") { const q = $("#gifQ"); if (q && q.value.trim()) { q.blur(); searchGif(q.value.trim()); } }
    if (k === "gifsend" && gif.sel && S && S.phase === "gifpick") {
      const cap = ($("#gifCap") || {}).value || "";
      ch.send("gifsub", { pid: me.pid, seq: S.gif.seq, pi: S.gif.pi, gif: { s: gif.sel.s, b: gif.sel.b }, cap });
      const c = $("#gifCap"); if (c) c.blur();
      const st = $("#gifStatus"); if (st) st.textContent = "Sent! Pick another to change it."; buzz([30]);
    }
    if (k === "undo" && pad) { pad.strokes.pop(); redraw(); }
    if (k === "clear" && pad) { pad.strokes = []; redraw(); }
    if (k === "drawDone" && pad) sendDrawing();
    if (k === "code") { code = ""; S = null; if (ch) ch.close(); ch = null; history.replaceState(null, "", location.pathname); render(); }
  });

  if (code) connect();
  render();
})();
