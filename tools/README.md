# Making the picture, sound and video files

`make_media.py` cuts the Frame Game pictures, Soundbites and Clip Show clips out of your own movie files, and names each file exactly the way the game expects. Use movies you own, for your own party.

## One-time setup

You need **Python 3** and **ffmpeg** (a free video tool).

**Mac** (in the Terminal app):
1. Install Homebrew if you don't have it: see [brew.sh](https://brew.sh).
2. Run `brew install ffmpeg python`

**Windows** (in PowerShell):
1. Run `winget install Gyan.FFmpeg`
2. Run `winget install Python.Python.3.12`
3. Close and reopen PowerShell so it finds them.

Check it worked: `ffmpeg -version` and `python --version` (on a Mac, `python3 --version`) should both print a version.

## Easiest: drag and drop

1. **Windows:** drag one or more movie files, **or movie folders**, onto **`Drop movies here.bat`** in this folder.
   A movie's folder (like `Alien (1979)` with the posters, .nfo files and the movie inside) uses the biggest video file in it (any type: mkv, mp4, avi…) and names the movie after the folder; samples, trailers and extras are skipped. Drop a folder full of movie folders and it does every movie in it, one after another. Movies that already have all their files are skipped right away, so you can drop your whole movies folder again any time to fill gaps.

   **Dropping lots of folders at once and nothing happens?** Windows can only pass about 8,000 characters of file paths to a .bat file, and long network paths use that up after a few dozen folders. When it's over the limit, Windows silently does nothing. Drop the one folder that holds them all instead.
   **Mac:** double-click **`Drop movies here.command`**, drag movies into the window that opens and press Return.
2. It makes **3 versions of every file**, each from a different part of the movie: 3 pictures, 3 sound clips and 3 video clips (plus 3 kid pictures for Christmas movies that have their own). They go straight into that movie's own folder in your media folder (`media_folder` in `party\settings.ini`), already named the way the game reads them:

   ```
   \\MEDIACENTER\Media01\Trivia Media\The Lion King\
       the-lion-king_1.png   the-lion-king_2.png   the-lion-king_3.png
       the-lion-king_1.mp3   the-lion-king_2.mp3   the-lion-king_3.mp3
       clip-the-lion-king_1.mp4   clip-the-lion-king_2.mp4   clip-the-lion-king_3.mp4
       times.txt    (where in the movie each one came from)
   ```

3. Open the folder, look and listen, and **delete any you don't like**. That's it: the game plays one of the ones left at random each time.
4. Want more? Drop the same movie again. It only makes the numbers that are missing, so the ones you kept are never replaced.

Names come from the game's list (`media-list.csv`) when the game knows the movie, otherwise from the file name (`My Movie (2004).mkv` becomes `my-movie_1.png`). A movie takes about a minute. Press **Ctrl+C** to stop.

**Old files named with the time, like `elf_2 (0-52-13).png`?** Run `python drop_movie.py --tidy "C:\path\to\that\folder"` to rename them to `elf_2.png`, in place.

### Already filled in `movie_file` paths in the list?

Do all of them at once. Open PowerShell in the `tools` folder and run:

```
python drop_movie.py --csv media-list.csv
```

Same result as dropping each movie. Files already there are skipped, so you can stop with Ctrl+C and run it again later. Add `--movie elf` to do just one movie.

## Make a list of all your movies

Drag your movies folder (or several) onto **`List my movies.bat`**, or double-click it and paste the folder's path. It looks through every subfolder, skips TV episodes, samples, trailers and extras, and writes **`movie-list.csv`** in this folder with each movie's title, year, and whether the game already has questions for it (`in_game`). Send that file back to get questions written for the rest.

The rest of this page is the older way, which makes one file of each kind for every movie in the list at once.

## Where your movies are

Leave them where they are. Point the script at the folder they're in (subfolders are searched too). If they're in several places, repeat `--movies`, like `--movies "D:\Movies" --movies "E:\Kids Movies"`. You can also put a movie's full path in its `movie_file` column, like `D:\Movies\Elf (2003).mkv`.

The output file names (`frame_png`, `kid_frame_png`, `sound_mp3`, `clip_mp4`) are already filled in, one row per movie, so there's nothing to type there. A blank file name just means that movie isn't in that round (Bad Santa is only in The Frame Game, so it has no sound or clip), and the script skips it. You **don't** need to rename, move or list your movie files: the script matches each movie by its title, so `Home Alone (1990) 1080p BluRay.mkv` is found as Home Alone (and not mixed up with Home Alone 2). Movies you don't have are simply skipped.

## If you typed full paths in `movie_file`

You don't need `--movies` at all. In Terminal or PowerShell, go to the folder with the script and run:

```
python make_media.py media-list.csv --check
python make_media.py media-list.csv
```

The first line shows which file each movie will use, the second makes the files. Movies with no path are skipped. If a path is wrong, it says so at the end.

Add `--out` to choose where the files go, like `--out "C:\Users\you\Desktop\trivia-media"`. Otherwise they go to an `assets/media` folder next to the `tools` folder.

## Check the matches first

Open Terminal or PowerShell in the `tools` folder and run (use `python3` on a Mac):

```
python make_media.py media-list.csv --movies "C:\Movies" --check
```

It lists which file it picked for each movie and makes nothing. If one is wrong, or a movie you have wasn't found, open `media-list.csv` and type that file's name in the `movie_file` column for that row. That's the only time you'd need to.

## Run it

Same command, without `--check`:

```
python make_media.py media-list.csv --movies "C:\Movies"
```

The files land in `assets/media`, ready to upload to GitHub.

## Optional: pick your moments

`media-list.csv` opens in Excel, Numbers or Google Sheets. You only need it to choose exact moments:

| Column | What to put |
| --- | --- |
| `frame_time` | When to grab The Frame Game picture, like `0:52:13`. Blank = a random moment. |
| `kid_frame_time` | Same, for the Kid Frame Game picture. |
| `sound_start` | When the famous line starts, like `1:02:33`. Fill this in for soundbites: a random sound is almost never a good one. |
| `sound_seconds` | How long the sound clip is. 6 is the default. |
| `clip_start` | When the video clip starts. Blank = random. |
| `clip_seconds` | How long the video clip is. 8 is the default. |
| `movie_file` | Only if the automatic match picked the wrong file or missed one. |

`what_to_capture` has a suggested scene, line or clip for each movie. Save as CSV when you're done.

### Handy options

- `--candidates 6` saves 6 random pictures per movie (spread through the movie) into `assets/media/candidates`. Each file name has its time in it, like `elf_0-52-13.png`. Pick your favorite, put `0:52:13` in `frame_time`, and run again without `--candidates`.
- `--movie elf` only does rows whose movie name contains "elf".
- `--only frames`, `--only sounds` or `--only clips` makes just one kind of file.
- `--overwrite` replaces files that already exist (otherwise they're skipped, so you can run it again safely).

Every random time it used is written to `media-list.chosen.csv`, so if a random picture or clip came out great, copy its time into `media-list.csv` to keep it.

## What it makes

- **Pictures:** PNG, up to 1920×1080. It skips the opening and closing credits, avoids dark frames, and shrinks any picture over about 2.5 MB.
- **Sound clips:** MP3, with the volume evened out and a quick fade in and out.
- **Video clips:** MP4, 720p, with sound, usually 1 to 5 MB.

Upload them to `assets/media` on GitHub. Don't upload the `candidates` folder.

## Finding the time of a famous line

Play the movie in VLC or any player, pause right before the line, and note the time shown. Start a second early: the clip fades in over the first fraction of a second.
