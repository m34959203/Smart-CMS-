#!/bin/bash
# Start script for AIMAK on Plesk hosting
# Usage: bash start.sh

# Install PM2 globally if not available
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Start applications using PM2
pm2 start ecosystem.config.js

echo "Applications started!"
echo "Check status: pm2 status"
echo "View logs: pm2 logs"
echo "Stop all: pm2 stop all"
