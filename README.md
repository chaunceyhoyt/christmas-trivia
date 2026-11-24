# Rewind Christmas Trivia

A Christmas movie trivia night styled like a 1980s department store Christmas catalog. It has three screens:

| Screen | Who uses it | Page |
| --- | --- | --- |
| Big screen | The laptop connected to the TV. It shows questions, keeps score and plays the alarms. | `screen.html` |
| Player | Every guest's phone. They scan the QR code, pick a team name and tap answers. | `play.html` |
| Host controller | Your phone. Moves through questions, reveals answers, sets off alarms and fixes scores. | `host.html` |

There are 293 questions in 20 rounds. The 12 feature rounds include an emoji round. The 8 alarm rounds are Rudolph, Grinch, Wet Bandits, Griswold, Snow Day, Turbo Time, Nightmare and Yippee-Ki-Yay. Each alarm round has a siren, flashing colors, emoji confetti, a house rule and a silly challenge.

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
3. Guests scan the big QR code on the TV and pick team names. Each phone is one team.
4. On your phone, tap **Open the catalog**, then **Play the next round** (or pick any round). The big red button sets off a random alarm round whenever you like.
5. The big red **Next** button does the right thing at each step: start the round, reveal the answer, go to the next question, finish the round.

If the TV laptop reloads, the game picks up where it left off: same code, same scores. **New game** at the bottom of the big screen starts over with a new code.

If you don't have the phone handy, the TV laptop's keyboard works too: Space is next, ← goes back, A sets off an alarm, S shows scores, L locks answers, T starts a 15-second timer and H shows the host QR.

## Scoring

- Each round's points are on its title card (1 to 3 per question).
- **Rudolph:** a wrong answer costs 1 point.
- **Grinch:** every right answer steals 1 point from whoever is in first place.
- **Wet Bandits:** answers lock after 20 seconds.
- **Turbo Time:** answers lock after 10 seconds. The fastest right answer gets +1.
- **Griswold:** phones with a wrong answer tell that team to yell SQUIRREL.
- **Nightmare:** the TV hides the question. It only shows on phones.
- Use **+1 / −1** next to any team on the host controller for dares, ties or arguments.

## Lights

See [LIGHTS.md](LIGHTS.md) to make your Google Home lights change color with each alarm.

## How it works

The pages are static files. Live play goes through Supabase Realtime broadcast channels on your Supabase project. Nothing is written to its database. The connection settings are in `assets/config.js`. That key is the public "anon" key, which is designed to be visible in web pages. Your database tables are protected by row level security, not by keeping this key secret.

To change questions, edit `assets/questions.js`. Each question is `[question, right answer, [three wrong answers], optional note]`.
