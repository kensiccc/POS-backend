@echo off
title House Blend POS - Full Startup
color 0A

echo.
echo  =========================================
echo    ☕ House Blend POS - Backend + Frontend
echo  =========================================
echo.
cd /d "%~dp0"

start "House Blend POS Backend" cmd /k "cd /d \"%~dp0\" && node server.js"
start "House Blend POS Frontend" cmd /k "cd /d \"%~dp0\pos.jsx\" && npm run dev"

echo  ✅ Backend and frontend are starting.
echo  Give Vite a few seconds to launch, then use the browser window.
echo.
echo  =========================================
echo   DO NOT CLOSE THE SERVER WINDOWS!
echo  =========================================
echo.
timeout /t 4 /nobreak >nul
start "" "chrome.exe" "http://localhost:5177"

pause
