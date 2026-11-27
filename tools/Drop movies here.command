#!/bin/bash
# Double-click, then drag movie files into the window and press Return.
cd "$(dirname "$0")"
python3 drop_movie.py "$@"
read -p "Press Return to close."
