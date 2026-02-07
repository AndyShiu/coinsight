#!/usr/bin/env bash
# ============================================================
#  CoinSight 幣析 — Mac / Linux 一鍵啟動腳本
# ============================================================
set -e

# --- 顏色 ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

ok()   { echo -e "${GREEN}[OK]${NC}    $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; }
info() { echo -e "${CYAN}[INFO]${NC}  $1"; }

ask_yes_no() {
  read -rp "$(echo -e "${YELLOW}$1 [Y/n] ${NC}")" answer
  case "$answer" in
    [nN]*) return 1 ;;
    *) return 0 ;;
  esac
}

# --- 專案根目錄 ---
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo -e "${BOLD}========================================${NC}"
echo -e "${BOLD}  CoinSight 幣析 — 啟動${NC}"
echo -e "${BOLD}========================================${NC}"
echo ""

# ============================================================
#  1. 環境檢查
# ============================================================
info "檢查環境..."

# Python
PYTHON_CMD=""
if command -v python3 &>/dev/null; then
  PYTHON_CMD="python3"
elif command -v python &>/dev/null; then
  PYTHON_CMD="python"
fi

if [ -z "$PYTHON_CMD" ]; then
  err "未偵測到 Python"
  echo "    請安裝 Python 3.9+："
  echo "      macOS:  brew install python3"
  echo "      Linux:  sudo apt install python3 python3-venv"
  echo "      官網:   https://www.python.org/downloads/"
  exit 1
fi

PY_VERSION=$($PYTHON_CMD --version 2>&1 | grep -oE '[0-9]+\.[0-9]+' | head -1)
PY_MAJOR=$(echo "$PY_VERSION" | cut -d. -f1)
PY_MINOR=$(echo "$PY_VERSION" | cut -d. -f2)

if [ "$PY_MAJOR" -lt 3 ] || { [ "$PY_MAJOR" -eq 3 ] && [ "$PY_MINOR" -lt 9 ]; }; then
  err "Python 版本 $PY_VERSION 太低，需要 3.9+"
  exit 1
fi
ok "Python $PY_VERSION"

# Node.js
if ! command -v node &>/dev/null; then
  err "未偵測到 Node.js"
  echo "    請安裝 Node.js 18+："
  echo "      macOS:  brew install node"
  echo "      nvm:    nvm install 18"
  echo "      官網:   https://nodejs.org/"
  exit 1
fi

NODE_VERSION=$(node --version | grep -oE '[0-9]+' | head -1)
if [ "$NODE_VERSION" -lt 18 ]; then
  err "Node.js 版本 v$(node --version) 太低，需要 18+"
  exit 1
fi
ok "Node.js $(node --version)"

# npm
if ! command -v npm &>/dev/null; then
  err "未偵測到 npm，請重新安裝 Node.js"
  exit 1
fi
ok "npm $(npm --version)"

echo ""

# ============================================================
#  2. 後端設定
# ============================================================
info "檢查後端環境..."

# 虛擬環境
if [ ! -d "backend/.venv" ]; then
  warn "未找到虛擬環境 backend/.venv"
  if ask_yes_no "是否自動建立虛擬環境？"; then
    info "建立虛擬環境中..."
    $PYTHON_CMD -m venv backend/.venv
    ok "虛擬環境已建立"
  else
    err "需要虛擬環境才能啟動後端，請手動建立: $PYTHON_CMD -m venv backend/.venv"
    exit 1
  fi
else
  ok "虛擬環境已存在"
fi

# 啟動 venv
source backend/.venv/bin/activate

# 檢查依賴
if ! pip show fastapi &>/dev/null; then
  warn "後端依賴尚未安裝"
  if ask_yes_no "是否自動安裝後端依賴？"; then
    info "安裝後端依賴中 (pip install -e \".[dev]\")..."
    cd backend
    pip install -e ".[dev]" --quiet
    cd "$SCRIPT_DIR"
    ok "後端依賴已安裝"
  else
    err "需要安裝依賴才能啟動，請手動執行: cd backend && pip install -e \".[dev]\""
    exit 1
  fi
else
  ok "後端依賴已安裝"
fi

# .env
if [ ! -f "backend/.env" ] && [ -f "backend/.env.example" ]; then
  cp backend/.env.example backend/.env
  info "已從 .env.example 複製 backend/.env（可自行編輯填入 API key）"
fi

echo ""

# ============================================================
#  3. 前端設定
# ============================================================
info "檢查前端環境..."

if [ ! -d "frontend/node_modules" ]; then
  warn "前端依賴尚未安裝"
  if ask_yes_no "是否自動安裝前端依賴？"; then
    info "安裝前端依賴中 (npm install)..."
    cd frontend
    npm install --silent
    cd "$SCRIPT_DIR"
    ok "前端依賴已安裝"
  else
    err "需要安裝依賴才能啟動，請手動執行: cd frontend && npm install"
    exit 1
  fi
else
  ok "前端依賴已安裝"
fi

echo ""

# ============================================================
#  4. 啟動服務
# ============================================================

# 先關閉已存在的服務
if lsof -ti :8000 &>/dev/null; then
  warn "Port 8000 已被佔用，正在關閉..."
  lsof -ti :8000 | xargs kill 2>/dev/null || true
  sleep 1
fi

if lsof -ti :3000 &>/dev/null; then
  warn "Port 3000 已被佔用，正在關閉..."
  lsof -ti :3000 | xargs kill 2>/dev/null || true
  sleep 1
fi

info "啟動後端 (port 8000)..."
cd backend
source .venv/bin/activate 2>/dev/null
uvicorn app.main:app --reload --port 8000 > /dev/null 2>&1 &
BACKEND_PID=$!
cd "$SCRIPT_DIR"

info "啟動前端 (port 3000)..."
cd frontend
npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!
cd "$SCRIPT_DIR"

# 儲存 PID
echo "$BACKEND_PID" > .pids
echo "$FRONTEND_PID" >> .pids

# 等待啟動
sleep 3

echo ""
echo -e "${BOLD}========================================${NC}"

# 驗證
BACKEND_OK=false
FRONTEND_OK=false

if kill -0 $BACKEND_PID 2>/dev/null; then
  BACKEND_OK=true
  ok "後端已啟動: ${CYAN}http://localhost:8000${NC}"
  ok "API 文件:    ${CYAN}http://localhost:8000/docs${NC}"
else
  err "後端啟動失敗，請檢查 log"
fi

if kill -0 $FRONTEND_PID 2>/dev/null; then
  FRONTEND_OK=true
  ok "前端已啟動: ${CYAN}http://localhost:3000${NC}"
else
  err "前端啟動失敗，請檢查 log"
fi

echo -e "${BOLD}========================================${NC}"

if $BACKEND_OK && $FRONTEND_OK; then
  echo ""
  info "關閉服務請執行: ${BOLD}./stop.sh${NC}"
  echo ""
else
  echo ""
  warn "部分服務未成功啟動，請檢查錯誤訊息"
  echo ""
  exit 1
fi
