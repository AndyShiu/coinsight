@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

:: ============================================================
::  CoinSight 幣析 — Windows 一鍵啟動腳本
:: ============================================================

echo.
echo ========================================
echo   CoinSight 幣析 — 啟動
echo ========================================
echo.

:: --- 專案根目錄 ---
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:: ============================================================
::  0. Git 更新檢查
:: ============================================================
set "NEED_REINSTALL=0"
set "REPO_URL=https://github.com/AndyShiu/coinsight.git"

where git >nul 2>&1
if %errorlevel%==0 (
    echo [INFO]  檢查更新 ^(%REPO_URL%^)...

    if not exist ".git" (
        git init --quiet >nul 2>&1
        git remote add origin "%REPO_URL%" >nul 2>&1
    ) else (
        git remote set-url origin "%REPO_URL%" >nul 2>&1
    )

    git fetch origin --quiet >nul 2>&1

    for /f %%h in ('git rev-parse HEAD 2^>nul') do set "LOCAL_REV=%%h"
    for /f %%h in ('git rev-parse origin/main 2^>nul') do set "REMOTE_REV=%%h"

    if defined REMOTE_REV (
        if not "!LOCAL_REV!"=="!REMOTE_REV!" (
            for /f %%c in ('git rev-list --count HEAD..origin/main 2^>nul') do set "BEHIND=%%c"
            if !BEHIND! GTR 0 (
                echo [WARN]  發現 !BEHIND! 個新的更新
                echo.
                git log --oneline HEAD..origin/main 2>nul
                echo.
                set /p "DO_UPDATE=是否更新至最新版本？ [Y/n] "
                if /i "!DO_UPDATE!"=="n" (
                    echo [INFO]  跳過更新，使用目前版本
                ) else (
                    echo [INFO]  更新中...
                    git pull --ff-only origin main >nul 2>&1
                    if !errorlevel!==0 (
                        echo [OK]    已更新至最新版本
                        set "NEED_REINSTALL=1"
                    ) else (
                        echo [WARN]  自動更新失敗（可能有本地修改），請手動執行: git pull
                    )
                )
            ) else (
                echo [OK]    已是最新版本
            )
        ) else (
            echo [OK]    已是最新版本
        )
    )
    echo.
)

:: ============================================================
::  1. 環境檢查
:: ============================================================
echo [INFO]  檢查環境...

:: Python
set "PYTHON_CMD="
where python >nul 2>&1
if %errorlevel%==0 (
    set "PYTHON_CMD=python"
) else (
    where python3 >nul 2>&1
    if %errorlevel%==0 (
        set "PYTHON_CMD=python3"
    )
)

if "!PYTHON_CMD!"=="" (
    echo [ERROR] 未偵測到 Python
    echo         請安裝 Python 3.9+:
    echo           官網: https://www.python.org/downloads/
    echo         安裝時請勾選 "Add Python to PATH"
    pause
    exit /b 1
)

for /f "tokens=2 delims= " %%v in ('!PYTHON_CMD! --version 2^>^&1') do set "PY_FULL_VER=%%v"
for /f "tokens=1,2 delims=." %%a in ("!PY_FULL_VER!") do (
    set "PY_MAJOR=%%a"
    set "PY_MINOR=%%b"
)

if !PY_MAJOR! LSS 3 (
    echo [ERROR] Python 版本 !PY_FULL_VER! 太低，需要 3.9+
    pause
    exit /b 1
)
if !PY_MAJOR!==3 if !PY_MINOR! LSS 9 (
    echo [ERROR] Python 版本 !PY_FULL_VER! 太低，需要 3.9+
    pause
    exit /b 1
)
echo [OK]    Python !PY_FULL_VER!

:: Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] 未偵測到 Node.js
    echo         請安裝 Node.js 18+:
    echo           官網: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=1 delims=." %%v in ('node --version') do set "NODE_VER=%%v"
set "NODE_VER=!NODE_VER:v=!"
if !NODE_VER! LSS 18 (
    echo [ERROR] Node.js 版本太低，需要 18+
    pause
    exit /b 1
)
for /f %%v in ('node --version') do echo [OK]    Node.js %%v

:: npm
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] 未偵測到 npm，請重新安裝 Node.js
    pause
    exit /b 1
)
for /f %%v in ('npm --version') do echo [OK]    npm %%v

echo.

:: ============================================================
::  2. 後端設定
:: ============================================================
echo [INFO]  檢查後端環境...

:: 虛擬環境
if not exist "backend\.venv" (
    echo [WARN]  未找到虛擬環境 backend\.venv
    set /p "CREATE_VENV=是否自動建立虛擬環境？ [Y/n] "
    if /i "!CREATE_VENV!"=="n" (
        echo [ERROR] 需要虛擬環境，請手動建立: !PYTHON_CMD! -m venv backend\.venv
        pause
        exit /b 1
    )
    echo [INFO]  建立虛擬環境中...
    !PYTHON_CMD! -m venv backend\.venv
    echo [OK]    虛擬環境已建立
) else (
    echo [OK]    虛擬環境已存在
)

:: 啟動 venv
call backend\.venv\Scripts\activate.bat

:: 檢查依賴
set "BACKEND_MISSING=0"
pip show fastapi >nul 2>&1
if %errorlevel% neq 0 set "BACKEND_MISSING=1"

if !BACKEND_MISSING!==1 (
    echo [WARN]  後端依賴尚未安裝
) else if !NEED_REINSTALL!==1 (
    echo [WARN]  偵測到版本更新，建議重新安裝後端依賴
)

if !BACKEND_MISSING!==1 (
    set "DO_INSTALL=Y"
) else if !NEED_REINSTALL!==1 (
    set "DO_INSTALL=Y"
) else (
    set "DO_INSTALL="
)

if defined DO_INSTALL (
    set /p "INSTALL_BACKEND=是否自動安裝後端依賴？ [Y/n] "
    if /i "!INSTALL_BACKEND!"=="n" (
        if !BACKEND_MISSING!==1 (
            echo [ERROR] 需要安裝依賴，請手動執行: cd backend ^&^& pip install -e ".[dev]"
            pause
            exit /b 1
        )
        echo [INFO]  跳過後端依賴更新
    ) else (
        echo [INFO]  安裝後端依賴中...
        cd backend
        pip install -e ".[dev]" --quiet
        cd "%SCRIPT_DIR%"
        echo [OK]    後端依賴已安裝
    )
) else (
    echo [OK]    後端依賴已安裝
)

:: .env
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        copy "backend\.env.example" "backend\.env" >nul
        echo [INFO]  已從 .env.example 複製 backend\.env
    )
)

echo.

:: ============================================================
::  3. 前端設定
:: ============================================================
echo [INFO]  檢查前端環境...

set "FRONTEND_MISSING=0"
if not exist "frontend\node_modules" set "FRONTEND_MISSING=1"

if !FRONTEND_MISSING!==1 (
    echo [WARN]  前端依賴尚未安裝
) else if !NEED_REINSTALL!==1 (
    echo [WARN]  偵測到版本更新，建議重新安裝前端依賴
)

if !FRONTEND_MISSING!==1 (
    set "DO_FE_INSTALL=Y"
) else if !NEED_REINSTALL!==1 (
    set "DO_FE_INSTALL=Y"
) else (
    set "DO_FE_INSTALL="
)

if defined DO_FE_INSTALL (
    set /p "INSTALL_FRONTEND=是否自動安裝前端依賴？ [Y/n] "
    if /i "!INSTALL_FRONTEND!"=="n" (
        if !FRONTEND_MISSING!==1 (
            echo [ERROR] 需要安裝依賴，請手動執行: cd frontend ^&^& npm install
            pause
            exit /b 1
        )
        echo [INFO]  跳過前端依賴更新
    ) else (
        echo [INFO]  安裝前端依賴中...
        cd frontend
        npm install --silent
        cd "%SCRIPT_DIR%"
        echo [OK]    前端依賴已安裝
    )
) else (
    echo [OK]    前端依賴已安裝
)

echo.

:: ============================================================
::  4. 啟動服務
:: ============================================================

echo [INFO]  啟動後端 (port 8000)...
cd backend
call .venv\Scripts\activate.bat
start "" /b cmd /c "uvicorn app.main:app --reload --port 8000 >nul 2>&1"
cd "%SCRIPT_DIR%"

echo [INFO]  啟動前端 (port 3000)...
cd frontend
start "" /b cmd /c "npm run dev >nul 2>&1"
cd "%SCRIPT_DIR%"

:: 等待啟動
echo [INFO]  等待服務啟動...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo [OK]    後端已啟動: http://localhost:8000
echo [OK]    API 文件:    http://localhost:8000/docs
echo [OK]    前端已啟動: http://localhost:3000
echo ========================================
echo.
echo [INFO]  關閉服務請執行: stop.bat
echo.

pause
