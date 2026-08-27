@echo off
echo Starting EduAI Server...
echo ===================================
cd /d "%~dp0"

:: Check if node is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b
)

:: Run the server
node server.js

:: If server crashes/exits, pause so user can see error
echo.
echo Server stopped.
pause
