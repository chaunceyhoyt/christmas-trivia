/* Thin wrapper around Supabase Realtime broadcast channels. */
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

/* Falling emoji confetti for alarm screens. Positions are deterministic so re-renders don't jump. */
window.emojiRain = (emoji, count) => {
  const src = emoji || "🎄";
  const set = window.Intl && Intl.Segmenter ? [...new Intl.Segmenter().segment(src)].map(s => s.segment) : Array.from(src);
  return Array.from({ length: count }, (_, i) =>
    `<span style="left:${(i * 37) % 100}%;animation-duration:${4 + (i % 5)}s;animation-delay:-${((i * 0.61) % 5).toFixed(2)}s;font-size:${2 + (i % 4)}rem">${esc(set[i % set.length])}</span>`).join("");
};

window.esc =s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
