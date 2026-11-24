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
