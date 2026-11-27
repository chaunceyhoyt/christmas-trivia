@echo off
rem Double-click after deleting the choices you don't want. Moves the ones you kept into assets\media.
cd /d "%~dp0"
set PY=python
where py >nul 2>nul && set PY=py
%PY% drop_movie.py --finish
echo.
pause
