#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# PRODUCTION MODE (Detected if running on the Raspberry Pi)
# ==============================================================================
if [ -d "/var/www/egcrm" ]; then
    echo "?? Detected Production Environment (/var/www/egcrm)."
    echo "Starting background services..."
    
    # 1. Ensure MariaDB (Database) is running
    sudo systemctl start mariadb || true
    
    # 2. Start PM2 background processes (Frontend & Backend)
    cd "/var/www/egcrm"
    pm2 start ecosystem.config.js || pm2 restart all
    
    # 3. Ensure Nginx reverse proxy is running
    sudo systemctl start nginx || true
    
    echo ""
    echo "? All Production Servers are officially RUNNING!"
    echo "?? Website URL: http://$(hostname -I | awk '{print $1}')"
    echo ""
    pm2 status
    exit 0
fi

# ==============================================================================
# LOCAL DEVELOPMENT MODE (Windows / WSL / Mac)
# ==============================================================================
# Detect absolute directory of this script to avoid path errors
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

MYSQLD_BIN="/usr/sbin/mysqld"
MYSQL_DATADIR="$DIR/backend/mysql_data"
BACKEND_DIR="$DIR/backend"
BACKEND_MODULE="main:app"
BACKEND_PORT=8000
FRONTEND_DIR="$DIR/frontend"
FRONTEND_DEV_CMD="npm run dev"
FRONTEND_PORT=3000

echo "Starting MySQL Database Server..."
"$MYSQLD_BIN" --datadir="$MYSQL_DATADIR" >/tmp/mysql.log 2>&1 &
MYSQL_PID=$!

echo "Waiting for MySQL to initialize..."
sleep 5

echo "Starting Backend Server..."
(
  cd "$BACKEND_DIR"
  source "$BACKEND_DIR/venv/bin/activate" 2>/dev/null || source "$BACKEND_DIR/venv/Scripts/activate" 2>/dev/null
  uvicorn "$BACKEND_MODULE" --reload --port "$BACKEND_PORT"
) >/tmp/backend.log 2>&1 &
BACKEND_PID=$!

echo "Starting Frontend Server..."
(
  cd "$FRONTEND_DIR"
  $FRONTEND_DEV_CMD
) >/tmp/frontend.log 2>&1 &
FRONTEND_PID=$!

echo "All development servers are starting up!"
echo "- Backend:  http://localhost:${BACKEND_PORT}"
echo "- Frontend: http://localhost:${FRONTEND_PORT}"
echo "- MySQL is running in the background."

cleanup() {
  echo
  echo "Stopping servers..."
  kill "$FRONTEND_PID" 2>/dev/null || true
  kill "$BACKEND_PID" 2>/dev/null || true
  kill "$MYSQL_PID" 2>/dev/null || true
  wait "$FRONTEND_PID" "$BACKEND_PID" "$MYSQL_PID" 2>/dev/null || true
  echo "Done."
}

trap cleanup INT TERM
wait
