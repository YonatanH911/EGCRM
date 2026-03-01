#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# PRODUCTION MODE (Detected if running on the Raspberry Pi)
# ==============================================================================
if [ -d "/var/www/egcrm" ]; then
    echo "🌍 Detected Production Environment (/var/www/egcrm)."
    echo "Starting background services..."
    
    # 1. Ensure MariaDB (Database) is running
    sudo systemctl start mariadb || true
    
    # 2. Start PM2 background processes (Frontend & Backend)
    cd "/var/www/egcrm"
    pm2 start ecosystem.config.js --force
    pm2 save
    
    # 3. Ensure Nginx reverse proxy is running
    sudo systemctl start nginx || true
    
    echo ""
    echo "🚀 All Production Servers are officially RUNNING!"
    echo "👉 Website URL: http://$(hostname -I | awk '{print $1}')"
    echo ""
    pm2 status
    exit 0
fi

# ==============================================================================
# LOCAL DEVELOPMENT MODE (Windows / WSL / Mac / Linux)
# ==============================================================================
# Detect absolute directory of this script to avoid path errors
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

BACKEND_DIR="$DIR/backend"
BACKEND_MODULE="main:app"
BACKEND_PORT=8000
FRONTEND_DIR="$DIR/frontend"
FRONTEND_DEV_CMD="npm run dev"
FRONTEND_PORT=3000

echo "🔍 Launching in Local Development Mode..."

# 1. Database Check (Linux / WSL)
MYSQL_PID=""
if command -v systemctl &> /dev/null && systemctl is-active --quiet mysql; then
    echo "✅ System MySQL/MariaDB service is already running."
elif command -v systemctl &> /dev/null && systemctl is-active --quiet mariadb; then
    echo "✅ System MySQL/MariaDB service is already running."
else
    # Fallback to local mysqld for Windows Git Bash / Custom setups
    MYSQLD_BIN="/usr/sbin/mysqld"
    MYSQL_DATADIR="$DIR/backend/mysql_data"
    
    if [ -x "$MYSQLD_BIN" ]; then
        echo "Starting local MySQL Database Server ($MYSQLD_BIN)..."
        "$MYSQLD_BIN" --datadir="$MYSQL_DATADIR" >/tmp/mysql.log 2>&1 &
        MYSQL_PID=$!
        echo "Waiting for MySQL to initialize..."
        sleep 5
    else
        echo "⚠️ WARNING: Could not find system MySQL service or local mysqld at $MYSQLD_BIN."
        echo "Ensure your database is running manually if the backend fails to connect."
    fi
fi

# 2. Start Backend Server
echo "Starting Backend Server..."
(
  cd "$BACKEND_DIR"
  if [ -f "$BACKEND_DIR/venv/bin/activate" ]; then
      source "$BACKEND_DIR/venv/bin/activate"
  elif [ -f "$BACKEND_DIR/venv/Scripts/activate" ]; then
      source "$BACKEND_DIR/venv/Scripts/activate"
  else
      echo "⚠️ WARNING: Could not find Python virtual environment! Attempting to run without it."
  fi
  
  if command -v uvicorn &> /dev/null; then
      uvicorn "$BACKEND_MODULE" --reload --port "$BACKEND_PORT"
  else
      python -m uvicorn "$BACKEND_MODULE" --reload --port "$BACKEND_PORT"
  fi
) > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

# 3. Start Frontend Server
echo "Starting Frontend Server..."
(
  cd "$FRONTEND_DIR"
  if ! command -v npm &> /dev/null; then
      echo "❌ ERROR: 'npm' is not installed or not in PATH."
      exit 1
  fi
  $FRONTEND_DEV_CMD
) > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!

echo ""
echo "🔥 All development servers are starting up!"
echo "- Backend logs: run 'cat /tmp/backend.log'"
echo "- Frontend logs: run 'cat /tmp/frontend.log'"
echo ""
echo "🌐 Backend API:  http://localhost:${BACKEND_PORT}"
echo "🌐 Frontend App: http://localhost:${FRONTEND_PORT}"
echo "Press Ctrl+C to stop all servers."

cleanup() {
  echo
  echo "🛑 Stopping servers..."
  kill "$FRONTEND_PID" 2>/dev/null || true
  kill "$BACKEND_PID" 2>/dev/null || true
  if [ -n "$MYSQL_PID" ]; then
      kill "$MYSQL_PID" 2>/dev/null || true
  fi
  wait "$FRONTEND_PID" "$BACKEND_PID" 2>/dev/null || true
  echo "✅ Done."
}

trap cleanup INT TERM
wait
