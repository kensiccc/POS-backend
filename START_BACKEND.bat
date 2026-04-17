@echo off
title House Blend POS - Backend
color 0A

echo.
echo  ================================
echo    ☕ House Blend POS Backend
echo  ================================
echo.
echo  Starting backend server...
echo.

cd /d "%~dp0"

echo  ✅ Backend is starting!
echo  👉 API URL: http://localhost:3000
echo.
echo  ================================
echo   DO NOT CLOSE THIS WINDOW!
echo   Closing this stops the server.
echo  ================================
echo.

node server.js

pause
