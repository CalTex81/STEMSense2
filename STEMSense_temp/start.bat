@echo off
setlocal enabledelayedexpansion

echo.
echo ============================================
echo   STEMSense Startup
echo ============================================
echo.

REM Check if venv exists
if not exist ".\.venv" (
    echo Error: Virtual environment not found. Run "python -m venv .venv" first.
    pause
    exit /b 1
)

echo Activating Python virtual environment...
call .\.venv\Scripts\activate.bat

echo Starting backend server...
start "STEMSense Backend" python backend/server.py

echo Waiting for server to start...
timeout /t 3 /nobreak

echo Starting frontend dev server...
npm run dev -- --open

echo.
echo ============================================
echo   STEMSense is running!
echo ============================================
