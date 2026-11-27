#!/usr/bin/env python3
"""
Drag-and-drop helper: makes 3 choices of every file for a movie, so you can keep the best one.

Windows: drag one or more movie files onto "Drop movies here.bat".
Mac: double-click "Drop movies here.command", then drag movies into the window and press Return.

For each movie it works out which game movie it is (from media-list.csv), then makes, in tools/picks/<Movie>/:
  3 Frame Game pictures, 3 Kid Frame Game pictures (if that movie has one), 3 sound clips and 3 video clips,
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
                        make_clip, make_sound, match_score, need, parse_time)

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
    with open(CSV, newline="", encoding="utf-8-sig") as f:
        return [r for r in csv.DictReader(f) if (r.get("movie") or "").strip()]


def which_movie(path, rows):
    """The media-list row this movie file belongs to. Asks if it can't tell."""
    scored = sorted((sc, i) for i, r in enumerate(rows) for sc in [match_score(r["movie"], path)] if sc is not None)
    if scored and (len(scored) == 1 or scored[1][0] - scored[0][0] > 0.01):
        return rows[scored[0][1]]
    options = [rows[i] for _, i in scored] if scored else rows
    print(f"\nWhich movie is {os.path.basename(path)}?")
    for n, r in enumerate(options, 1):
        print(f"  {n:>2}. {r['movie']}")
    while True:
        pick = input("Type its number and press Enter (or just Enter to skip it): ").strip()
        if not pick:
            return None
        if pick.isdigit() and 1 <= int(pick) <= len(options):
            return options[int(pick) - 1]


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


def do_movie(path, rows):
    path = path.strip().strip('"').strip("'")
    if not os.path.isfile(path):
        print(f"\nCan't find {path}")
        return
    if os.path.splitext(path)[1].lower() not in VIDEO_EXT:
        print(f"\nSkipping {os.path.basename(path)}: not a video file")
        return
    row = which_movie(path, rows)
    if not row:
        return
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
    ap.add_argument("--out", default=DEFAULT_OUT, help=f"where finished files go (default: {DEFAULT_OUT})")
    args = ap.parse_args()
    if args.finish:
        finish(args.out)
        return
    need("ffmpeg"); need("ffprobe")
    rows = load_rows()
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
