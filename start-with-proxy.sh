#!/bin/bash

# ==========================================
# Final Setup Script with Proxy
# ==========================================
# Run this script on the PS.kz server after pulling the latest changes

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

echo -e "${BOLD}${CYAN}==================================${NC}"
echo -e "${BOLD}${CYAN}AIMAK Final Setup with Proxy${NC}"
echo -e "${BOLD}${CYAN}==================================${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}✗${NC} package.json not found. Please run from project root."
    exit 1
fi

# Step 1: Pull latest changes
echo -e "${BLUE}▶${NC} Pulling latest changes from git..."
git pull origin claude/deploy-ps-k-hosting-017kP4rrAJz3fsxwQP7HMSUr

# Step 2: Install dependencies
echo -e "${BLUE}▶${NC} Installing dependencies..."
pnpm install

# Step 2.1: Install http-proxy dependency explicitly
echo -e "${BLUE}▶${NC} Installing http-proxy package..."
npm install http-proxy --save

# Step 3: Check if proxy.js exists
if [ ! -f "proxy.js" ]; then
    echo -e "${RED}✗${NC} proxy.js not found!"
    exit 1
fi

# Make proxy.js executable
chmod +x proxy.js
echo -e "${GREEN}✓${NC} proxy.js is ready"

# Step 4: Stop current PM2 processes
echo -e "${BLUE}▶${NC} Stopping current PM2 processes..."
pm2 delete all 2>/dev/null || echo "No processes to delete"

# Step 5: Start all applications including proxy
echo -e "${BLUE}▶${NC} Starting all applications with PM2..."
sudo pm2 start ecosystem.config.js

# Step 6: Save PM2 configuration
echo -e "${BLUE}▶${NC} Saving PM2 configuration..."
sudo pm2 save

# Step 7: Setup PM2 to start on boot (if not already done)
echo -e "${BLUE}▶${NC} Setting up PM2 startup..."
sudo pm2 startup || echo "Startup already configured"

# Step 8: Check status
echo ""
echo -e "${BOLD}${CYAN}==================================${NC}"
echo -e "${BOLD}${CYAN}Application Status${NC}"
echo -e "${BOLD}${CYAN}==================================${NC}"
echo ""
sudo pm2 status

echo ""
echo -e "${GREEN}✓${NC} Setup completed successfully!"
echo ""
echo -e "${BOLD}Testing endpoints...${NC}"
echo ""

# Wait a moment for apps to start
sleep 3

# Test API
echo -n "API Health Check: "
if curl -s http://localhost:4000/api/health > /dev/null; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${YELLOW}⚠ Not responding yet${NC}"
fi

# Test Web
echo -n "Web Application: "
if curl -s -I http://localhost:3000 | grep -q "HTTP"; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${YELLOW}⚠ Not responding yet${NC}"
fi

# Test Proxy
echo -n "Proxy (Port 80): "
if curl -s -I http://localhost/api/health | grep -q "HTTP"; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${YELLOW}⚠ Not responding yet (may need sudo access)${NC}"
fi

echo ""
echo -e "${BOLD}${CYAN}Next Steps:${NC}"
echo ""
echo "1. Check PM2 logs for any errors:"
echo "   ${CYAN}sudo pm2 logs${NC}"
echo ""
echo "2. Test external access:"
echo "   ${CYAN}curl http://82.115.49.251/api/health${NC}"
echo "   ${CYAN}curl http://aimaqaqshamy.kz/api/health${NC}"
echo ""
echo "3. Open in browser:"
echo "   ${CYAN}http://aimaqaqshamy.kz${NC}"
echo "   ${CYAN}http://aimaqaqshamy.kz/admin${NC}"
echo ""
echo -e "${GREEN}Deployment complete! 🎉${NC}"
