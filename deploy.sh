#!/bin/bash
# =============================================================================
# EGCRM Server Deployment Script
# Ubuntu 20.04 | MySQL | Nginx | PM2
# Run as a non-root user with sudo privileges
# Usage: bash deploy.sh
# =============================================================================

set -e  # Exit on any error

# ── Colors ────────────────────────────────────────────────────────────────────
BOLD='\033[1m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()    { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
section() { echo -e "\n${BOLD}═══ $1 ═══${NC}"; }

# ── Config — EDIT THESE ───────────────────────────────────────────────────────
REPO_URL="https://github.com/YonatanH911/EGCRM.git"
APP_DIR="/var/www/egcrm"
SERVER_IP=$(hostname -I | awk '{print $1}')   # auto-detected

DB_NAME="egcrm"
DB_USER="egcrm_user"
DB_PASS="***"          # ← FILL IN: your database password
ROOT_PASS="***"        # ← FILL IN: your MySQL root password (set during mysql_secure_installation)

SECRET_KEY=$(openssl rand -hex 32)  # auto-generated JWT key

BACKEND_PORT=8000
FRONTEND_PORT=3000

# ── Pre-flight check ──────────────────────────────────────────────────────────
if [[ -z "$DB_PASS" || -z "$ROOT_PASS" ]]; then
    echo -e "${RED}[ERROR]${NC} Please edit deploy.sh and fill in DB_PASS and ROOT_PASS before running."
    exit 1
fi

if [[ "$EUID" -eq 0 ]]; then
    echo -e "${RED}[ERROR]${NC} Do not run as root. Run as a normal user with sudo."
    exit 1
fi

# =============================================================================
section "1. System Update & Dependencies"
# =============================================================================

info "Updating system packages..."
sudo apt-get update -y && sudo apt-get upgrade -y

info "Installing system tools..."
sudo apt-get install -y curl git build-essential software-properties-common \
    python3-pip python3-venv python3-dev nginx ufw openssl

# =============================================================================
section "2. Node.js 18 (via NodeSource)"
# =============================================================================

if ! command -v node &>/dev/null || [[ $(node -v | cut -d. -f1 | tr -d 'v') -lt 18 ]]; then
    info "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    info "Node.js $(node -v) already installed."
fi

info "Installing PM2 globally..."
sudo npm install -g pm2

# =============================================================================
section "3. Python 3 Environment"
# =============================================================================

info "Ensuring Python 3 venv is ready..."
sudo apt-get install -y python3-venv python3-dev
info "Using $(python3 --version)"

# =============================================================================
section "4. MySQL 8"
# =============================================================================

if ! command -v mysql &>/dev/null; then
    info "Installing MySQL Server..."
    sudo apt-get install -y mysql-server
    sudo systemctl start mysql
    sudo systemctl enable mysql

    info "Securing MySQL installation..."
    sudo mysql -u root <<MYSQL_SECURE
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${ROOT_PASS}';
DELETE FROM mysql.user WHERE User='';
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');
DROP DATABASE IF EXISTS test;
DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';
FLUSH PRIVILEGES;
MYSQL_SECURE
    info "MySQL secured."
else
    info "MySQL already installed."
fi

info "Creating database and user..."
mysql -u root -p"${ROOT_PASS}" <<MYSQL_SETUP
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
MYSQL_SETUP
info "Database '${DB_NAME}' and user '${DB_USER}' ready."

# =============================================================================
section "5. Clone / Update Repository"
# =============================================================================

if [ -d "$APP_DIR" ]; then
    warn "Directory $APP_DIR already exists. Pulling latest changes..."
    sudo chown -R "$USER":"$USER" "$APP_DIR"
    cd "$APP_DIR" && git pull origin master
else
    info "Cloning repository to $APP_DIR..."
    sudo mkdir -p "$APP_DIR"
    sudo chown "$USER":"$USER" "$APP_DIR"
    git clone "$REPO_URL" "$APP_DIR"
fi

# =============================================================================
section "6. Backend Setup"
# =============================================================================

cd "$APP_DIR/backend"

info "Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

info "Installing Python dependencies..."
pip install --upgrade pip
# Strip strict version pinning since Raspberry Pi OS has a fixed Python version
sed -i 's/==.*//' requirements.txt
pip install -r requirements.txt

info "Writing backend .env file..."
cat > .env <<ENV
DATABASE_URL=mysql+pymysql://${DB_USER}:${DB_PASS}@localhost:3306/${DB_NAME}
SECRET_KEY=${SECRET_KEY}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
ENV

info "Backend .env created (SECRET_KEY auto-generated)."

deactivate

# =============================================================================
section "7. Frontend Setup"
# =============================================================================

cd "$APP_DIR/frontend"

info "Installing Node.js dependencies..."
npm install

info "Writing frontend .env.local file..."
cat > .env.local <<ENV
NEXT_PUBLIC_API_URL=http://${SERVER_IP}:${BACKEND_PORT}
ENV

info "Building Next.js for production..."
npm run build

# =============================================================================
section "8. PM2 Process Manager"
# =============================================================================

info "Creating PM2 ecosystem config..."
cat > "$APP_DIR/ecosystem.config.js" <<PM2
module.exports = {
  apps: [
    {
      name: 'egcrm-backend',
      cwd: '${APP_DIR}/backend',
      script: '${APP_DIR}/backend/venv/bin/uvicorn',
      args: 'main:app --host 0.0.0.0 --port ${BACKEND_PORT}',
      interpreter: 'none',
      env: { PYTHONPATH: '${APP_DIR}/backend' },
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
    },
    {
      name: 'egcrm-frontend',
      cwd: '${APP_DIR}/frontend',
      script: 'npm',
      args: 'start',
      env: {
        PORT: ${FRONTEND_PORT},
        NODE_ENV: 'production',
      },
      autorestart: true,
      watch: false,
    },
  ],
};
PM2

info "Starting apps with PM2..."
cd "$APP_DIR"
pm2 start ecosystem.config.js
pm2 save

info "Configuring PM2 to start on boot..."
pm2 startup | tail -1 | bash || true

# =============================================================================
section "9. Nginx Reverse Proxy"
# =============================================================================

info "Writing Nginx config..."
sudo tee /etc/nginx/sites-available/egcrm > /dev/null <<NGINX
server {
    listen 80;
    server_name ${SERVER_IP} _;

    # Frontend (Next.js)
    location / {
        proxy_pass http://127.0.0.1:${FRONTEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend API
    location /api/ {
        rewrite ^/api(/.*)$ \$1 break;
        proxy_pass http://127.0.0.1:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/egcrm /etc/nginx/sites-enabled/egcrm
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
info "Nginx configured and reloaded."

# =============================================================================
section "10. Firewall (UFW)"
# =============================================================================

info "Configuring UFW firewall rules..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
info "Firewall enabled. Allowed: SSH + Nginx (80/443)."

# =============================================================================
section "✅ Deployment Complete!"
# =============================================================================

echo ""
echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  EGCRM is now running!${NC}"
echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "  🌐 App URL:     ${BOLD}http://${SERVER_IP}${NC}"
echo -e "  🔌 API URL:     ${BOLD}http://${SERVER_IP}/api/docs${NC}"
echo -e "  📦 App dir:     ${BOLD}${APP_DIR}${NC}"
echo -e "  🔑 SECRET_KEY:  saved in ${APP_DIR}/backend/.env"
echo ""
echo -e "  PM2 commands:"
echo -e "    pm2 status           — view running processes"
echo -e "    pm2 logs             — view live logs"
echo -e "    pm2 restart all      — restart all services"
echo ""
echo -e "${YELLOW}  ⚠️  Go to http://${SERVER_IP}/register to create your first user.${NC}"
echo ""
