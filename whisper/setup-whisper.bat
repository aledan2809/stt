@echo off
title Whisper Local - Setup
echo ============================================
echo   Faster-Whisper Local Setup
echo ============================================
echo.

cd /d "%~dp0"

:: Check Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Install Python 3.10+ from https://python.org
    pause
    exit /b 1
)

:: Check Python version
python -c "import sys; assert sys.version_info >= (3, 10), f'Python 3.10+ required, got {sys.version}'" 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python 3.10+ is required.
    python --version
    pause
    exit /b 1
)

:: Create virtual environment
if not exist "venv" (
    echo [SETUP] Creating virtual environment...
    python -m venv venv
    echo.
)

:: Activate and install
echo [SETUP] Installing faster-whisper...
call venv\Scripts\activate.bat
pip install faster-whisper --quiet

echo.
echo ============================================
echo   Setup complete!
echo.
echo   To start the whisper server, run:
echo     start-whisper.bat
echo.
echo   Or with GPU (CUDA):
echo     start-whisper.bat --device cuda --compute-type float16
echo ============================================
pause
