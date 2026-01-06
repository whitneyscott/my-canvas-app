@echo off
REM Batch script to safely start NestJS dev server
REM This script kills any process using port 3000 before starting the server

echo Checking for processes using port 3000...

REM Find the PID of the process using port 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Found process %%a using port 3000. Terminating...
    taskkill /PID %%a /F >nul 2>&1
)

REM Wait a moment for the port to be released
timeout /t 2 /nobreak >nul

echo Starting NestJS development server...
call npm run start:dev






















