#!/usr/bin/env python3
r"""
Drag-and-drop helper: makes 3 versions of every file for a movie, straight into that movie's folder in your
media folder (media_folder in party/settings.ini, like \\MEDIACENTER\Media01\Trivia Media).

Windows: drag one or more movie files onto "Drop movies here.bat".
Mac: double-click "Drop movies here.command", then drag movies into the window and press Return.

For Elf (2003).mkv you get, in  <media folder>\Elf\ :
  elf_1.png  elf_2.png  elf_3.png             pictures (Freeze Frame / The Frame Game)
  elf_1.mp3  elf_2.mp3  elf_3.mp3             sound clips
  clip-elf_1.mp4  clip-elf_2.mp4  clip-elf_3.mp4   video clips
  (plus kid pictures, for Christmas movies that have their own)
each from a different part of the movie, and times.txt saying where each one came from.
Delete any you don't like. The game plays one of the rest at random. Drop the movie again to refill the gaps:
only missing numbers are made, so the ones you kept are never replaced.

Names come from the game's list (media-list.csv) when it knows the movie, otherwise from the file name.
Have old files named like elf_2 (0-52-13).png? drop_movie.py --tidy "that folder" renames them to elf_2.png.
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

def party_media_folder():
    """The media folder from party/settings.ini (like a network drive), if one is set. Finished files go there."""
    import configparser
    cp = configparser.ConfigParser()
    cp.read(os.path.join(HERE, "..", "party", "settings.ini"), encoding="utf-8-sig")
    folder = cp.get("party", "media_folder", fallback="").strip().strip('"')
    return os.path.expandvars(os.path.expanduser(folder)) if folder else ""


OUT_ROOT = party_media_folder() or DEFAULT_OUT
CSV = os.path.join(HERE, "media-list.csv")
CHOICES = 3
# (column with the game's file name, kind, column with its length)
KINDS = [("frame_png", "picture", None), ("kid_frame_png", "kid picture", None),
         ("sound_mp3", "sound", "sound_seconds"), ("clip_mp4", "clip", "clip_seconds")]
LENGTH = {"sound_seconds": 6.0, "clip_seconds": 8.0}
# An older file name with the time in it:  elf_2 (0-52-13).png ; --tidy turns it into  elf_2.png
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


def movie_folder(row, root):
    return os.path.join(root, re.sub(r'[<>:"/\\|?*]', "", row["movie"]).strip().rstrip("."))


SKIP_DIRS = {"extras", "featurettes", "behind the scenes", "deleted scenes", "trailers", "samples", "sample",
             "interviews", "shorts", "other", "bonus", "special features", "subs", "subtitles"}
SKIP_WORDS = re.compile(r"\b(sample|trailer|featurette|deleted scene|behind the scenes|extras?)\b", re.I)


def videos_in(folder):
    """Video files directly in a folder, biggest first, leaving out samples and trailers."""
    out = []
    try:
        names = os.listdir(folder)
    except OSError:
        return out
    for fn in names:
        full = os.path.join(folder, fn)
        if os.path.isfile(full) and os.path.splitext(fn)[1].lower() in VIDEO_EXT and not fn.startswith("._") \
                and not SKIP_WORDS.search(os.path.splitext(fn)[0]):
            out.append(full)
    return sorted(out, key=lambda f: -os.path.getsize(f))


def movies_in_folder(folder):
    """A dropped folder: a movie folder gives its main video (the biggest file). A folder of movie folders
    gives one video per movie folder. Returns [(video, name the movie by)]."""
    vids = videos_in(folder)
    if vids:
        return [(vids[0], os.path.basename(os.path.normpath(folder)))]
    found = []
    for root, dirs, _ in os.walk(folder):
        dirs[:] = sorted(d for d in dirs if d.lower() not in SKIP_DIRS and not d.startswith("."))
        if root == folder:
            continue
        v = videos_in(root)
        if v:
            found.append((v[0], os.path.basename(root)))
            dirs[:] = []  # don't go into this movie's own subfolders (extras and so on)
    return found


def do_movie(path, rows, row=None, root=None, name=None):
    path = path.strip().strip('"').strip("'")
    if not os.path.isfile(path):
        print(f"\nCan't find {path}")
        return
    if os.path.splitext(path)[1].lower() not in VIDEO_EXT:
        print(f"\nSkipping {os.path.basename(path)}: not a video file")
        return
    # When a folder was dropped, its name ("Alien (1979)") is a better guide than the file name ("movie.mkv").
    named = os.path.join(os.path.dirname(path), name + os.path.splitext(path)[1]) if name else path
    row = row or which_movie(named, rows)
    folder = movie_folder(row, root or OUT_ROOT)
    try:
        os.makedirs(folder, exist_ok=True)
    except OSError:
        print(f"\nCan't write to {folder}. Is the network drive on? Open it in File Explorer once, then try again.")
        return
    total = duration(path)
    print(f"\n{row['movie']}  ({os.path.basename(path)}, {fmt_time(total)} long)")
    log = []
    for col, kind, len_col in KINDS:
        name = (row.get(col) or "").strip()
        if not name:
            continue
        base, ext = os.path.splitext(name)
        have = [n for n in range(1, CHOICES + 1) if os.path.exists(os.path.join(folder, f"{base}_{n}{ext}"))]
        free = [n for n in range(1, CHOICES + 1) if n not in have]
        if not free:
            print(f"  {kind}: already has {CHOICES}. Delete the ones you don't like to make new ones.")
            continue
        secs = parse_time(row.get(len_col)) if len_col else 0
        secs = secs or LENGTH.get(len_col, 0)
        lo, hi = total * 0.12, max(total * 0.12 + 1, total * 0.88 - secs)
        step = (hi - lo) / CHOICES
        for n in free:
            a, b = lo + (n - 1) * step, lo + n * step
            out = os.path.join(folder, f"{base}_{n}{ext}")
            try:
                if ext.lower() == ".png":
                    t = bright_frame(path, a, b, out)
                else:
                    t = random.uniform(a, b)
                    (make_sound if ext.lower() == ".mp3" else make_clip)(path, t, secs, out)
                log.append(f"{os.path.basename(out)}\t{fmt_time(t)}\t{path}")
                print(f"  {kind} {n}: {os.path.basename(out)}  (from {fmt_time(t)})")
            except Exception as e:  # keep going with the rest
                print(f"  {kind} {n}: couldn't make it ({e})")
    if log:
        with open(os.path.join(folder, "times.txt"), "a", encoding="utf-8") as f:
            f.write("\n".join(log) + "\n")
    print(f"  Saved in {folder}")


def from_csv(csv_path, only=None):
    """Make 3 versions of each file for every row with a movie_file. Files that are already there are skipped,
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
        try:
            do_movie(p, rows, r)
        except Exception as e:
            print(f"\nSomething went wrong with {r['movie']}: {e}")
    if missing:
        print("\nCouldn't find these files (check the path in movie_file):")
        for r, p in missing:
            print(f"  {r['movie']}: {p}")
    print(f"\nDone. The files are in {OUT_ROOT}, one folder per movie. Delete any you don't like.")


def game_name(fn):
    """elf_2 (0-52-13).png -> elf_2.png, the name the game looks for. None if it isn't a pick."""
    m = PICK_NAME.match(fn)
    return f"{m['base']}_{m['n']}{m['ext'].lower()}" if m else None


def tidy(folder):
    """Rename files like elf_2 (0-52-13).png to elf_2.png, in their own folders."""
    n = 0
    for root, _, files in os.walk(folder):
        for fn in files:
            final = game_name(fn)
            if final and final != fn and not os.path.exists(os.path.join(root, final)):
                os.rename(os.path.join(root, fn), os.path.join(root, final))
                print(f"  {fn}  ->  {final}")
                n += 1
    print(f"\nRenamed {n} file{'s' if n != 1 else ''}.")


def ask_for_paths():
    print("Drag one or more movie files or movie folders into this window, then press Enter.")
    print("(Or type the full path. Press Enter on an empty line to quit.)")
    text = input("> ").strip()
    if not text:
        return []
    if os.path.exists(text.strip('"')):  # one path with spaces, not quoted
        return [text.strip('"')]
    # Windows puts quotes around dragged paths with spaces; a Mac puts a backslash before each space.
    return [p.strip('"') for p in shlex.split(text, posix=os.name != "nt")]


def main():
    global OUT_ROOT
    ap = argparse.ArgumentParser(description="Make 3 choices of every picture, sound and clip for each movie you drop.")
    ap.add_argument("movies", nargs="*", help="movie files")
    ap.add_argument("--csv", metavar="FILE", help="make choices for every row of this list that has a movie_file path, like --csv media-list.csv")
    ap.add_argument("--movie", help="with --csv: only rows whose movie name contains this text, like --movie elf")
    ap.add_argument("--tidy", metavar="FOLDER", help="rename files like elf_2 (0-52-13).png in this folder (and its subfolders) to elf_2.png, in place")
    ap.add_argument("--out", default=OUT_ROOT, help=f"the media folder to save into (default: media_folder in party/settings.ini, or else {DEFAULT_OUT})")
    args = ap.parse_args()
    if args.tidy:
        tidy(os.path.abspath(args.tidy.strip('"')))
        return
    OUT_ROOT = args.out
    need("ffmpeg"); need("ffprobe")
    rows = load_rows()
    if args.csv:
        from_csv(args.csv, args.movie)
        return
    paths = args.movies or ask_for_paths()
    if not paths:
        return
    jobs = []
    for p in paths:
        p = p.strip().strip('"').strip("'")
        if os.path.isdir(p):
            found = movies_in_folder(p)
            if not found:
                print(f"\nNo video file in {p}")
            jobs += found
        else:
            jobs.append((p, None))
    if len(jobs) > 1:
        print(f"{len(jobs)} movies to do.")
    for p, name in jobs:
        try:
            do_movie(p, rows, name=name)
        except Exception as e:
            print(f"\nSomething went wrong with {p}: {e}")
    print(f"\nDone. The files are in {OUT_ROOT}, one folder per movie. Delete any you don't like.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nStopped.")
        sys.exit(1)
