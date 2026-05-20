#!/usr/bin/env bash
set -euo pipefail

# EGCRM WSL development bootstrap.
# Run from Ubuntu/WSL:
#   cd /mnt/c/projects/EGCRM
#   bash setup_wsl.sh

APP_DIR="${APP_DIR:-$HOME/EGCRM}"
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

DB_NAME="${DB_NAME:-egcrm}"
DB_USER="${DB_USER:-egcrm_user}"

BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

info() { printf '\033[0;32m[INFO]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[WARN]\033[0m %s\n' "$*"; }

if ! grep -qi microsoft /proc/version 2>/dev/null; then
  warn "This script is intended for WSL. Continuing anyway."
fi

if [[ "$SOURCE_DIR" == /mnt/* ]]; then
  info "Copying project from Windows filesystem to Linux filesystem: $APP_DIR"
  mkdir -p "$APP_DIR"
  rsync -a --delete \
    --exclude '.git/' \
    --exclude 'backend/venv/' \
    --exclude 'frontend/node_modules/' \
    --exclude 'frontend/.next/' \
    "$SOURCE_DIR/" "$APP_DIR/"
else
  APP_DIR="$SOURCE_DIR"
  info "Project is already on the Linux filesystem: $APP_DIR"
fi

info "Installing system dependencies"
sudo apt-get update
sudo apt-get install -y \
  ca-certificates curl gnupg git rsync build-essential openssl \
  python3 python3-pip python3-venv python3-dev \
  mariadb-server

DB_PASS="${DB_PASS:-$(openssl rand -hex 18)}"
SECRET_KEY="${SECRET_KEY:-$(openssl rand -hex 32)}"

if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | sed 's/^v//' | cut -d. -f1)" -lt 20 ]]; then
  info "Installing Node.js 22 from NodeSource"
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  info "Node.js $(node -v) is already installed"
fi

info "Starting MariaDB"
if command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files mariadb.service >/dev/null 2>&1; then
  sudo systemctl enable --now mariadb || sudo systemctl start mariadb
else
  sudo service mariadb start || sudo service mysql start
fi

info "Creating database and user"
sudo mysql <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL

info "Setting up Python backend"
cd "$APP_DIR/backend"
python3 -m venv venv
source venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
cat > .env <<ENV
DATABASE_URL=mysql+pymysql://${DB_USER}:${DB_PASS}@localhost:3306/${DB_NAME}
SECRET_KEY=${SECRET_KEY}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
ENV
deactivate

info "Setting up Next.js frontend"
cd "$APP_DIR/frontend"
npm install
cat > .env.local <<ENV
NEXT_PUBLIC_API_URL=http://localhost:${BACKEND_PORT}
ENV

cat > "$APP_DIR/.wsl-env" <<ENV
APP_DIR=${APP_DIR}
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASS=${DB_PASS}
BACKEND_PORT=${BACKEND_PORT}
FRONTEND_PORT=${FRONTEND_PORT}
ENV
chmod 600 "$APP_DIR/.wsl-env"

info "Setup complete"
cat <<EOF

Project location in WSL:
  $APP_DIR

Start the app:
  cd "$APP_DIR"
  bash start_servers.sh

URLs:
  Backend:  http://localhost:${BACKEND_PORT}/docs
  Frontend: http://localhost:${FRONTEND_PORT}

Database credentials were saved in:
  $APP_DIR/.wsl-env
  $APP_DIR/backend/.env
EOF
