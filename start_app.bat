@echo off
echo ========================================================
echo   Launching Multi-Coding Agents MERN Studio
echo   (Bound Multi-Agents with Single Shared History)
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Node modules...
if not exist "node_modules\" (
    echo Installing root dependencies...
    call npm install
)

if not exist "client\node_modules\" (
    echo Installing React client dependencies...
    cd client
    call npm install
    cd ..
)

echo.
echo [2/3] Starting Express & MongoDB API Server on port 5000...
start "Multi-Agent Backend" cmd /k "node server/server.js"

echo.
echo [3/3] Starting Vite React Client on port 3000...
cd client
start "Multi-Agent Frontend" cmd /k "npm run dev"

echo.
echo ========================================================
echo   Studio launched successfully!
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:5000
echo ========================================================
pause
