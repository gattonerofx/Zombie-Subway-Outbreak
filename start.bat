@echo off
REM ============================================================
REM  ZOMBIE: TOKYO SUBWAY OUTBREAK — One-Click Launcher (Windows)
REM ============================================================
REM  Usage:  double-click start.bat  (or run from terminal)
REM
REM  Prerequisites:
REM    - Node.js 18+ (https://nodejs.org)
REM    - Your zombie 3D model placed at:  public\models\zombie.glb
REM ============================================================

cd /d "%~dp0"

echo.
echo   ZOMBIE: TOKYO SUBWAY OUTBREAK
echo   ---------------------------------
echo.

REM Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo   [ERROR] Node.js not found. Install it from https://nodejs.org
  pause
  exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do echo   [OK] Node.js %%i

REM Check zombie model
if not exist "public\models\zombie.glb" (
  echo.
  echo   [WARNING] Zombie model not found at: public\models\zombie.glb
  echo             Copy your zombie.glb file there, then re-run this script.
  echo.
  pause
  exit /b 1
)
echo   [OK] Zombie model found

REM Install dependencies
if not exist "node_modules" (
  echo.
  echo   Installing dependencies...
  call npm install
  echo   [OK] Dependencies installed
) else (
  echo   [OK] Dependencies up to date
)

echo.
echo   Starting game server...
echo   Open http://localhost:3000 in your browser
echo   Press Ctrl+C to stop
echo.

call npx next dev --turbopack
