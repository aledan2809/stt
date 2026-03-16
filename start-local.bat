@echo off
title STT - Speech to Text (Local)
echo ============================================
echo   STT - Speech to Text Module
echo   Starting local development server...
echo ============================================
echo.

cd /d "D:\Projects\STT"

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)

:: Install dependencies if needed
if not exist "node_modules" (
    echo [SETUP] Installing dependencies...
    call npm install
    echo.
)

:: Generate Prisma client if needed
if not exist "node_modules\.prisma\client" (
    echo [SETUP] Generating Prisma client...
    call npx prisma generate
    echo.
)

:: Push database schema if DB doesn't exist
if not exist "data\stt.db" (
    echo [SETUP] Creating database...
    call npx prisma db push
    echo.
)

:: Auto-start Whisper local server if setup exists
if exist "whisper\venv" (
    echo [WHISPER] Starting local Whisper server on port 8787...
    start "Whisper Server" cmd /c "cd /d "%~dp0whisper" && call venv\Scripts\activate.bat && python transcribe_server.py"
    echo [WHISPER] Server starting in background
    echo.
)

echo [OK] Starting on http://localhost:7101
echo.
echo Press Ctrl+C to stop the server.
echo ============================================
echo.

:: Open browser after a short delay
start "" cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:7101"

call npx next dev -p 7101
