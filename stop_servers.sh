#!/usr/bin/env bash
set -e

# ==============================================================================
# PRODUCTION MODE (Detected if running on the Raspberry Pi)
# ==============================================================================
if [ -d "/var/www/egcrm" ]; then
    echo "🌍 Detected Production Environment (/var/www/egcrm)."
    echo "Stopping background services..."
    
    # 1. Stop PM2 background processes (Frontend & Backend)
    if command -v pm2 &> /dev/null; then
        cd "/var/www/egcrm" && pm2 stop all || true
    fi
    
    # 2. Stop Nginx reverse proxy
    sudo systemctl stop nginx || true
    
    # 3. Stop MariaDB (Database)
    sudo systemctl stop mariadb || true
    
    echo ""
    echo "🛑 All Production Servers have been STOPPED!"
    exit 0
fi

# ==============================================================================
# LOCAL DEVELOPMENT MODE (Windows / WSL / Mac)
# ==============================================================================
echo "🛑 Stopping Local Development Servers..."

# Stop Backend (uvicorn)
if pgrep -f "uvicorn" > /dev/null; then
    echo "Stopping Backend Server (uvicorn)..."
    pkill -f "uvicorn" || true
else
    echo "Backend Server is not running."
fi

# Stop Frontend (Node/Next.js)
if pgrep -f "npm run dev" > /dev/null || pgrep -f "next" > /dev/null; then
    echo "Stopping Frontend Server..."
    pkill -f "npm run dev" || true
    pkill -f "next" || true
else
    echo "Frontend Server is not running."
fi

# Stop Database (mysqld)
if pgrep -f "mysqld" > /dev/null; then
    echo "Stopping MySQL Server..."
    pkill -f "mysqld" || true
else
    echo "MySQL Server is not running."
fi

echo ""
echo "✅ All local services stopped."
