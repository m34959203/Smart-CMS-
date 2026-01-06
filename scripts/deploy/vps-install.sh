#!/bin/bash

# ==========================================
# AIMAK VPS Installation Script for ps.kz
# ==========================================
# This script automatically sets up your VPS for running AIMAK project
# Usage: bash vps-install.sh

set -e

echo "🚀 AIMAK VPS Installation Script"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
   error "Please run as root: sudo bash vps-install.sh"
   exit 1
fi

info "Starting VPS setup..."
echo ""

# 1. Update system
info "Step 1/8: Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq

# 2. Install required packages
info "Step 2/8: Installing required packages..."
apt-get install -y curl wget git nginx certbot python3-certbot-nginx

# 3. Install Node.js 18.x
info "Step 3/8: Installing Node.js 18.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
else
    info "Node.js already installed: $(node --version)"
fi

# 4. Install pnpm
info "Step 4/8: Installing pnpm..."
if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm
else
    info "pnpm already installed: $(pnpm --version)"
fi

# 5. Install PM2
info "Step 5/8: Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    pm2 startup
    pm2 save
else
    info "PM2 already installed: $(pm2 --version)"
fi

# 6. Create project directory
info "Step 6/8: Setting up project directory..."
PROJECT_DIR="/var/www/aimaqaqshamy"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# 7. Clone repository (if not exists)
info "Step 7/8: Cloning repository..."
if [ ! -d "$PROJECT_DIR/.git" ]; then
    git clone https://github.com/m34959203/AIMAK.git .
else
    info "Repository already exists, pulling latest changes..."
    git pull origin main
fi

# 8. Run deployment script
info "Step 8/8: Running deployment script..."
bash setup-env.sh
bash plesk-deploy.sh

echo ""
echo "================================================"
info "✅ VPS setup completed successfully!"
echo "================================================"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Configure nginx:"
echo "   sudo nano /etc/nginx/sites-available/aimaqaqshamy"
echo "   (See nginx-vps.conf in project root)"
echo ""
echo "2. Enable site:"
echo "   sudo ln -s /etc/nginx/sites-available/aimaqaqshamy /etc/nginx/sites-enabled/"
echo "   sudo nginx -t"
echo "   sudo systemctl restart nginx"
echo ""
echo "3. Setup SSL certificate:"
echo "   sudo certbot --nginx -d aimaqaqshamy.kz -d www.aimaqaqshamy.kz"
echo ""
echo "4. Start applications:"
echo "   cd $PROJECT_DIR && bash start.sh"
echo ""
echo "5. Create admin user:"
echo "   cd $PROJECT_DIR/apps/api && node scripts/create-admin.js"
echo ""
echo "6. Check status:"
echo "   pm2 status"
echo "   pm2 logs"
echo ""
echo "🎉 Your VPS is ready!"
echo ""
