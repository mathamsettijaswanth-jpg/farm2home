@echo off
echo ========================================================
echo Starting Farm2Home Frontend Application (React + Vite)
echo ========================================================
set "PATH=C:\Users\JASWANTH\AppData\Local\Programs\nodejs;%PATH%"
cd /d "%~dp0frontend"
npm run dev
pause
