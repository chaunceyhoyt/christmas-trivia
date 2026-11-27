#!/usr/bin/env python3
"""
Make a list of every movie in your movie folders, with a clean title and year, and whether the game
already has questions for it.

Windows: drag your movies folder (or several) onto "List my movies.bat", or double-click it and paste a path.
Or run:  python list_movies.py "\\\\MEDIACENTER\\Media01\\Movies"  "D:\\More Movies"

It looks through every subfolder, skips TV episodes, samples, trailers and extras, and writes
movie-list.csv next to this script. Send that file back to get questions written for the missing ones.
"""
import csv
import os
import re
import shlex
import sys

from make_media import JUNK, VIDEO_EXT, words

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "movie-list.csv")
GAME_FILES = [os.path.join(HERE, "..", "assets", "questions.js"), os.path.join(HERE, "..", "assets", "questions-movies.js")]
YEAR = re.compile(r"(?<!\d)(19[2-9]\d|20[0-4]\d)(?!\d)")
EPISODE = re.compile(r"\bS\d{1,2}\s?E\d{1,3}\b|\b\d{1,2}x\d{2}\b|\bSeason\s?\d+\b|\bEpisode\s?\d+\b", re.I)
SKIP_DIRS = {"extras", "featurettes", "behind the scenes", "deleted scenes", "trailers", "samples", "sample",
             "interviews", "shorts", "other", "bonus", "special features", "$recycle.bin", "system volume information"}
SKIP_WORDS = re.compile(r"\b(sample|trailer|featurette|deleted scene|behind the scenes|extras?)\b", re.I)
SMALL = 150 * 1024 * 1024  # files under 150 MB are almost always samples or extras


def clean_title(name):
    """'The.Lion.King.1994.1080p.BluRay' -> ('The Lion King', '1994')."""
    s = re.sub(r"[._]+", " ", name)
    year = ""
    br = re.search(r"[\[(]\s*(19[2-9]\d|20[0-4]\d)\s*[\])]", s)   # (1994) or [2013]
    if br:
        year, s = br.group(1), s[:br.start()]
    s = re.sub(r"\[[^\]]*\]|\{[^}]*\}", " ", s)            # [tags] and {tmdb-123}
    m = None
    for m2 in YEAR.finditer(s):
        if m2.start() > 0:                                   # a year at the very start is part of the title (2001: A Space Odyssey)
            m = m2
            break
    if m and not year:
        year, s = m.group(1), s[:m.start()]
    else:
        toks = s.split()
        for i, t in enumerate(toks):
            if i and re.sub(r"[^a-z0-9]", "", t.lower()) in JUNK:
                s = " ".join(toks[:i])
                break
    # Drop leftover tags at the end, like "Extended Edition" or "Remastered".
    toks = s.split()
    while len(toks) > 1 and re.sub(r"[^a-z0-9]", "", toks[-1].lower()) in JUNK:
        toks.pop()
    s = " ".join(toks)
    s = re.sub(r"[\s(\-–]+$", "", s.strip()).strip(" -–(")
    s = re.sub(r"\s{2,}", " ", s)
    if s and (s.islower() or s.isupper()):
        s = " ".join(w.capitalize() if w.lower() not in {"of", "the", "and", "a", "an", "in", "to"} or i == 0 else w.lower()
                     for i, w in enumerate(s.split()))
    return s, year


def find_movies(folders):
    found = {}
    for top in folders:
        for root, dirs, files in os.walk(top):
            dirs[:] = [d for d in dirs if d.lower() not in SKIP_DIRS and not d.startswith(".")]
            for fn in files:
                stem, ext = os.path.splitext(fn)
                if ext.lower() not in VIDEO_EXT or fn.startswith("._"):
                    continue
                path = os.path.join(root, fn)
                if EPISODE.search(stem) or SKIP_WORDS.search(stem):
                    continue
                try:
                    if os.path.getsize(path) < SMALL:
                        continue
                except OSError:
                    continue
                title, year = clean_title(stem)
                # Files like "movie.mkv" inside "The Lion King (1994)": the folder has the real name.
                folder_title, folder_year = clean_title(os.path.basename(root))
                if not year and folder_year:
                    title, year = folder_title, folder_year
                elif not words(title):
                    title = folder_title
                if not title or EPISODE.search(os.path.basename(root)):
                    continue
                key = (" ".join(words(title)), year)
                found.setdefault(key, (title, year, path))
    return sorted(found.values(), key=lambda x: (" ".join(w for w in words(x[0]) if w not in {"the", "a", "an"}), x[1]))


def game_text():
    text = ""
    for f in GAME_FILES:
        try:
            text += open(f, encoding="utf-8").read()
        except OSError:
            pass
    return " " + " ".join(words(text)) + " "


# ---------- The Trivia Media folder: what the drop tool has already made ----------
MEDIA_FILE = re.compile(r"^(?P<clip>clip-)?(?P<slug>.+?)_(?P<n>\d)\.(?P<ext>png|jpg|mp3|mp4)$", re.I)
MEDIA_OUT = os.path.join(HERE, "trivia-media-list.csv")


def media_folder_setting():
    try:
        from drop_movie import party_media_folder
        return party_media_folder()
    except Exception:
        return ""


def is_media_folder(folder):
    """True for a folder the drop tool fills (movie folders holding files like elf_1.png), not a movie library."""
    try:
        for d in os.listdir(folder)[:200]:
            sub = os.path.join(folder, d)
            names = os.listdir(sub) if os.path.isdir(sub) else [d]
            if any(MEDIA_FILE.match(n) for n in names):
                return True
    except OSError:
        pass
    return False


def list_media(folder):
    raw = ""
    for f in GAME_FILES:
        try:
            raw += open(f, encoding="utf-8").read().lower()
        except OSError:
            pass
    groups = {}
    for root, _, files in os.walk(folder):
        for fn in files:
            m = MEDIA_FILE.match(fn)
            if not m:
                continue
            title = os.path.basename(root) if root != folder else m["slug"]
            g = groups.setdefault(root if root != folder else "~" + m["slug"], {"title": title, "slugs": set(), "pictures": 0, "sounds": 0, "clips": 0, "folder": root})
            g["slugs"].add(m["slug"].lower())
            ext = m["ext"].lower()
            g["clips" if ext == "mp4" else "sounds" if ext == "mp3" else "pictures"] += 1
    rows = []
    for g in sorted(groups.values(), key=lambda g: g["title"].lower()):
        # Christmas questions name the file ("media/elf.png"); Movie Night lists the name ("the-lion-king").
        in_game = any(f"media/{s}." in raw or f"media/clip-{s}." in raw or f'"{s}"' in raw for s in g["slugs"])
        rows.append({"title": g["title"], "pictures": g["pictures"], "sounds": g["sounds"], "clips": g["clips"],
                     "in_game": "yes" if in_game else "no", "folder": g["folder"]})
    with open(MEDIA_OUT, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=["title", "pictures", "sounds", "clips", "in_game", "folder"])
        w.writeheader()
        w.writerows(rows)
    have = sum(r["in_game"] == "yes" for r in rows)
    print(f"\nFound {len(rows)} movies with trivia files. {have} are already used by the game's questions, {len(rows) - have} aren't yet.")
    print(f"Saved the list to {MEDIA_OUT}")
    print("Send that file (or paste its contents) back to get questions for the rest.")


def main():
    folders = [a.strip().strip('"') for a in sys.argv[1:]]
    if not folders:
        default = media_folder_setting()
        print("Drag a folder into this window (or type its path), then press Enter.")
        print("  Your movies folder lists every movie you own.")
        if default:
            print(f"  Or just press Enter to list what's in your Trivia Media folder: {default}")
        text = input("> ").strip()
        if not text and default:
            text = default
        if not text:
            return
        folders = [text.strip('"')] if os.path.isdir(text.strip('"')) else [p.strip('"') for p in shlex.split(text, posix=os.name != "nt")]
    missing = [f for f in folders if not os.path.isdir(f)]
    if missing:
        print("Can't open: " + ", ".join(missing) + ". Is the network drive on? Open it in File Explorer once, then try again.")
        folders = [f for f in folders if f not in missing]
        if not folders:
            return
    if len(folders) == 1 and is_media_folder(folders[0]):
        print(f"{folders[0]} is a Trivia Media folder. Listing the movies you've made files for…")
        return list_media(folders[0])
    print("Looking through " + ", ".join(folders) + " (this can take a minute on a network drive)…")
    movies = find_movies(folders)
    known = game_text()
    rows = []
    for title, year, path in movies:
        in_game = f" {' '.join(words(title))} " in known
        rows.append({"title": title, "year": year, "in_game": "yes" if in_game else "no", "file": path})
    with open(OUT, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=["title", "year", "in_game", "file"])
        w.writeheader()
        w.writerows(rows)
    have = sum(r["in_game"] == "yes" for r in rows)
    print(f"\nFound {len(rows)} movies. {have} already have questions in the game, {len(rows) - have} don't yet.")
    print(f"Saved the list to {OUT}")
    print("Send that file (or paste its contents) back to get questions for the rest.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nStopped.")
