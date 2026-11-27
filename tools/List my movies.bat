@echo off
rem Double-click and press Enter to list your Trivia Media folder, or drag your movies folder onto this file.
rem It writes trivia-media-list.csv or movie-list.csv here, with whether the game has questions for each movie.
cd /d "%~dp0"
set PY=python
where py >nul 2>nul && set PY=py
%PY% list_movies.py %*
echo.
pause
