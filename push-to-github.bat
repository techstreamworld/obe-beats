@echo off
setlocal EnableDelayedExpansion

:: Ensure we are in the project root directory
cd /d "%~dp0"

echo ========================================================
echo               OBE Beats - GitHub Push
echo ========================================================
echo.

:: Check if git is available
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Git command not found. Please install Git for Windows.
    goto :end
)

:: Show current repository status
echo Current Git Status:
git status --short
echo.

:: Prompt for commit message
set "COMMIT_MSG="
set /p "COMMIT_MSG=Enter commit message (or press Enter for default): "

if "!COMMIT_MSG!"=="" (
    set "COMMIT_MSG=Update OBE Beats - %DATE% %TIME%"
)

echo.
echo Staging all changes...
git add .

echo.
echo Committing changes...
git commit -m "!COMMIT_MSG!"

echo.
echo Pushing to GitHub (origin main)...
git push origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo  [SUCCESS] All files successfully pushed to GitHub!
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo  [NOTICE] Push finished with exit code %ERRORLEVEL%.
    echo  If this is your first push, please complete GitHub
    echo  browser login in the window that opened.
    echo ========================================================
)

:end
echo.
pause
