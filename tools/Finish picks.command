#!/bin/bash
# Double-click after deleting the choices you don't want. Moves the ones you kept into assets/media.
cd "$(dirname "$0")"
python3 drop_movie.py --finish
read -p "Press Return to close."
