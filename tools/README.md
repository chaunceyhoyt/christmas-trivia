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

## Put your movies in one folder

Any folder works, and subfolders are fine. You **don't** need to rename the files or type their names anywhere: the script matches each movie by its title, so `Home Alone (1990) 1080p BluRay.mkv` is found as Home Alone (and not mixed up with Home Alone 2). Movies you don't have are simply skipped.

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
| `frame_time` | When to grab the picture, like `0:52:13`. Blank = a random moment. |
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
