@echo off
title Mini Library System Launcher

echo ===================================================
echo      Starting Mini Library System...
echo ===================================================

:: 1. Start MongoDB in a new window
echo Starting MongoDB...
start "MongoDB Server" mongod

:: 2. Wait 5 seconds to let the database initialize
echo Waiting for Database to initialize...
timeout /t 5 /nobreak >nul

:: 3. Start the Node.js Server in a new window
echo Starting Node.js Server...
start "Library Backend" node server.js

:: 4. Wait 2 seconds for the server to lift
timeout /t 2 /nobreak >nul

:: 5. Open the specific URL in the default browser
echo Opening Application in Browser...
start http://localhost:3000

echo ===================================================
echo      System is running!
echo      Close the pop-up windows to stop the server.
echo ===================================================
pause