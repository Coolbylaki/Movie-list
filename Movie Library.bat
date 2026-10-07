@echo off
cd /d C:\Projects\movie-library
start "" cmd /k "npm run dev"
timeout /t 2 >nul
start "" http://localhost:5173