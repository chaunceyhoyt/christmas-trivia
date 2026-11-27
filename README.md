# Rewind Christmas Trivia

A Christmas movie trivia night styled like Grandma’s over-decorated living room.

**Run it from your own computer** (media on your own drive, phones join from any network): see [LOCAL-SETUP.md](LOCAL-SETUP.md).

It has three screens:

| Screen | Who uses it | Page |
| --- | --- | --- |
| Big screen | The laptop connected to the TV. It shows questions, keeps score, runs the autopilot and plays the sounds. | `screen.html` |
| Player | Every guest's phone. They scan the QR code, pick a name and a Christmas avatar (or snap their own face) and tap answers. | `play.html` |
| Host controller | Your phone. Builds the round playlist, pauses, skips and fixes scores. | `host.html` |

There are 395 questions in 28 rounds: 12 regular rounds, a 5-second speed round, Grandma’s Music Box (name the carol), 8 surprise rounds, 3 kid rounds, and 3 picture/sound/video rounds that use files you add.

## Put it on GitHub Pages (one time)

1. Sign in at [github.com](https://github.com) and click **New repository**. Name it `christmas-trivia` and make it **Public**. Don't add a README.
2. Upload the files. Pick one way:
   - **Drag and drop:** on the new repo's page, click **uploading an existing file**. Drag in everything from this folder, including the `assets` folder. Then click **Commit changes**.
   - **Git:** this folder is already a git repository with a commit. Run:
     ```bash
     git remote add origin https://github.com/YOUR-USERNAME/christmas-trivia.git
     git push -u origin main
     ```
3. In the repo, go to **Settings → Pages**. Under **Branch**, pick `main` and `/ (root)`, then click **Save**.
4. Wait about a minute. Your game will be at `https://YOUR-USERNAME.github.io/christmas-trivia/`.

## Party night

1. On the TV laptop, open `https://YOUR-USERNAME.github.io/christmas-trivia/screen.html`. Click once anywhere to turn on sound, then press F11 for full screen.
2. Click **Host controller** on the big screen and scan that QR code with **your** phone. It contains the host PIN, so close it before guests look.
3. Guests scan the big QR code on the TV, type a name and pick an avatar. Their ornament shows up on the TV.
4. On your phone, tap rounds to add them to the **playlist** (or **Add all unplayed**), then tap **Start the show**.
5. With **Autopilot** on, the game runs itself: round intro, reading time, 20-second timer, avatars land on their answers, reveal, next question, scoreboard, next round in the playlist. Go refill the eggnog. **Pause** freezes everything.
6. With Autopilot off, the big red button moves things along (the timers still lock answers on their own).

Turn on **Surprise rounds** and a surprise round sneaks in between playlist rounds now and then. **Kid mode** gives everything at least 30 seconds, shows the kid rounds first, and the kid rounds have silly “Jingle Jiggle” breaks.

Each round plays a random 10 of its questions (picture, sound and clip rounds play 12), easiest first. The game remembers what it has asked, even across new games, so replaying a round brings new questions until its set runs out.

If the TV laptop reloads, the game picks up where it left off. **New game** at the bottom of the big screen starts over. Keyboard on the TV laptop: Space next, ← back, P pause, S scores, A surprise round, H host QR, M mute.

## Scoring

- Every question shows its difficulty: **Easy** 100, **Medium** 200, **Hard** 300.
- **Speed bonus:** answer instantly and you double it. It shrinks to nothing as the timer runs out.
- **Snowball streak:** 3 right in a row adds +50, 4 adds +100, up to +250 a question. A miss melts it.
- **Golden ornament:** one random question per round is worth double.
- The Final Reel and Yippee-Ki-Yay are double points. Rudolph and Wet Bandits take points for wrong answers, the Grinch steals from the leader, Turbo Time gives the fastest right answer +200, Snow Day pays 25 just for answering. Kid rounds never take points away.
- Use **−100 / +100** next to any player on the host controller for dares, ties or arguments.

## Themes, Play now and game controllers

**Themes.** The lobby (and the host phone) has a theme switch: **🎬 Movie Night**, all kinds of movies, and **🎄 Christmas**. The theme changes the questions, the party games, the surprise rounds, the kid rounds, the avatars, the GIF searches and the whole look. Movie Night questions are in `assets/questions-movies.js`. Christmas questions are in `assets/questions.js`. A new theme is a new questions file, one entry in `THEMES` in `assets/net.js`, and a few lines of CSS under `body.theme-<name>`.

**Play now.** Press **▶ Play now** in the lobby (or on the host phone) and the game builds a whole night by itself: a mix of trivia rounds, a picture/sound/clip round if you have the files, a speed round, party games when 3 or more people are playing, surprise rounds, and the final round. Then the finale ceremony. No host needed. In kid mode it picks kid rounds and a drawing game.

**Choose rounds on the TV.** **Choose rounds** in the lobby, **Choose a round** at intermission, the **Rounds** button at the bottom, or the **R** key opens a list of every round. Pick one to play it now.

**Game controller.** Plug in or pair any standard controller (Xbox, PlayStation, Switch Pro, 8BitDo…) with the computer running the big screen and press a button once so the browser notices it.

| Button | Does |
| --- | --- |
| D-pad or left stick | Move the highlight between buttons on the TV |
| A (✕ on PlayStation) | Press the highlighted button (or "next" if nothing is highlighted) |
| B (○) | Close the round list or scores |
| Y (△) | Open the round list |
| Start / Options | Pause or resume |
| View / Share | Show or hide scores |
| LB / RB | Back / next |

**Play on this screen (no phones).** If nobody joins, press **🎮 Play on this screen** in the lobby. Each press adds a screen player, up to 4 (**− Remove one** takes the last one off). Player 1 uses controller 1, the keys **1–4**, or a mouse click on an answer. Players 2–4 use controllers 2–4. During a question, **A B X Y** (✕ ○ □ △ on PlayStation) pick answers **A B C D**; the other buttons work as usual. Screen players and phone players can play together. Drawing, GIF and fib games need phones, so Play now leaves them out when only screen players are in.
| X (□) | Replay the sound or clip |

The arrow keys and Enter do the same in the lobby, at intermission and in the round list.

## Party games and the finale

- **Draw the Halls:** everyone picks one of three Christmas movies on their phone and draws it. The TV replays each drawing and everyone guesses. Artists get 100 for each correct guess. Ends with Grandma’s Fridge.
- **GIF Wrapped:** everyone answers a funny prompt with a Christmas GIF (plus an optional caption), then votes for the funniest. 100 points per vote, +200 for Best in Show. Searches are locked to Christmas GIFs and rated PG (G in kid mode).
- **Fa-La-La Lies:** an obscure Christmas movie fact appears with a blank. Everyone types a believable fake answer, then everyone tries to pick the real one. Find the truth: +300. Every person your fib fools: +150.
- **Finale ceremony:** silly awards for the night, then the podium. Start it from the host controller after your last round.

### Turn on GIF Wrapped (one time, about 5 minutes)

1. Go to [developers.giphy.com/dashboard](https://developers.giphy.com/dashboard/) and sign up (free).
2. Click **Create an App**, choose **API**, and give it any name and description.
3. Copy the **API key** it shows you.
4. On GitHub, open `assets/config.js`, click the pencil to edit, and paste the key between the quotes on the `giphyKey: ""` line. Commit the change.

The key is meant to be used from web pages, like the Supabase key. Until it's added, GIF Wrapped shows "needs GIPHY key" on the host controller.

## Sounds, music, pictures and video

Every sound has a built-in stand-in. To use real Christmas sound effects and background music, drop MP3s into `assets/sounds/` with the names in [assets/sounds/README.md](assets/sounds/README.md).

The Frame Game, Soundbites and Clip Show rounds need your own files in `assets/media/`. See [assets/media/README.md](assets/media/README.md) for the file names. Grandma’s Music Box needs nothing: the TV plays the carols itself.

## How it works

The pages are static files. Live play goes through Supabase Realtime broadcast channels on your Supabase project. Nothing is written to its database. The connection settings are in `assets/config.js`. That key is the public "anon" key, which is designed to be visible in web pages. Your database tables are protected by row level security, not by keeping this key secret. Photo avatars are shrunk to a small circle on the phone and only kept on the big screen.

To change questions, edit `assets/questions.js`. Each question is `[question, right answer, [three wrong answers], optional note]`, and each round has a `tough` string with one digit (1–3) per question.
