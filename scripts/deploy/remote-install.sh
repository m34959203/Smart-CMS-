#!/bin/bash

# ==========================================
# Remote Installation Script for PS.kz
# ==========================================
# This script can be run directly from GitHub
# Usage: bash <(curl -s https://raw.githubusercontent.com/m34959203/AIMAK/claude/deploy-ps-k-hosting-017kP4rrAJz3fsxwQP7HMSUr/remote-install.sh)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

echo -e "${BOLD}${CYAN}"
cat << "EOF"
   ___    ____  __  ___    __ __
  / _ |  /  _/ /  |/  /   / // /
 / __ | _/ /  / /|_/ /   / _  /
/_/ |_|/___/ /_/  /_/   /_//_/

Remote Installation for PS.kz
EOF
echo -e "${NC}"

# Detect current directory
CURRENT_DIR=$(pwd)
echo -e "${BLUE}Current directory: $CURRENT_DIR${NC}"

# Ask for installation directory
read -p "Install to /var/www/vhosts/aimaqaqshamy.kz/httpdocs? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    INSTALL_DIR="/var/www/vhosts/aimaqaqshamy.kz/httpdocs"
else
    read -p "Enter installation directory: " INSTALL_DIR
fi

echo -e "${GREEN}✓${NC} Installing to: $INSTALL_DIR"

# Check if directory exists
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}⚠${NC} Directory already exists"
    read -p "Delete existing files? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}▶${NC} Removing existing files..."
        rm -rf "$INSTALL_DIR"/*
    fi
fi

# Create directory if needed
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Clone repository
echo -e "${BLUE}▶${NC} Cloning repository..."
if [ -d ".git" ]; then
    echo -e "${YELLOW}⚠${NC} Git repository already exists, pulling latest changes..."
    git pull origin claude/deploy-ps-k-hosting-017kP4rrAJz3fsxwQP7HMSUr
else
    git clone -b claude/deploy-ps-k-hosting-017kP4rrAJz3fsxwQP7HMSUr https://github.com/m34959203/AIMAK.git .
fi

echo -e "${GREEN}✓${NC} Repository cloned successfully"

# Run quickstart
echo ""
echo -e "${BOLD}${CYAN}Running quickstart script...${NC}"
echo ""

if [ -f "quickstart.sh" ]; then
    bash quickstart.sh
else
    echo -e "${RED}✗${NC} quickstart.sh not found!"
    echo -e "${YELLOW}⚠${NC} Please run deployment manually"
    exit 1
fi
