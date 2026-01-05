#!/bin/bash
# Nginx configuration setup for Plesk
# Run this script via SSH on your Plesk server

DOMAIN="aimaqaqshamy.kz"
VHOST_CONF="/var/www/vhosts/system/${DOMAIN}/conf/vhost_nginx.conf"

echo "Creating nginx configuration for ${DOMAIN}..."

# Create nginx configuration
cat > /tmp/nginx_custom.conf << 'EOF'
# API proxy - forwards /api requests to NestJS backend
location /api {
    proxy_pass http://127.0.0.1:4000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;

    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}

# Main Next.js application
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;

    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}

# Static files - uploaded content
location /uploads {
    alias /var/www/vhosts/aimaqaqshamy.kz/httpdocs/uploads;
    expires 30d;
    add_header Cache-Control "public, immutable";
    access_log off;
}

# Next.js static files
location /_next/static {
    proxy_pass http://127.0.0.1:3000;
    proxy_cache_valid 200 60m;
    add_header Cache-Control "public, immutable";
}

# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
EOF

echo "Configuration created at /tmp/nginx_custom.conf"
echo ""
echo "To apply this configuration:"
echo "1. Copy this file to Plesk nginx includes directory"
echo "2. Restart nginx"
echo ""
echo "Run these commands:"
echo "  sudo mkdir -p /var/www/vhosts/system/${DOMAIN}/conf"
echo "  sudo cp /tmp/nginx_custom.conf ${VHOST_CONF}"
echo "  sudo /usr/local/psa/bin/httpdmng --reconfigure-domain ${DOMAIN}"
echo ""
