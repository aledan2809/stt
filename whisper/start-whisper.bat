@echo off
title Whisper Local Server
echo ============================================
echo   Faster-Whisper Local Server
echo ============================================
echo.

cd /d "%~dp0"

if not exist "venv" (
    echo [ERROR] Virtual environment not found. Run setup-whisper.bat first.
    pause
    exit /b 1
)

call venv\Scripts\activate.bat

echo [OK] Starting Whisper server on port 8787...
echo     Model: small (change with --model medium/large-v3)
echo     Press Ctrl+C to stop
echo ============================================
echo.

python transcribe_server.py %*
