#!/usr/bin/env bash
set -euo pipefail

# ---- CONFIG (edit these) ----
MYSQLD_BIN="/usr/sbin/mysqld"          # or: /usr/bin/mysqld, or mysqld if in PATH
MYSQL_DATADIR="$HOME/projects/CRM_Dynamics/backend/mysql_data"

BACKEND_DIR="$HOME/projects/CRM_Dynamics/backend"
BACKEND_VENV="$BACKEND_DIR/venv"
BACKEND_MODULE="main:app"              # uvicorn app path
BACKEND_PORT=8000

FRONTEND_DIR="$HOME/projects/CRM_Dynamics/frontend"
FRONTEND_DEV_CMD="npm run dev"
FRONTEND_PORT=3000
# ------------------------------

echo "Starting MySQL Database Server..."
"$MYSQLD_BIN" --datadir="$MYSQL_DATADIR" >/tmp/mysql.log 2>&1 &
MYSQL_PID=$!

echo "Waiting for MySQL to initialize..."
sleep 5

echo "Starting Backend Server..."
(
  cd "$BACKEND_DIR"
  # activate venv
  # shellcheck source=/dev/null
  source "$BACKEND_VENV/bin/activate"
  uvicorn "$BACKEND_MODULE" --reload --port "$BACKEND_PORT"
) >/tmp/backend.log 2>&1 &
BACKEND_PID=$!

echo "Starting Frontend Server..."
(
  cd "$FRONTEND_DIR"
  $FRONTEND_DEV_CMD
) >/tmp/frontend.log 2>&1 &
FRONTEND_PID=$!

echo "All servers are starting up!"
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

# Keep script running until one of the processes exits
wait
