#!/usr/bin/env bash
set -e

# ==============================================================================
# PRODUCTION MODE (Detected if running in /var/www/egcrm)
# ==============================================================================
if [ -d "/home/egcrm" ] || [ -d "/var/www/egcrm" ] || [ "$(pwd)" == "/home/egcrm" ] || [ "$(pwd)" == "/var/www/egcrm" ]; then
    echo "🌍 Detected Production Environment."
    echo "Stopping background services..."
    
    # 1. Stop PM2 background processes
    if command -v pm2 &> /dev/null; then
        pm2 stop all || true
        pm2 delete all || true
    fi
    
    # 2. Stop Nginx & MariaDB
    sudo systemctl stop nginx || true
    sudo systemctl stop mariadb || true
    
    # 3. Nuclear Cleanup (Port based)
    echo "Cleaning up ports 3000 and 8000..."
    sudo fuser -k 3000/tcp || true
    sudo fuser -k 8000/tcp || true

    echo "🛑 All Production Servers have been STOPPED!"
    exit 0
fi

# ==============================================================================
# LOCAL / DEVELOPMENT MODE
# ==============================================================================
echo "🛑 Stopping Development Servers..."

# 1. Kill by Port (Most reliable)
echo "Killing processes on ports 3000 (Frontend) and 8000 (Backend)..."
if command -v fuser &> /dev/null; then
    fuser -k 3000/tcp 2>/dev/null || true
    fuser -k 8000/tcp 2>/dev/null || true
fi

# 2. Kill by Process Name (Fall-back)
echo "Ensuring all Node and Python (Uvicorn) processes are stopped..."
pkill -9 -f "next-server" || true
pkill -9 -f "next" || true
pkill -9 -f "uvicorn" || true
pkill -9 -f "node" || true

# 3. Final Cleanup for current user
# pkill -u $USER node || true

echo "✅ All services stopped."
