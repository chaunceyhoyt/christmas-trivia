# Running the game from your own computer

The game runs from your PC instead of GitHub Pages. A free Cloudflare "tunnel" gives it a public web address, so phones on **any** network (cellular, other Wi-Fi, other houses) can join by scanning the QR code. You don't need to buy a domain or upload media anywhere.

**What runs where**

| Part | Where |
| --- | --- |
| Game pages, pictures, sounds, clips | Your PC (media from your network drive) |
| Public address for phones | Cloudflare quick tunnel (free, no account) |
| Live connection between TV and phones | Supabase (free) |
| GIF search | GIPHY |

---

## Step 1: Install three things (once per computer)

Open **PowerShell** (press the Windows key, type `powershell`, press Enter) and run these one at a time:

```
winget install Python.Python.3.12
winget install Cloudflare.cloudflared
winget install GitHub.GitHubDesktop
```

If you're also making media files on this computer, add `winget install Gyan.FFmpeg`.

**Close PowerShell and open it again**, then check:

```
python --version
cloudflared --version
```

Both should print a version. If `python` isn't found, try `py --version`.

## Step 2: Get the game onto the computer

GitHub Desktop keeps a copy of the game on your PC and updates it with one click.

1. Open **GitHub Desktop** and sign in to GitHub.
2. Choose **File → Clone repository**, pick `chaunceyhoyt/christmas-trivia`, and set **Local path** to a folder on this computer, like `C:\Trivia`. Click **Clone**.
3. The game is now in `C:\Trivia\christmas-trivia`.

Keep the game folder on the computer itself rather than the network drive: it starts faster and keeps working if the drive hiccups. Only the media lives on the network drive.

## Step 3: Set up the media folder on your network drive

1. Make a folder on the network drive for all the game's media, like `Z:\Trivia Media`. Put every picture, sound and clip straight in it, no subfolders, named like `elf_1.png`, `elf_2.mp3`, `clip-elf_3.mp4`.
2. In the game folder, open `party\settings.ini` in Notepad and set the folder:

   ```
   media_folder = Z:\Trivia Media
   ```

   A `\\server\share\Trivia Media` path works too. It's a little more reliable than a drive letter, because a mapped drive letter only connects once you've logged in and opened it.
3. Save the file.

The files GitHub already has (A Christmas Story, Charlie Brown, A Disney Christmas Gift) are in the game folder's `assets\media`. The game uses those as a backup, so copy them to the network folder too if you want everything in one place.

**Making new media:** the tools in `tools\` now finish straight into this folder. Drop movies on `Drop movies here.bat`, delete the choices you don't like in `tools\picks`, then double-click `Finish picks.bat`. The files land in `Z:\Trivia Media`, named correctly. Nothing gets uploaded to GitHub.

## Step 4: Start the party

1. In the game folder, double-click **`Start party.bat`**.
2. A black window opens and shows:

   ```
   Media folder: Z:\Trivia Media  (412 files)
   Phones join at: https://some-random-words.trycloudflare.com/play.html
   Big screen:     http://localhost:8080/screen.html
   ```

3. The big screen opens in your browser by itself. Drag the window to the TV and press **F11** for full screen. Click once anywhere to turn on sound.
4. Players scan the QR code on the TV. The host scans **Host QR** (bottom right of the TV) for the host controller.

**Leave the black window open the whole party.** While it's open, the computer won't go to sleep. To stop, press **Ctrl+C** in it or close it.

The public address is different every time you start. That's fine, because the QR code always shows the current one. Only the big screen uses `localhost`, so your saved game and the memory of which questions were already asked stay put between parties.

## Step 5: Test it

Do this once before the party, with one phone **on cellular data, not your Wi-Fi**:

- [ ] The black window shows a "Phones join at" address.
- [ ] Scan the TV's QR code with the phone. The join page opens, and you can pick a name and avatar.
- [ ] Scan **Host QR** with a second phone (or the same one in a private tab). The host controller opens.
- [ ] On the host controller, The Frame Game, Soundbites and Clip Show show question counts (like "12 Q"). If one says 0 or is greyed out, the game can't see your media folder: check the "Media folder" line in the black window.
- [ ] Play one question of each kind: a picture, a sound, a clip, and the GIF round.

## Moving to the other computer

1. Do **Step 1** and **Step 2** on the new computer.
2. Copy `party\settings.ini` from the first computer into the new game folder. The media path is the same, so nothing else changes. Or, in GitHub Desktop, commit `settings.ini` on the first computer and push, and the new one gets it with the rest of the game.
3. Make sure the new computer can open the network drive in File Explorer (log in to it once if it asks).
4. Do **Step 4** and **Step 5**.

The "already asked" memory belongs to each computer, so the new one starts fresh.

## Getting updates

When the game is updated, open GitHub Desktop, click **Fetch origin**, then **Pull origin**. Restart the party if it's running.

## If something goes wrong

| Problem | Fix |
| --- | --- |
| `python` isn't recognized | Use `py`, or install Python (Step 1) and reopen PowerShell. `Start party.bat` tries both. |
| "Can't find cloudflared" | Install it (Step 1). If you just did, close the black window and start again. |
| "Port 8080 is already in use" | The party is already running in another window. Close it, or change `port` in `settings.ini`. |
| "Can't open the media folder" | Open the network drive in File Explorer first (it may need you to log in), then start again. |
| "The public address didn't start" | Check the internet connection, then start again. The TV still works on this computer. |
| Phones can't open the address | Wait 10–20 seconds after starting: a new address takes a moment to work everywhere. |
| Picture, sound and clip rounds are greyed out | The game can't find the media files. Check the folder in `settings.ini` and that names look like `elf_1.png`. Reload the big screen after adding files. |
| Nobody can connect after weeks of not playing | The free Supabase project pauses after a week of no use. Log in at supabase.com and click **Restore project**. |

## What still needs the internet

The PC needs internet for the tunnel, the live connection (Supabase), GIF search (GIPHY) and the fancy fonts (the game falls back to plain fonts without them). The movie media never leaves your house: it plays on the TV straight from the network drive, so a normal home connection is plenty. Remote players still need a video call to see and hear the picture, sound and clip rounds.

If you want to drop Supabase too, the live connection can move onto this PC as well. Then the only outside services are the tunnel and GIPHY.

## Looking ahead: more than Christmas

This setup was built so it doesn't care what the movies are:

- The media folder can hold files for any movie. Name files after the movie (`die-hard_1.png`) and one file can be shared by several themes.
- The drop tool works with any movie file.
- The server and the settings aren't tied to Christmas.

The next steps for other themes:
- Split the questions into **theme packs**, like Christmas, '80s Action and Horror.
- Add a **theme picker** on the TV.
- Give each theme its own look and title.
