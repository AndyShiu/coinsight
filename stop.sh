#!/usr/bin/env bash
# ============================================================
#  CoinSight 幣析 — Mac / Linux 關閉腳本
# ============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

ok()   { echo -e "${GREEN}[OK]${NC}    $1"; }
info() { echo -e "${CYAN}[INFO]${NC}  $1"; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo -e "${BOLD}========================================${NC}"
echo -e "${BOLD}  CoinSight 幣析 — 關閉${NC}"
echo -e "${BOLD}========================================${NC}"
echo ""

# 關閉後端 (port 8000)
BACKEND_PIDS=$(lsof -ti :8000 2>/dev/null || true)
if [ -n "$BACKEND_PIDS" ]; then
  echo "$BACKEND_PIDS" | xargs kill 2>/dev/null || true
  ok "後端已關閉 (port 8000)"
else
  info "後端未在執行"
fi

# 關閉前端 (port 3000)
FRONTEND_PIDS=$(lsof -ti :3000 2>/dev/null || true)
if [ -n "$FRONTEND_PIDS" ]; then
  echo "$FRONTEND_PIDS" | xargs kill 2>/dev/null || true
  ok "前端已關閉 (port 3000)"
else
  info "前端未在執行"
fi

# 清理 PID 檔
rm -f .pids

echo ""
echo -e "${BOLD}========================================${NC}"
ok "所有服務已關閉"
echo -e "${BOLD}========================================${NC}"
echo ""
