@echo off
echo ================================================
echo Setup Backend - Student Attendance System
echo ================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python tidak terinstall!
    echo Silakan install Python 3.11+ dari https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [1/5] Masuk ke directory backend...
cd backend

echo [2/5] Membuat virtual environment...
python -m venv .venv

echo [3/5] Mengaktifkan virtual environment...
call .venv\Scripts\activate.bat

echo [4/5] Install dependencies...
pip install -r requirements.txt

echo [5/5] Initialize database...
python init_db.py

echo.
echo ================================================
echo Setup backend selesai!
echo ================================================
echo.
echo Untuk menjalankan backend:
echo   1. cd backend
echo   2. .venv\Scripts\activate.bat
echo   3. uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
echo.
echo Backend akan berjalan di: http://localhost:8000
echo.
pause
