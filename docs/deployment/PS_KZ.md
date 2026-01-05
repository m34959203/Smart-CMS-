# AIMAK Deployment Guide for PS.kz Cloud VPS

## Server Information
- **Provider**: PS.kz Cloud VPS
- **OS**: Ubuntu 22.04 LTS
- **Application**: Node.js
- **Domain**: aimaqaqshamy.kz
- **IP**: 82.115.49.251

## Quick Deployment (One Command)

```bash
# 1. Connect to server via SSH or Plesk Console VNC

# 2. Navigate to domain directory
cd /var/www/vhosts/aimaqaqshamy.kz

# 3. Remove old files (if any)
rm -rf httpdocs/*

# 4. Clone repository
git clone https://github.com/m34959203/AIMAK.git httpdocs

# 5. Run quickstart
cd httpdocs
sudo bash quickstart.sh
```

## Manual Deployment (Step by Step)

### Step 1: Prepare Environment

```bash
cd /var/www/vhosts/aimaqaqshamy.kz
rm -rf httpdocs/*
git clone https://github.com/m34959203/AIMAK.git httpdocs
cd httpdocs
```

### Step 2: Install Dependencies

```bash
# Install pnpm
npm install -g pnpm

# Install PM2
npm install -g pm2

# Install project dependencies
pnpm install --frozen-lockfile
```

### Step 3: Setup Environment Files

```bash
# Create .env files with production settings
bash setup-env.sh
```

### Step 4: Generate Prisma Client (CRITICAL!)

```bash
cd apps/api
pnpm prisma generate
cd ../..
```

### Step 5: Build Applications

```bash
# Build API
pnpm --filter api build

# Build Web
pnpm --filter web build
```

### Step 6: Create Directories

```bash
mkdir -p uploads logs
chmod 755 uploads logs
```

### Step 7: Run Database Migrations

```bash
cd apps/api
pnpm prisma migrate deploy
cd ../..
```

### Step 8: Configure Nginx in Plesk

1. Go to: **Plesk Panel** -> **Websites & Domains** -> **aimaqaqshamy.kz**
2. Click: **Apache & nginx Settings**
3. Scroll to: **Additional nginx directives**
4. Paste content from `plesk-nginx.conf` file:

```nginx
# Proxy settings
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_cache_bypass $http_upgrade;
proxy_read_timeout 86400;

# API requests -> NestJS on port 4000
location /api {
    proxy_pass http://127.0.0.1:4000;
}

# WebSocket for API
location /socket.io {
    proxy_pass http://127.0.0.1:4000;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}

# Serve uploaded files
location /uploads {
    alias /var/www/vhosts/aimaqaqshamy.kz/httpdocs/uploads;
    expires 30d;
    add_header Cache-Control "public, immutable";
}

# Next.js static files
location /_next/static {
    proxy_pass http://127.0.0.1:3000;
    expires 365d;
    add_header Cache-Control "public, immutable";
}

# Next.js image optimization
location /_next/image {
    proxy_pass http://127.0.0.1:3000;
}

# All other requests -> Next.js on port 3000
location / {
    proxy_pass http://127.0.0.1:3000;
}
```

5. Click **OK** to save

### Step 9: Start PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 10: Verify Deployment

```bash
# Check PM2 status
pm2 status

# Should show:
# ┌────┬──────────────┬─────────┬──────────┐
# │ id │ name         │ status  │ cpu      │
# ├────┼──────────────┼─────────┼──────────┤
# │ 0  │ aimak-api    │ online  │ 0%       │
# │ 1  │ aimak-web    │ online  │ 0%       │
# └────┴──────────────┴─────────┴──────────┘

# Check logs
pm2 logs --lines 20

# Test API
curl http://localhost:4000/api/health

# Test Web
curl http://localhost:3000
```

## Troubleshooting

### PM2 Shows "errored" Status

Run the fix script:
```bash
cd /var/www/vhosts/aimaqaqshamy.kz/httpdocs
sudo bash fix-pm2.sh
```

Or manually:
```bash
pm2 stop all
pnpm install --force
cd apps/api && pnpm prisma generate && cd ../..
pnpm --filter api build
pnpm --filter web build
pm2 delete all
pm2 start ecosystem.config.js
pm2 save
```

### "Cannot read properties of undefined (reading 'ADMIN')"

Prisma client not generated. Fix:
```bash
cd apps/api
pnpm prisma generate
cd ../..
pnpm --filter api build
pm2 restart aimak-api
```

### "Cannot find module 'next/dist/bin/next'"

Next.js not installed. Fix:
```bash
pnpm install --force
pnpm --filter web build
pm2 restart aimak-web
```

### Site Shows 502 Bad Gateway

1. Check if PM2 is running: `pm2 status`
2. Check if nginx config is applied in Plesk
3. Restart nginx: `sudo systemctl restart nginx`
4. Check logs: `pm2 logs`

## Updating the Application

```bash
cd /var/www/vhosts/aimaqaqshamy.kz/httpdocs

# Pull latest changes
git pull origin main

# Reinstall dependencies
pnpm install

# Regenerate Prisma client (IMPORTANT!)
cd apps/api && pnpm prisma generate && cd ../..

# Rebuild
pnpm --filter api build
pnpm --filter web build

# Restart PM2
pm2 restart all
```

## Useful Commands

```bash
# PM2 Commands
pm2 status              # Check status
pm2 logs                # View all logs
pm2 logs aimak-api      # View API logs
pm2 logs aimak-web      # View Web logs
pm2 restart all         # Restart all apps
pm2 stop all            # Stop all apps
pm2 delete all          # Delete all apps
pm2 monit               # Real-time monitoring

# Database Commands
cd apps/api
pnpm prisma studio      # Open Prisma Studio (DB GUI)
pnpm prisma migrate deploy  # Run migrations

# Nginx Commands
sudo systemctl restart nginx
sudo nginx -t           # Test nginx config
```

## SSL Certificate

SSL is managed by Plesk. To enable:
1. Go to: **Plesk Panel** -> **SSL/TLS Certificates**
2. Click: **Install** (Let's Encrypt)
3. Enable: **Redirect HTTP to HTTPS**

## Admin Access

- **URL**: https://aimaqaqshamy.kz/admin
- **Default Email**: admin@aimakakshamy.kz
- **Default Password**: admin123

**IMPORTANT**: Change the admin password immediately after first login!
