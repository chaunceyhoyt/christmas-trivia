@echo off
rem Drag movie files or movie folders onto this file. It makes 3 versions of each picture, sound and clip.
cd /d "%~dp0"
set PY=python
where py >nul 2>nul && set PY=py
%PY% drop_movie.py %*
echo.
pause
