@echo off
rem Drag your movies folder onto this file (or double-click and paste the path).
rem It writes movie-list.csv in this folder: every movie, its year, and whether the game has questions for it.
cd /d "%~dp0"
set PY=python
where py >nul 2>nul && set PY=py
%PY% list_movies.py %*
echo.
pause
