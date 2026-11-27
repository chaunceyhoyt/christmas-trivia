#!/usr/bin/env python3
"""
Make the Frame Game pictures, Soundbites and Clip Show clips from your own movie files.

Fill in media-list.csv (the movie_file column at least), then run:

    python make_media.py media-list.csv --movies "/path/to/your/movies"

For each row it writes, into ../assets/media (next to this tools folder):
  - frame_png   a still picture, about 1920x1080
  - sound_mp3   a short sound clip (a few seconds)
  - clip_mp4    a short video clip, 720p

Leave a time blank and the script picks a random moment (it skips the opening and
closing credits and avoids dark frames). Fill in a time like 1:02:33 to choose the
exact moment. Soundbites should always get a time: a random sound is rarely a
famous line.

Every time it picks at random, it writes the time it used to media-list.chosen.csv,
so you can copy a good one back into media-list.csv and keep it.

Needs Python 3 and ffmpeg (which includes ffprobe). See README.md in this folder.
"""
import argparse
import csv
import os
import random
import re
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_OUT = os.path.normpath(os.path.join(HERE, "..", "assets", "media"))
MAX_PNG_BYTES = 2_500_000   # bigger pictures load slowly on the TV
DARK_LEVEL = 35             # average brightness (0-255) below which a frame counts as too dark


def run(cmd):
    return subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8", errors="replace")


def need(tool):
    if not shutil.which(tool):
        sys.exit(f"Can't find {tool}. Install ffmpeg first (see README.md in the tools folder), then try again.")


def parse_time(text):
    """'1:02:33', '62:33', '3753' or '3753.5' -> seconds. Blank -> None."""
    text = (text or "").strip()
    if not text:
        return None
    parts = text.split(":")
    try:
        nums = [float(p) for p in parts]
    except ValueError:
        raise ValueError(f"Can't read the time '{text}'. Use hours:minutes:seconds, like 1:02:33.")
    secs = 0.0
    for n in nums:
        secs = secs * 60 + n
    return secs


def fmt_time(secs):
    secs = int(round(secs))
    return f"{secs // 3600}:{secs % 3600 // 60:02d}:{secs % 60:02d}"


def duration(path):
    r = run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", path])
    try:
        return float(r.stdout.strip())
    except ValueError:
        raise RuntimeError(f"Can't read {path}. Is it a video file?")


def random_time(total, length=0.0):
    """A random moment between 12% and 88% of the way through, so it skips the credits."""
    lo, hi = total * 0.12, max(total * 0.12, total * 0.88 - length)
    return random.uniform(lo, hi)


def brightness(png):
    r = run(["ffmpeg", "-v", "info", "-i", png, "-vf", "signalstats,metadata=print:key=lavfi.signalstats.YAVG", "-f", "null", "-"])
    m = re.search(r"YAVG=([\d.]+)", r.stderr)
    return float(m.group(1)) if m else 128.0


def grab_frame(movie, at, out, width=1920):
    # The thumbnail filter looks at the next 50 frames and keeps the most typical one, which avoids blurry in-between frames.
    cmd = ["ffmpeg", "-y", "-v", "error", "-ss", f"{at:.2f}", "-i", movie, "-map", "0:v:0",
           "-vf", f"thumbnail=50,scale='min({width},iw)':-2", "-frames:v", "1", "-compression_level", "9", out]
    r = run(cmd)
    if r.returncode != 0 or not os.path.exists(out):
        raise RuntimeError(r.stderr.strip().splitlines()[-1] if r.stderr.strip() else "ffmpeg could not save the picture")
    if os.path.getsize(out) > MAX_PNG_BYTES and width > 1280:
        return grab_frame(movie, at, out, width - 320)
    return out


def make_frame(movie, at, out, total, tries=6):
    """Save one still. With no time given, try random moments until one isn't too dark."""
    if at is not None:
        return grab_frame(movie, at, out), at, False
    best = None
    for _ in range(tries):
        t = random_time(total)
        grab_frame(movie, t, out)
        level = brightness(out)
        if level >= DARK_LEVEL:
            return out, t, True
        if best is None or level > best[1]:
            best = (t, level)
    grab_frame(movie, best[0], out)
    return out, best[0], True


def make_sound(movie, start, secs, out):
    fade = min(0.4, secs / 4)
    af = f"loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:d=0.15,afade=t=out:st={max(0, secs - fade):.2f}:d={fade:.2f}"
    r = run(["ffmpeg", "-y", "-v", "error", "-ss", f"{start:.2f}", "-i", movie, "-t", f"{secs:.2f}", "-map", "0:a:0",
             "-vn", "-af", af, "-ac", "2", "-ar", "44100", "-b:a", "160k", out])
    if r.returncode != 0:
        raise RuntimeError(r.stderr.strip().splitlines()[-1] if r.stderr.strip() else "ffmpeg could not save the sound")


def make_clip(movie, start, secs, out):
    fade = min(0.4, secs / 4)
    af = f"loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:d=0.2,afade=t=out:st={max(0, secs - fade):.2f}:d={fade:.2f}"
    r = run(["ffmpeg", "-y", "-v", "error", "-ss", f"{start:.2f}", "-i", movie, "-t", f"{secs:.2f}",
             "-map", "0:v:0", "-map", "0:a:0?", "-vf", "scale=-2:'min(720,ih)'",
             "-c:v", "libx264", "-preset", "medium", "-crf", "26", "-pix_fmt", "yuv420p",
             "-af", af, "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", out])
    if r.returncode != 0:
        raise RuntimeError(r.stderr.strip().splitlines()[-1] if r.stderr.strip() else "ffmpeg could not save the clip")


def main():
    ap = argparse.ArgumentParser(description="Make Frame Game pictures, Soundbites and Clip Show clips from your movie files.")
    ap.add_argument("csv", help="media-list.csv")
    ap.add_argument("--movies", default=".", help="folder your movie files are in (movie_file can be just the file name)")
    ap.add_argument("--out", default=DEFAULT_OUT, help=f"where to save the files (default: {DEFAULT_OUT})")
    ap.add_argument("--only", choices=["frames", "sounds", "clips"], help="make only one kind of file")
    ap.add_argument("--movie", help="only rows whose movie name contains this text, like --movie elf")
    ap.add_argument("--candidates", type=int, default=0, metavar="N",
                    help="for frames with no time, save N random options to a 'candidates' folder to choose from instead")
    ap.add_argument("--overwrite", action="store_true", help="replace files that already exist")
    args = ap.parse_args()

    need("ffmpeg"); need("ffprobe")
    os.makedirs(args.out, exist_ok=True)
    with open(args.csv, newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))

    chosen, made, skipped, problems = [], 0, 0, []
    for row in rows:
        name = (row.get("movie") or "").strip()
        if args.movie and args.movie.lower() not in name.lower():
            continue
        src = (row.get("movie_file") or "").strip().strip('"')
        if not src:
            continue
        movie = src if os.path.isabs(src) else os.path.join(args.movies, src)
        if not os.path.exists(movie):
            problems.append(f"{name}: can't find the movie file {movie}")
            continue
        try:
            total = duration(movie)
        except RuntimeError as e:
            problems.append(f"{name}: {e}")
            continue
        print(f"\n{name}  ({fmt_time(total)} long)")
        record = {"movie": name}

        def target(col):
            fn = (row.get(col) or "").strip()
            if not fn:
                return None
            path = os.path.join(args.out, fn)
            if os.path.exists(path) and not args.overwrite:
                print(f"  {fn}: already there, skipping (add --overwrite to replace it)")
                return "skip"
            return path

        try:
            # Picture
            if args.only in (None, "frames"):
                out = target("frame_png")
                if out == "skip":
                    skipped += 1
                elif out:
                    at = parse_time(row.get("frame_time"))
                    if at is None and args.candidates > 0:
                        folder = os.path.join(args.out, "candidates")
                        os.makedirs(folder, exist_ok=True)
                        stem = os.path.splitext(os.path.basename(out))[0]
                        # Spread the options across the movie: one random moment in each equal slice.
                        lo, hi = total * 0.12, total * 0.88
                        step = (hi - lo) / args.candidates
                        for i in range(args.candidates):
                            for _ in range(4):
                                t = random.uniform(lo + i * step, lo + (i + 1) * step)
                                p = os.path.join(folder, f"{stem}_{fmt_time(t).replace(':', '-')}.png")
                                grab_frame(movie, t, p)
                                if brightness(p) >= DARK_LEVEL:
                                    break
                                os.remove(p)
                        print(f"  {args.candidates} options saved in {folder}. Pick one, put its time in frame_time, and run again.")
                    else:
                        _, t, was_random = make_frame(movie, at, out, total)
                        made += 1
                        print(f"  {os.path.basename(out)}  at {fmt_time(t)}{'  (random)' if was_random else ''}")
                        if was_random:
                            record["frame_time"] = fmt_time(t)
            # Sound
            if args.only in (None, "sounds"):
                out = target("sound_mp3")
                if out == "skip":
                    skipped += 1
                elif out:
                    secs = parse_time(row.get("sound_seconds")) or 6
                    start = parse_time(row.get("sound_start"))
                    if start is None:
                        start = random_time(total, secs)
                        record["sound_start"] = fmt_time(start)
                        print(f"  {os.path.basename(out)}  at {fmt_time(start)}  (random: add the time of a famous line to sound_start for a real soundbite)")
                    else:
                        print(f"  {os.path.basename(out)}  at {fmt_time(start)}, {secs:g} seconds")
                    make_sound(movie, start, secs, out)
                    made += 1
            # Video clip
            if args.only in (None, "clips"):
                out = target("clip_mp4")
                if out == "skip":
                    skipped += 1
                elif out:
                    secs = parse_time(row.get("clip_seconds")) or 8
                    start = parse_time(row.get("clip_start"))
                    if start is None:
                        start = random_time(total, secs)
                        record["clip_start"] = fmt_time(start)
                    make_clip(movie, start, secs, out)
                    made += 1
                    mb = os.path.getsize(out) / 1e6
                    print(f"  {os.path.basename(out)}  at {fmt_time(start)}, {secs:g} seconds, {mb:.1f} MB{'  (random)' if 'clip_start' in record else ''}")
        except (RuntimeError, ValueError) as e:
            problems.append(f"{name}: {e}")
        if len(record) > 1:
            chosen.append(record)

    if chosen:
        log = os.path.splitext(args.csv)[0] + ".chosen.csv"
        with open(log, "w", newline="", encoding="utf-8-sig") as f:
            w = csv.DictWriter(f, fieldnames=["movie", "frame_time", "sound_start", "clip_start"])
            w.writeheader()
            w.writerows(chosen)
        print(f"\nRandom times used are saved in {log}. Copy any you like into {os.path.basename(args.csv)} to keep them.")
    print(f"\nDone: {made} made, {skipped} already there.")
    if problems:
        print("\nThese need a look:")
        for p in problems:
            print("  - " + p)
    if made:
        print(f"\nThe files are in {args.out}. Upload them to assets/media on GitHub.")


if __name__ == "__main__":
    main()
