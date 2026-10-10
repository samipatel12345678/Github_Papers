@echo off
title Google Antigravity - Universal Multi-AI Studio
echo ========================================================
echo   Starting Google Antigravity Multi-Agent Studio
echo   (Single Shared History: Antigravity, Claude, Cursor, Devin)
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Checking dependencies...
if not exist "node_modules\" (
    echo Installing dependencies (this only takes a moment)...
    call npm install
)

echo.
echo [2/2] Launching Antigravity Studio at http://localhost:5000...
echo.

start http://localhost:5000
node server/server.js

pause
