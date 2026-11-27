@echo off
rem Double-click to run the game from this computer. Leave the window open during the party.
cd /d "%~dp0"
set PY=python
where py >nul 2>nul && set PY=py
%PY% party\party_server.py
echo.
pause
