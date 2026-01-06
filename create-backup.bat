@echo off
setlocal enabledelayedexpansion

REM Create timestamped backup
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set timestamp=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%_%datetime:~8,2%-%datetime:~10,2%-%datetime:~12,2%
set backupDir=backup-%timestamp%

echo Creating backup: %backupDir%

REM Create backup directory
if not exist "%backupDir%" mkdir "%backupDir%"

REM Copy files, excluding node_modules, dist, and existing backups
echo Copying files...

REM Copy root level files
for %%F in (*) do (
    set "skip=0"
    if /i "%%F"=="node_modules" set "skip=1"
    if /i "%%F"=="dist" set "skip=1"
    if "%%F"=="create-backup.bat" set "skip=1"
    if "%%F"=="create-backup.ps1" set "skip=1"
    echo %%F | findstr /r "^backup-.*" >nul && set "skip=1"
    echo %%F | findstr /r "^FULL-BACKUP-.*" >nul && set "skip=1"
    if "!skip!"=="0" (
        echo   Copying %%F...
        xcopy /E /I /Y "%%F" "%backupDir%\%%F\" >nul 2>&1
        if errorlevel 1 (
            copy /Y "%%F" "%backupDir%\%%F" >nul 2>&1
        )
    )
)

REM Copy directories (excluding node_modules, dist, backups)
for /d %%D in (*) do (
    set "skip=0"
    if /i "%%D"=="node_modules" set "skip=1"
    if /i "%%D"=="dist" set "skip=1"
    echo %%D | findstr /r "^backup-.*" >nul && set "skip=1"
    echo %%D | findstr /r "^FULL-BACKUP-.*" >nul && set "skip=1"
    if "!skip!"=="0" (
        echo   Copying %%D...
        xcopy /E /I /Y "%%D" "%backupDir%\%%D\" >nul 2>&1
    )
)

REM Create backup info file
(
    echo Backup created: %timestamp%
    echo Purpose: Full project backup before quitting for the day
    echo.
    echo Files backed up:
    echo   - All source files ^(src, views, test^)
    echo   - Configuration files ^(package.json, tsconfig.json, etc.^)
    echo   - Documentation files
    echo.
    echo Excluded:
    echo   - node_modules
    echo   - dist
    echo   - Existing backup directories
    echo.
    echo To restore:
    echo 1. Copy files from this backup directory back to project root
    echo 2. Restore any deleted files from this backup
) > "%backupDir%\BACKUP_INFO.txt"

echo.
echo Backup complete: %backupDir%
echo Backup info saved to: %backupDir%\BACKUP_INFO.txt

endlocal













