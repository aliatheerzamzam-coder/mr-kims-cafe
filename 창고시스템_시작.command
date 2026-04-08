#!/bin/bash
cd "$(dirname "$0")"
echo "=============================="
echo " Mr. Kim's Cafe 창고 시스템"
echo "=============================="
echo ""
echo "서버 시작 중..."
echo ""

# Node.js 20 LTS 사용 (better-sqlite3 호환)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
nvm use 20 2>/dev/null || true

node server.js
