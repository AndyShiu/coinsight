@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

:: ============================================================
::  CoinSight 幣析 — Windows 關閉腳本
:: ============================================================

echo.
echo ========================================
echo   CoinSight 幣析 — 關閉
echo ========================================
echo.

:: 關閉後端 (port 8000)
set "FOUND_BACKEND=0"
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr ":8000.*LISTENING"') do (
    if %%p neq 0 (
        taskkill /F /PID %%p >nul 2>&1
        set "FOUND_BACKEND=1"
    )
)
if !FOUND_BACKEND!==1 (
    echo [OK]    後端已關閉 (port 8000)
) else (
    echo [INFO]  後端未在執行
)

:: 關閉前端 (port 3000)
set "FOUND_FRONTEND=0"
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr ":3000.*LISTENING"') do (
    if %%p neq 0 (
        taskkill /F /PID %%p >nul 2>&1
        set "FOUND_FRONTEND=1"
    )
)
if !FOUND_FRONTEND!==1 (
    echo [OK]    前端已關閉 (port 3000)
) else (
    echo [INFO]  前端未在執行
)

echo.
echo ========================================
echo [OK]    所有服務已關閉
echo ========================================
echo.

pause
