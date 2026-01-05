# Развертывание на Plesk

Руководство по развертыванию на хостинге с Plesk панелью управления.

## Требования

- Plesk Obsidian 18.0+
- Node.js 18+ (через Plesk Extensions)
- PostgreSQL 15
- Redis (опционально, можно использовать внешний)

## Подготовка

### 1. Установка Node.js

1. Откройте Plesk → Extensions
2. Установите "Node.js"
3. Выберите версию 18.x или выше

### 2. Создание базы данных

1. Plesk → Databases
2. Add Database:
   - Name: `aimak_db`
   - User: `aimak_user`
   - Password: `secure_password`

### 3. Настройка домена

1. Plesk → Websites & Domains
2. Добавьте домен `aimaqaqshamy.kz`
3. Настройте SSL (Let's Encrypt)

## Развертывание

### 1. Загрузка кода

```bash
# Через Git
cd /var/www/vhosts/aimaqaqshamy.kz/httpdocs
git clone <repository-url> .

# Или через File Manager / FTP
```

### 2. Настройка окружения

Создайте `/var/www/vhosts/aimaqaqshamy.kz/httpdocs/apps/api/.env`:

```env
DATABASE_URL="postgresql://aimak_user:PASSWORD@localhost:5432/aimak_db?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=4000
NODE_ENV=production
APP_URL=https://aimaqaqshamy.kz
FRONTEND_URL=https://aimaqaqshamy.kz
JWT_SECRET=your-super-secret-jwt-key-32-chars-minimum
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=another-secret-key-32-chars-minimum
JWT_REFRESH_EXPIRES_IN=7d
UPLOAD_DIR=/var/www/vhosts/aimaqaqshamy.kz/httpdocs/uploads
MAX_FILE_SIZE=5242880
OPENROUTER_API_KEY=sk-or-v1-your-key
OPENROUTER_MODEL=tngtech/deepseek-r1t2-chimera:free
```

Создайте `/var/www/vhosts/aimaqaqshamy.kz/httpdocs/apps/web/.env`:

```env
NEXT_PUBLIC_API_URL=https://aimaqaqshamy.kz/api
NEXT_PUBLIC_APP_NAME=Aimak Akshamy
```

### 3. Установка зависимостей

```bash
cd /var/www/vhosts/aimaqaqshamy.kz/httpdocs
npm install -g pnpm
pnpm install
```

### 4. Миграции

```bash
cd apps/api
npx prisma migrate deploy
npx prisma generate
```

### 5. Сборка

```bash
cd /var/www/vhosts/aimaqaqshamy.kz/httpdocs
pnpm build
```

## Настройка Node.js в Plesk

### API Application

1. Plesk → Node.js
2. Enable Node.js
3. Settings:
   - Application root: `/httpdocs/apps/api`
   - Application startup file: `dist/main.js`
   - Application mode: `production`

### Web Application

1. Создайте второе Node.js приложение
2. Settings:
   - Application root: `/httpdocs/apps/web`
   - Application startup file: `.next/standalone/server.js`
   - Application mode: `production`

## Nginx конфигурация

Plesk → Apache & nginx Settings → Additional nginx directives:

```nginx
# API proxy
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
    client_max_body_size 50M;
}

# Uploads
location /uploads {
    alias /var/www/vhosts/aimaqaqshamy.kz/httpdocs/uploads;
    expires 30d;
    add_header Cache-Control "public, immutable";
    try_files $uri =404;
}

# Frontend
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
}

# Static files
location /_next/static {
    alias /var/www/vhosts/aimaqaqshamy.kz/httpdocs/apps/web/.next/static;
    expires 365d;
    add_header Cache-Control "public, immutable";
}
```

## PM2 через Plesk

### Установка

```bash
npm install -g pm2
```

### ecosystem.config.js

```javascript
module.exports = {
  apps: [
    {
      name: 'aimak-api',
      script: './apps/api/dist/main.js',
      cwd: '/var/www/vhosts/aimaqaqshamy.kz/httpdocs',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      }
    },
    {
      name: 'aimak-web',
      script: './apps/web/.next/standalone/server.js',
      cwd: '/var/www/vhosts/aimaqaqshamy.kz/httpdocs',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
```

### Запуск

```bash
cd /var/www/vhosts/aimaqaqshamy.kz/httpdocs
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Scheduled Tasks

Plesk → Scheduled Tasks:

```bash
# Очистка старых сессий (каждый день в 3:00)
0 3 * * * cd /var/www/vhosts/aimaqaqshamy.kz/httpdocs && node scripts/cleanup.js

# Backup базы данных (каждый день в 2:00)
0 2 * * * pg_dump -U aimak_user aimak_db > /var/www/vhosts/aimaqaqshamy.kz/backups/db_$(date +\%Y\%m\%d).sql
```

## Мониторинг

### Логи

```bash
# PM2 логи
pm2 logs

# Plesk логи
tail -f /var/www/vhosts/aimaqaqshamy.kz/logs/error_log
tail -f /var/www/vhosts/aimaqaqshamy.kz/logs/access_log
```

### Health Check

```bash
curl https://aimaqaqshamy.kz/api/health
```

## Обновление

```bash
cd /var/www/vhosts/aimaqaqshamy.kz/httpdocs

# Получение обновлений
git pull origin main

# Установка зависимостей
pnpm install

# Миграции
cd apps/api && npx prisma migrate deploy && cd ../..

# Сборка
pnpm build

# Перезапуск
pm2 restart all
```

## Troubleshooting

### Проблема: 502 Bad Gateway

```bash
# Проверьте статус PM2
pm2 status

# Проверьте логи
pm2 logs aimak-api --lines 50
```

### Проблема: Не загружаются файлы

```bash
# Проверьте права
chmod -R 755 /var/www/vhosts/aimaqaqshamy.kz/httpdocs/uploads
chown -R www-data:www-data /var/www/vhosts/aimaqaqshamy.kz/httpdocs/uploads
```

### Проблема: БД не подключается

```bash
# Проверьте подключение
psql -U aimak_user -d aimak_db -h localhost
```
