#!/usr/bin/env python3
"""
Runs the trivia game from this computer, and gives it a public address so phones anywhere can join.

  - Serves the game pages (screen.html, play.html, host.html) from this folder's parent.
  - Serves pictures, sounds and clips from the media folder in settings.ini (a network drive is fine),
    falling back to assets/media.
  - Starts a free Cloudflare quick tunnel (cloudflared), which gives an address like
    https://some-words.trycloudflare.com. The big screen's QR code uses it automatically.
  - Opens the big screen in your browser and keeps the computer awake until you stop it (Ctrl+C).

Only standard Python is needed. The tunnel needs cloudflared: winget install Cloudflare.cloudflared
"""
import configparser
import glob
import json
import mimetypes
import os
import posixpath
import re
import shutil
import subprocess
import sys
import threading
import time
import urllib.parse
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SETTINGS = os.path.join(HERE, "settings.ini")
mimetypes.add_type("audio/mpeg", ".mp3")
mimetypes.add_type("video/mp4", ".mp4")
mimetypes.add_type("application/javascript", ".js")

state = {"publicUrl": None}


def load_settings():
    cp = configparser.ConfigParser()
    cp.read(SETTINGS, encoding="utf-8-sig")
    s = cp["party"] if cp.has_section("party") else {}
    media = (s.get("media_folder") or "").strip().strip('"')
    return {
        "port": int((s.get("port") or "8080").strip()),
        "media": os.path.expandvars(os.path.expanduser(media)) if media else "",
        "tunnel": (s.get("tunnel") or "yes").strip().lower() not in ("no", "off", "false", "0"),
        "open_browser": (s.get("open_browser") or "yes").strip().lower() not in ("no", "off", "false", "0"),
    }


CFG = load_settings()


MEDIA_DIRS = [d for d in [CFG["media"], os.path.join(ROOT, "assets", "media")] if d]
_index = {"at": 0.0, "files": {}}
_index_lock = threading.Lock()


def media_file(name):
    """Find a media file by name anywhere in the media folders, including each movie's own subfolder
    (Trivia Media/Elf/elf_1.png). The list is rebuilt when a name is missing, at most every 15 seconds."""
    key = name.lower()
    hit = _index["files"].get(key)
    if hit and os.path.isfile(hit):
        return hit
    with _index_lock:
        if time.time() - _index["at"] > 15:
            files = {}
            for top in MEDIA_DIRS:
                for root, dirs, names in os.walk(top):
                    dirs[:] = [d for d in dirs if not d.startswith(".")]
                    for fn in names:
                        files.setdefault(fn.lower(), os.path.join(root, fn))
            _index["files"], _index["at"] = files, time.time()
    return _index["files"].get(key)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def log_message(self, fmt, *args):  # keep the window readable
        pass

    def end_headers(self):
        # Game code changes rarely matter mid-party, but never cache it across updates.
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def translate_path(self, path):
        # Resolve any ".." first, so the checks below see the real path.
        clean = posixpath.normpath(urllib.parse.unquote(urllib.parse.urlsplit(path).path).replace("\\", "/"))
        if clean.startswith("/assets/media/"):
            name = clean[len("/assets/media/"):]
            if "/" not in name:
                hit = media_file(name)
                if hit:
                    return hit
        # Don't serve the tools, the party folder's settings or git files to the internet.
        if re.match(r"^/(tools|party|\.git)(/|$)", clean):
            return os.path.join(ROOT, "__not_here__")
        return super().translate_path(clean)

    def list_directory(self, path):  # no folder listings
        self.send_error(404)
        return None

    def do_GET(self):
        if self.path.split("?")[0] == "/party-info.json":
            body = json.dumps(state).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        rng = self.headers.get("Range")
        path = self.translate_path(self.path)
        if not rng or not os.path.isfile(path):
            return super().do_GET()
        # Byte ranges, so sound and video can start anywhere and Safari on iPhones plays them.
        m = re.match(r"bytes=(\d*)-(\d*)", rng)
        size = os.path.getsize(path)
        if not m:
            return super().do_GET()
        start = int(m.group(1)) if m.group(1) else max(0, size - int(m.group(2) or 0))
        end = int(m.group(2)) if m.group(1) and m.group(2) else size - 1
        end = min(end, size - 1)
        if start > end:
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.end_headers()
            return
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.end_headers()
        try:
            with open(path, "rb") as f:
                f.seek(start)
                left = end - start + 1
                while left > 0:
                    chunk = f.read(min(256 * 1024, left))
                    if not chunk:
                        break
                    self.wfile.write(chunk)
                    left -= len(chunk)
        except (BrokenPipeError, ConnectionResetError):
            pass


def find_cloudflared():
    exe = shutil.which("cloudflared")
    if exe:
        return exe
    # winget puts it here, but a window opened before the install won't have it on its PATH yet.
    for pattern in [r"C:\Program Files\cloudflared\cloudflared.exe", r"C:\Program Files (x86)\cloudflared\cloudflared.exe",
                    os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Packages\Cloudflare.cloudflared*\cloudflared.exe"),
                    os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Links\cloudflared.exe")]:
        hits = glob.glob(pattern)
        if hits:
            return hits[0]
    return None


def start_tunnel(port):
    exe = find_cloudflared()
    if not exe:
        print("\n  Can't find cloudflared, so only this computer can reach the game.")
        print("  Install it with:  winget install Cloudflare.cloudflared   then start the party again.\n")
        return None
    proc = subprocess.Popen([exe, "tunnel", "--no-autoupdate", "--url", f"http://127.0.0.1:{port}"],
                            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding="utf-8", errors="replace")

    def watch():
        for line in proc.stdout:
            m = re.search(r"https://[a-z0-9-]+\.trycloudflare\.com", line)
            if m and not state["publicUrl"]:
                state["publicUrl"] = m.group(0)
    threading.Thread(target=watch, daemon=True).start()
    return proc


def keep_awake(on):
    """Stop Windows from sleeping while the party runs."""
    if os.name != "nt":
        return
    try:
        import ctypes
        ES_CONTINUOUS, ES_SYSTEM_REQUIRED, ES_DISPLAY_REQUIRED = 0x80000000, 0x00000001, 0x00000002
        ctypes.windll.kernel32.SetThreadExecutionState(ES_CONTINUOUS | (ES_SYSTEM_REQUIRED | ES_DISPLAY_REQUIRED if on else 0))
    except Exception:
        pass


def main():
    port = CFG["port"]
    try:
        server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    except OSError:
        sys.exit(f"Port {port} is already in use. Is the party already running in another window? "
                 f"Close it, or change port in {SETTINGS}.")
    threading.Thread(target=server.serve_forever, daemon=True).start()
    local = f"http://localhost:{port}/screen.html"

    print("Trivia party server")
    if CFG["media"]:
        if os.path.isdir(CFG["media"]):
            count = sum(1 for _, _, fs in os.walk(CFG["media"]) for f in fs if os.path.splitext(f)[1].lower() in (".png", ".jpg", ".mp3", ".mp4"))
            print(f"  Media folder: {CFG['media']}  ({count} files)")
        else:
            print(f"  Can't open the media folder {CFG['media']}. Is the network drive connected? Using assets/media instead.")
    else:
        print("  Media folder: assets/media (set media_folder in party/settings.ini to use another one)")

    tunnel = start_tunnel(port) if CFG["tunnel"] else None
    if tunnel:
        print("  Starting the public address...", end="", flush=True)
        for _ in range(60):
            if state["publicUrl"] or tunnel.poll() is not None:
                break
            time.sleep(0.5)
        if state["publicUrl"]:
            print(f"\n  Phones join at: {state['publicUrl']}/play.html  (the QR code on the big screen has it)")
        else:
            print("\n  The public address didn't start (is the internet working?). Only this computer can reach the game.")

    print(f"  Big screen:     {local}")
    if CFG["open_browser"]:
        webbrowser.open(local)
    keep_awake(True)
    print("\nLeave this window open during the party. Press Ctrl+C (or close it) to stop.\n")
    try:
        while True:
            time.sleep(1)
            if tunnel and tunnel.poll() is not None:
                print("  The public address stopped. Restarting it...")
                state["publicUrl"] = None
                tunnel = start_tunnel(port)
    except KeyboardInterrupt:
        print("\nStopping the party.")
    finally:
        keep_awake(False)
        if tunnel:
            tunnel.terminate()
        server.shutdown()


if __name__ == "__main__":
    main()
