@echo off
echo ================================================
echo Run Backend - Student Attendance System
echo ================================================
echo.

cd backend

if not exist ".venv" (
    echo [ERROR] Virtual environment belum dibuat!
    echo Jalankan setup-backend.bat terlebih dahulu.
    pause
    exit /b 1
)

echo Mengaktifkan virtual environment...
call .venv\Scripts\activate.bat

echo.
echo Starting backend server...
echo Backend: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
