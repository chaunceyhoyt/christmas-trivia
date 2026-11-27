@echo off
rem Drag one or more movie files onto this file. It makes 3 choices of each picture, sound and clip.
cd /d "%~dp0"
set PY=python
where py >nul 2>nul && set PY=py
%PY% drop_movie.py %*
echo.
pause
