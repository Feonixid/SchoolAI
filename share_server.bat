@echo off
echo Starting Zrok Share...
echo ===================================
echo This will share your local server (localhost:3001) to the public internet.
echo Keep this window OPEN.
echo.

cd /d "%~dp0"

:: Check if zrok is available (simple check)
where zrok >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: 'zrok' command not found.
    echo Please ensure Zrok is installed and added to your PATH.
    echo.
)

:: Run the share command
zrok share public localhost:3001

:: Pause if it exits
echo.
echo Zrok process stopped.
pause
