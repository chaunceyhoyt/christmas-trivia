#!/usr/bin/env python3
"""
Drag-and-drop helper: makes 3 choices of every file for a movie, so you can keep the best one.

Windows: drag one or more movie files onto "Drop movies here.bat".
Mac: double-click "Drop movies here.command", then drag movies into the window and press Return.

Works for any movie: the names come from the file name (Elf (2003) 1080p.mkv -> elf.png, elf.mp3, clip-elf.mp4).
If it's a movie the game already lists in media-list.csv, it uses the game's names instead, so the game finds them.
In tools/picks/<Movie>/ it makes 3 pictures, 3 sound clips and 3 video clips (plus 3 Kid Frame Game pictures if the
game has one for that movie),
  each from a different part of the movie. The time is in each file name, like  elf_2 (0-52-13).png

Then delete the ones you don't want, so one of each is left, and run "Finish picks" (or: drop_movie.py --finish).
It renames each one you kept to the name the game expects and moves it into assets/media.
"""
import argparse
import csv
import os
import random
import re
import shlex
import shutil
import sys

from make_media import (DARK_LEVEL, DEFAULT_OUT, HERE, VIDEO_EXT, brightness, duration, fmt_time, grab_frame,
                        make_clip, make_sound, match_score, need, parse_time, words, JUNK)

PICKS = os.path.join(HERE, "picks")
CSV = os.path.join(HERE, "media-list.csv")
CHOICES = 3
# (column with the game's file name, kind, column with its length)
KINDS = [("frame_png", "picture", None), ("kid_frame_png", "kid picture", None),
         ("sound_mp3", "sound", "sound_seconds"), ("clip_mp4", "clip", "clip_seconds")]
LENGTH = {"sound_seconds": 6.0, "clip_seconds": 8.0}
# A picked file looks like  elf_2 (0-52-13).png ; finishing turns it back into  elf.png
PICK_NAME = re.compile(r"^(?P<base>.+)_(?P<n>\d+)(?: \([0-9-]+\))?(?P<ext>\.[A-Za-z0-9]+)$")


def load_rows():
    if not os.path.exists(CSV):
        return []
    with open(CSV, newline="", encoding="utf-8-sig") as f:
        return [r for r in csv.DictReader(f) if (r.get("movie") or "").strip()]


def names_from_file(path):
    """Game-style names from the file name: Elf (2003) 1080p.mkv -> elf.png, elf.mp3, clip-elf.mp4."""
    ws = [w for w in words(os.path.splitext(os.path.basename(path))[0])
          if w not in JUNK and not re.fullmatch(r"(19|20)\d\d", w)]
    if not ws:
        ws = ["movie"]
    slug = "-".join(ws)
    title = " ".join(w.capitalize() for w in ws)
    return {"movie": title, "frame_png": slug + ".png", "sound_mp3": slug + ".mp3", "clip_mp4": "clip-" + slug + ".mp4"}


def which_movie(path, rows):
    """Use the game's own names if this is a movie the game already knows (so it finds the files),
    otherwise make names from the file name. Never asks."""
    scored = sorted((sc, i) for i, r in enumerate(rows) for sc in [match_score(r["movie"], path)] if sc is not None)
    # Only a near-exact title match counts (a year is fine, but Home Alone 3 is not Home Alone).
    if scored and scored[0][0] <= 0.5 and (len(scored) == 1 or scored[1][0] - scored[0][0] > 0.01):
        return rows[scored[0][1]]
    return names_from_file(path)


def stamp(t):
    return fmt_time(t).replace(":", "-")


def bright_frame(movie, lo, hi, out, tries=5):
    """A picture from between lo and hi seconds that isn't too dark."""
    best = None
    for _ in range(tries):
        t = random.uniform(lo, hi)
        grab_frame(movie, t, out)
        level = brightness(out)
        if level >= DARK_LEVEL:
            return t
        if best is None or level > best[1]:
            best = (t, level)
    grab_frame(movie, best[0], out)
    return best[0]


def do_movie(path, rows, row=None):
    path = path.strip().strip('"').strip("'")
    if not os.path.isfile(path):
        print(f"\nCan't find {path}")
        return
    if os.path.splitext(path)[1].lower() not in VIDEO_EXT:
        print(f"\nSkipping {os.path.basename(path)}: not a video file")
        return
    row = row or which_movie(path, rows)
    total = duration(path)
    folder = os.path.join(PICKS, re.sub(r'[<>:"/\\|?*]', "", row["movie"]).strip())
    os.makedirs(folder, exist_ok=True)
    print(f"\n{row['movie']}  ({os.path.basename(path)}, {fmt_time(total)} long)")
    for col, kind, len_col in KINDS:
        name = (row.get(col) or "").strip()
        if not name:
            continue
        base, ext = os.path.splitext(name)
        secs = parse_time(row.get(len_col)) if len_col else 0
        secs = secs or LENGTH.get(len_col, 0)
        lo, hi = total * 0.12, max(total * 0.12 + 1, total * 0.88 - secs)
        step = (hi - lo) / CHOICES
        for n in range(1, CHOICES + 1):
            a, b = lo + (n - 1) * step, lo + n * step
            try:
                if ext.lower() == ".png":
                    tmp = os.path.join(folder, f"{base}_{n}{ext}")
                    t = bright_frame(path, a, b, tmp)
                    out = os.path.join(folder, f"{base}_{n} ({stamp(t)}){ext}")
                    os.replace(tmp, out)
                else:
                    t = random.uniform(a, b)
                    out = os.path.join(folder, f"{base}_{n} ({stamp(t)}){ext}")
                    (make_sound if ext.lower() == ".mp3" else make_clip)(path, t, secs, out)
                print(f"  {kind} {n} of {CHOICES}: {os.path.basename(out)}")
            except Exception as e:  # keep going with the rest
                print(f"  {kind} {n} of {CHOICES}: couldn't make it ({e})")
    print(f"  Saved in {folder}")


def from_csv(csv_path, only=None):
    """Make 3 choices of each file for every row with a movie_file. Rows already in the picks folder are skipped,
    so you can stop it with Ctrl+C and run it again."""
    with open(csv_path, newline="", encoding="utf-8-sig") as f:
        rows = [r for r in csv.DictReader(f) if (r.get("movie") or "").strip()]
    base = os.path.dirname(os.path.abspath(csv_path))
    todo, missing = [], []
    for r in rows:
        if only and only.lower() not in r["movie"].lower():
            continue
        p = (r.get("movie_file") or "").strip().strip('"').strip("'")
        if not p:
            continue
        if not os.path.isabs(p):
            p = os.path.join(base, p)
        (todo if os.path.isfile(p) else missing).append((r, p))
    print(f"{len(todo)} movie{'s' if len(todo) != 1 else ''} to do.")
    for r, p in todo:
        folder = os.path.join(PICKS, re.sub(r'[<>:"/\\|?*]', "", r["movie"]).strip())
        if os.path.isdir(folder) and os.listdir(folder):
            print(f"\n{r['movie']}: already in the picks folder, skipping (delete its folder there to redo it)")
            continue
        try:
            do_movie(p, rows, r)
        except Exception as e:
            print(f"\nSomething went wrong with {r['movie']}: {e}")
    if missing:
        print("\nCouldn't find these files (check the path in movie_file):")
        for r, p in missing:
            print(f"  {r['movie']}: {p}")
    print(f"\nDone. Open the picks folder ({PICKS}), keep your favorite of each and delete the others.")
    print('Then run "Finish picks" to move the ones you kept into the game.')


def finish(out_dir):
    if not os.path.isdir(PICKS):
        print("Nothing to finish: there's no picks folder yet. Drop some movies first.")
        return
    os.makedirs(out_dir, exist_ok=True)
    moved, waiting = 0, []
    for movie in sorted(os.listdir(PICKS)):
        folder = os.path.join(PICKS, movie)
        if not os.path.isdir(folder):
            continue
        groups = {}
        for fn in os.listdir(folder):
            m = PICK_NAME.match(fn)
            if m:
                groups.setdefault(m["base"] + m["ext"].lower(), []).append(fn)
        for final, files in sorted(groups.items()):
            if len(files) > 1:
                waiting.append(f"{movie}: {len(files)} left for {final}")
                continue
            shutil.move(os.path.join(folder, files[0]), os.path.join(out_dir, final))
            print(f"  {movie}: kept {files[0]}  ->  {final}")
            moved += 1
        if not os.listdir(folder):
            os.rmdir(folder)
    print(f"\nMoved {moved} file{'s' if moved != 1 else ''} into {out_dir}")
    if waiting:
        print("\nStill more than one choice here, so these were left alone. Delete the ones you don't want and finish again:")
        for w in waiting:
            print("  " + w)


def ask_for_paths():
    print("Drag one or more movie files into this window, then press Enter.")
    print("(Or type the full path. Press Enter on an empty line to quit.)")
    text = input("> ").strip()
    if not text:
        return []
    if os.path.exists(text.strip('"')):  # one path with spaces, not quoted
        return [text.strip('"')]
    # Windows puts quotes around dragged paths with spaces; a Mac puts a backslash before each space.
    return [p.strip('"') for p in shlex.split(text, posix=os.name != "nt")]


def main():
    ap = argparse.ArgumentParser(description="Make 3 choices of every picture, sound and clip for each movie you drop.")
    ap.add_argument("movies", nargs="*", help="movie files")
    ap.add_argument("--finish", action="store_true", help="move the choices you kept into assets/media with their game names")
    ap.add_argument("--csv", metavar="FILE", help="make choices for every row of this list that has a movie_file path, like --csv media-list.csv")
    ap.add_argument("--movie", help="with --csv: only rows whose movie name contains this text, like --movie elf")
    ap.add_argument("--out", default=DEFAULT_OUT, help=f"where finished files go (default: {DEFAULT_OUT})")
    args = ap.parse_args()
    if args.finish:
        finish(args.out)
        return
    need("ffmpeg"); need("ffprobe")
    rows = load_rows()
    if args.csv:
        from_csv(args.csv, args.movie)
        return
    paths = args.movies or ask_for_paths()
    if not paths:
        return
    for p in paths:
        try:
            do_movie(p, rows)
        except Exception as e:
            print(f"\nSomething went wrong with {p}: {e}")
    print(f"\nDone. Open the picks folder ({PICKS}), keep your favorite of each and delete the others.")
    print('Then run "Finish picks" to move the ones you kept into the game.')


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nStopped.")
        sys.exit(1)
