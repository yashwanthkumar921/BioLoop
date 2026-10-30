@echo off
title BioLoop Frontend UI (Port 5173)
echo ==============================================================
echo              Starting BioLoop Frontend UI
echo ==============================================================
echo App URL: http://localhost:5173
echo API Proxy: http://localhost:8080
echo.

cd /d "%~dp0frontend"

where pnpm >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo Executing: pnpm dev
    pnpm dev
    goto END
)

where npm >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo Executing: npm run dev
    npm run dev
    goto END
)

echo [ERROR] Neither pnpm nor npm was found in PATH.
pause

:END
