@echo off
title House Blend POS - Starting...
color 0A

echo.
echo  ================================
echo    ☕ House Blend POS Starting...
echo  ================================
echo.
echo  Starting React app...
echo.

:: Go to the project folder
cd /d "C:\Users\ADMIN\Desktop\full ordering web\pos.jsx"

:: Open Chrome after 4 seconds
start "" timeout /t 4 /nobreak >nul
start "" "chrome.exe" "http://localhost:5177"

:: Start the dev server (this stays open)
echo  ✅ React app is starting!
echo  👉 App URL: http://localhost:5177
echo.
echo  ================================
echo   DO NOT CLOSE THIS WINDOW!
echo   Closing this stops the server.
echo  ================================
echo.

npm run dev

pause