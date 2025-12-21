@echo off
title Mini Library System Launcher
setlocal

echo ===================================================
echo      Starting Mini Library System...
echo ===================================================

rem Resolve script directory
set "SCRIPT_DIR=%~dp0"
set "PORT=3000"

echo Ensuring local MongoDB data directory exists...
if not exist "%SCRIPT_DIR%data\db" (
	mkdir "%SCRIPT_DIR%data\db"
)

REM Check if mongod is available
where mongod >nul 2>&1
if %errorlevel% equ 0 (
	echo Starting MongoDB...
	start "MongoDB Server" cmd /k "cd /d "%SCRIPT_DIR%" && mongod --dbpath "%SCRIPT_DIR%data\db" --bind_ip 127.0.0.1"
	echo Waiting for Database to initialize...
	timeout /t 5 /nobreak >nul
) else (
	echo WARNING: MongoDB not found in PATH. Ensure MongoDB is installed and added to PATH.
	echo Continuing without MongoDB...
)

echo Starting Node.js Server (in new window)...
start "Library Backend" cmd /k "cd /d "%SCRIPT_DIR%" && set PORT=%PORT% && node server.js"

echo Waiting for server to start...
timeout /t 2 /nobreak >nul

echo Opening Application in Browser...
start "" "http://localhost:%PORT%"

echo ===================================================
echo      System is running!
echo      Close the 'MongoDB Server' and 'Library Backend' windows to stop the services.
echo ===================================================
echo
echo Notes:
echo - If "mongodb" is not recognized, ensure MongoDB is installed and its \bin folder is in PATH.
echo - To use a custom port or remote MongoDB, set the environment variable MONGODB_URI or PORT before running this script.
pause