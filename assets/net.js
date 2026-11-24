/* Thin wrapper around Supabase Realtime broadcast channels, plus small helpers shared by all three pages. */
window.Net = (() => {
  let client = null;
  function getClient() {
    if (!client) {
      const cfg = window.TRIVIA_CONFIG;
      client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
        auth: { persistSession: false },
        realtime: { params: { eventsPerSecond: 20 } }
      });
    }
    return client;
  }
  /* open("xmas-abcd", {eventName: handler}, onStatus) -> {send(event, payload), close()} */
  function open(name, handlers, onStatus) {
    const ch = getClient().channel(name, { config: { broadcast: { self: false } } });
    Object.entries(handlers).forEach(([ev, fn]) => ch.on("broadcast", { event: ev }, msg => fn(msg.payload)));
    ch.subscribe(status => onStatus && onStatus(status));
    return {
      send: (event, payload) => ch.send({ type: "broadcast", event, payload }).catch(() => {}),
      close: () => getClient().removeChannel(ch)
    };
  }
  return { open };
})();

window.esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* Falling emoji confetti. Positions are deterministic so re-renders don't jump. */
window.emojiRain = (emoji, count) => {
  const src = emoji || "🎄";
  const set = window.Intl && Intl.Segmenter ? [...new Intl.Segmenter().segment(src)].map(s => s.segment) : Array.from(src);
  return Array.from({ length: count }, (_, i) =>
    `<span style="left:${(i * 37) % 100}%;animation-duration:${4 + (i % 5)}s;animation-delay:-${((i * 0.61) % 5).toFixed(2)}s;font-size:${2 + (i % 4)}rem">${esc(set[i % set.length])}</span>`).join("");
};

/* Christmas avatars players can pick. */
window.AVATARS = ["🎅", "🤶", "🧝", "🦌", "⛄", "🐧", "🎄", "🎁", "🍪", "🔔", "⭐", "🧸", "🐻‍❄️", "🦊", "🍭", "🧦", "🛷", "❄️", "🕯️", "🥧", "🐿️", "🦉", "🎺", "🍩"];

/* An avatar drawn as a glass Christmas ornament. p = {id, av, photo}. */
window.ornament = (p, cls = "") => {
  const id = String((p && p.id) || "");
  let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const inner = p && p.photo ? `<img src="${esc(p.photo)}" alt="">` : `<span class="e">${esc((p && p.av) || "🎄")}</span>`;
  return `<span class="orn o${h % 6} ${cls}"><span class="cap"></span><span class="ball">${inner}</span></span>`;
};

/* Question toughness: 1 easy, 2 medium, 3 hard. */
window.TOUGH = {
  1: { name: "Gingerbread Easy", pts: 100 },
  2: { name: "Tinsel Tricky", pts: 200 },
  3: { name: "Fruitcake Tough", pts: 300 }
};
window.toughMeter = (t, mult) => {
  const T = TOUGH[t] || TOUGH[2];
  return `<span class="tough t${t}"><span class="bulbs">${[1, 2, 3].map(i => `<i class="${i <= t ? "lit" : ""}"></i>`).join("")}</span><b>${esc(T.name)}</b><span class="pts">${T.pts * (mult || 1)} pts${mult > 1 ? " · DOUBLE" : ""}</span></span>`;
};

/* A row of twinkling Christmas lights on a wire. */
window.stringLights = n => `<div class="lights" aria-hidden="true">${Array.from({ length: n }, (_, i) => `<i style="animation-delay:-${((i * 0.37) % 2.4).toFixed(2)}s"></i>`).join("")}</div>`;

/* Drawings are lists of strokes: {c: color index, w: size index, p: [x, y, x, y, ...]} in a 0–1000 square. */
window.PALETTE = ["#2b1d14", "#c9283f", "#1f7a4e", "#e0a020", "#8a5a2b", "#45a6e6", "#e86ab8", "#ffffff"];
window.BRUSH = [8, 18, 40];
/* Draw strokes onto a canvas of size W. progress (0–1) draws only that share of the points, for the replay. */
window.drawStrokes = (ctx, strokes, W, progress = 1) => {
  ctx.fillStyle = "#fffdf6"; ctx.fillRect(0, 0, W, W);
  const k = W / 1000, total = strokes.reduce((n, s) => n + s.p.length / 2, 0);
  let budget = Math.floor(total * progress);
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  for (const s of strokes) {
    if (budget <= 0) break;
    const n = Math.min(s.p.length / 2, budget); budget -= n;
    ctx.strokeStyle = PALETTE[s.c] || PALETTE[0]; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = (BRUSH[s.w] || BRUSH[1]) * k;
    if (n === 1) { ctx.beginPath(); ctx.arc(s.p[0] * k, s.p[1] * k, ctx.lineWidth / 2, 0, 7); ctx.fill(); continue; }
    ctx.beginPath(); ctx.moveTo(s.p[0] * k, s.p[1] * k);
    for (let i = 1; i < n; i++) ctx.lineTo(s.p[i * 2] * k, s.p[i * 2 + 1] * k);
    ctx.stroke();
  }
};
