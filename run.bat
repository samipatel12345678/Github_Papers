@echo off
title Multi Coding Agents Studio
echo ========================================================
echo   Starting Multi-Coding Agents MERN Studio
echo   (Single Shared History Multi-Agent Architecture)
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Checking dependencies...
if not exist "node_modules\" (
    echo Installing dependencies (this only takes a moment)...
    call npm install
)

echo.
echo [2/2] Launching Express server and opening Web Studio...
echo Studio URL: http://localhost:5000
echo.

REM Automatically open browser to the web studio
start http://localhost:5000

REM Start Express backend with Single Shared History engine
node server/server.js

pause
