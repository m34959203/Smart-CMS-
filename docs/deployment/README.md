# Развертывание

Руководство по развертыванию проекта Aimak Akshamy.

## Варианты развертывания

| Вариант | Сложность | Описание |
|---------|-----------|----------|
| [Docker](./DOCKER.md) | Средняя | Контейнеризация |
| [Plesk](./PLESK.md) | Средняя | Хостинг с панелью управления |
| VPS (ручной) | Высокая | Полный контроль |
| Vercel + Railway | Низкая | Облачные платформы |

## Требования

### Минимальные

- **CPU**: 2 cores
- **RAM**: 4 GB
- **Disk**: 20 GB SSD
- **OS**: Ubuntu 20.04+ / Debian 11+

### Рекомендуемые

- **CPU**: 4 cores
- **RAM**: 8 GB
- **Disk**: 50 GB SSD
- **OS**: Ubuntu 22.04 LTS

### Программное обеспечение

- Node.js >= 18.x
- pnpm >= 8.x
- PostgreSQL 15
- Redis 7
- Nginx (для reverse proxy)
- PM2 (process manager)

## Быстрый старт

### 1. Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Установка pnpm
npm install -g pnpm

# Установка PM2
npm install -g pm2

# Установка PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Установка Redis
sudo apt install -y redis-server
```

### 2. Настройка PostgreSQL

```bash
# Вход в PostgreSQL
sudo -u postgres psql

# Создание БД и пользователя
CREATE DATABASE aimak_db;
CREATE USER aimak_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE aimak_db TO aimak_user;
\q
```

### 3. Клонирование и установка

```bash
# Клонирование
git clone <repository-url> /var/www/aimak
cd /var/www/aimak

# Установка зависимостей
pnpm install

# Настройка окружения
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# Отредактируйте .env файлы

# Миграции
pnpm db:migrate

# Сборка
pnpm build
```

### 4. Запуск с PM2

```bash
# Запуск
pm2 start ecosystem.config.js

# Автозапуск при перезагрузке
pm2 startup
pm2 save
```

### 5. Настройка Nginx

```nginx
# /etc/nginx/sites-available/aimak
server {
    listen 80;
    server_name aimaqaqshamy.kz www.aimaqaqshamy.kz;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 50M;
    }

    # Uploads
    location /uploads {
        alias /var/www/aimak/apps/api/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Активация конфига
sudo ln -s /etc/nginx/sites-available/aimak /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. SSL сертификат (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d aimaqaqshamy.kz -d www.aimaqaqshamy.kz
```

## Мониторинг

### PM2

```bash
# Статус процессов
pm2 status

# Логи
pm2 logs

# Мониторинг
pm2 monit

# Перезапуск
pm2 restart all
```

### Health Check

```bash
# API health
curl http://localhost:4000/api/health

# Frontend
curl http://localhost:3000
```

## Резервное копирование

```bash
# База данных
pg_dump -h localhost -U aimak_user -d aimak_db > backup_$(date +%Y%m%d).sql

# Файлы
tar -czvf uploads_$(date +%Y%m%d).tar.gz /var/www/aimak/apps/api/uploads
```

## Обновление

```bash
cd /var/www/aimak

# Получение обновлений
git pull origin main

# Установка зависимостей
pnpm install

# Миграции
pnpm db:migrate

# Сборка
pnpm build

# Перезапуск
pm2 restart all
```

## Документация

- [Docker развертывание](./DOCKER.md)
- [Plesk развертывание](./PLESK.md)
- [Переменные окружения](./ENVIRONMENT.md)
