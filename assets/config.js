/* Supabase project used for the live game connection (Realtime broadcast only; no tables are used).
   This is the public "anon" key, which is meant to live in browser code. */
window.TRIVIA_CONFIG = {
  supabaseUrl: "https://qhvzfgsfkqrnykgryvej.supabase.co",
  supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodnpmZ3Nma3FybnlrZ3J5dmVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMzk1NjIsImV4cCI6MjA5NTgxNTU2Mn0.WbXMQaEfaewGarq7W4-hgp74OQuQtwpDNpxSzc-jNA4",
  /* GIPHY key for the GIF Wrapped round. Get a free one at https://developers.giphy.com/dashboard/
     (Create an App → API). Paste it between the quotes. Leave it empty and the GIF round stays greyed out. */
  giphyKey: ""
};
