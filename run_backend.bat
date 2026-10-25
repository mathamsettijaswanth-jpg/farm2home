@echo off
echo ========================================================
echo Starting Farm2Home Backend API Server (FastAPI + Uvicorn)
echo ========================================================
cd /d "%~dp0backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
