@echo off
REM SUVIDHA ONE Kiosk Deployment Script for Windows
REM Builds and launches the kiosk application

echo ==================================
echo 🇮🇳 SUVIDHA ONE - Kiosk Deployment
echo ==================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo Error: Please run this script from the frontend directory
    pause
    exit /b 1
)

REM Install dependencies
echo Installing dependencies...
call npm install --legacy-peer-deps
if errorlevel 1 (
    call yarn install
    if errorlevel 1 (
        echo Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Build the application
echo.
echo Building application...
call npm run build
if errorlevel 1 (
    call yarn build
    if errorlevel 1 (
        echo Build failed
        pause
        exit /b 1
    )
)

echo.
echo ==================================
echo ✓ Build complete!
echo ==================================
echo.
echo Starting kiosk mode in 5 seconds...
echo Press Ctrl+C to cancel
timeout /t 5 /nobreak

REM Get the absolute path to the output folder
set OUTPUT_DIR=%CD%\out

REM Launch Chrome in kiosk mode
echo.
echo 🚀 Launching Kiosk Mode...
start chrome.exe --kiosk --disable-infobars --start-fullscreen --app=file:///%OUTPUT_DIR:\=/%/index.html

echo.
echo Kiosk launched successfully!
echo Press any key to stop the development server...
pause > nul
