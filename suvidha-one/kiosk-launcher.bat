@echo off
REM SUVIDHA ONE Kiosk Launcher for Windows
REM Place this file in the Windows Startup folder for auto-launch on boot

REM Wait for system to be ready
timeout /t 10 /nobreak

REM Kill any existing Chrome processes
taskkill /F /IM chrome.exe 2>nul

REM Wait a moment
timeout /t 2 /nobreak

REM Set the path to your built application
set KIOSK_URL=file:///%CD%\out\index.html

REM Launch Chrome in kiosk mode
start chrome.exe ^
    --kiosk ^
    --disable-infobars ^
    --start-fullscreen ^
    --app=%KIOSK_URL% ^
    --disable-pinch ^
    --disable-new-tab-first-run ^
    --no-first-run ^
    --disable-component-update ^
    --disable-background-networking ^
    --disable-default-apps ^
    --disable-extensions ^
    --disable-sync ^
    --translate-ui-parameters ^
    --renderer ^
    --disable-gesture-requirement-for-presentation ^
    --autoplay-policy=no-user-gesture-required ^
    --user-data-dir=%CD%\chrome-profile

REM Log the launch
echo %DATE% %TIME% - Kiosk launched >> kiosk-log.txt

exit
