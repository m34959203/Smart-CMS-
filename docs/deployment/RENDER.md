# AIMAK - Документация по развертыванию

**Последнее обновление:** 2025-12-10
**Статус:** ✅ Работает

---

## Информация о сервере

| Параметр | Значение |
|----------|----------|
| **IP адрес** | 82.115.49.251 |
| **Домен** | aimaqaqshamy.kz |
| **Платформа** | PS.kz Cloud VPS |
| **ОС** | Ubuntu 22.04 LTS |
| **SSH пользователь** | ubuntu |
| **Директория проекта** | /var/www/aimaqaqshamy |

---

## Архитектура приложения

```
┌─────────────────────────────────────────────────────────────┐
│                     ИНТЕРНЕТ                                 │
│                         │                                    │
│                         ▼                                    │
│              ┌──────────────────┐                           │
│              │  aimaqaqshamy.kz │                           │
│              │   (DNS → IP)     │                           │
│              └────────┬─────────┘                           │
│                       │                                      │
│                       ▼                                      │
│         ┌─────────────────────────────┐                     │
│         │         NGINX               │                     │
│         │    (порты 80, 443)          │                     │
│         │    SSL: Let's Encrypt       │                     │
│         └──────────┬──────────────────┘                     │
│                    │                                         │
│         ┌──────────┴──────────┐                             │
│         │                     │                              │
│         ▼                     ▼                              │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │   aimak-web     │  │   aimak-api     │                   │
│  │   Next.js       │  │   NestJS        │                   │
│  │   порт 3000     │  │   порт 4000     │                   │
│  └─────────────────┘  └────────┬────────┘                   │
│                                │                             │
│                                ▼                             │
│                    ┌─────────────────────┐                  │
│                    │    PostgreSQL       │                  │
│                    │    порт 5432        │                  │
│                    │    БД: aimak        │                  │
│                    └─────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

---

## PM2 Сервисы

| Сервис | Порт | Описание | Директория |
|--------|------|----------|------------|
| aimak-api | 4000 | NestJS API Backend | /var/www/aimaqaqshamy/apps/api |
| aimak-web | 3000 | Next.js Frontend | /var/www/aimaqaqshamy/apps/web |

### Команды управления PM2

```bash
# Статус всех сервисов
pm2 status

# Перезапуск всех сервисов
pm2 restart all

# Перезапуск отдельного сервиса
pm2 restart aimak-web
pm2 restart aimak-api

# Просмотр логов
pm2 logs
pm2 logs aimak-web --lines 50
pm2 logs aimak-api --lines 50

# Мониторинг в реальном времени
pm2 monit

# Сохранение конфигурации PM2
pm2 save

# Настройка автозапуска при перезагрузке
pm2 startup
```

---

## Nginx конфигурация

**Файл конфигурации:** `/etc/nginx/conf.d/aimaqaqshamy.conf`

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name aimaqaqshamy.kz www.aimaqaqshamy.kz _;

    # Редирект на HTTPS (добавлен certbot)
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name aimaqaqshamy.kz www.aimaqaqshamy.kz;

    # SSL сертификаты (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/aimaqaqshamy.kz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/aimaqaqshamy.kz/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # ACME challenge для обновления SSL
    location ^~ /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files $uri =404;
    }

    # API proxy
    location /api {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Web proxy (Next.js)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Команды Nginx

```bash
# Проверить конфигурацию
sudo nginx -t

# Перезапустить nginx
sudo systemctl restart nginx

# Статус nginx
sudo systemctl status nginx

# Логи nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

---

## SSL сертификат (Let's Encrypt)

| Параметр | Значение |
|----------|----------|
| **Провайдер** | Let's Encrypt |
| **Срок действия** | до 2026-03-10 |
| **Сертификат** | /etc/letsencrypt/live/aimaqaqshamy.kz/fullchain.pem |
| **Ключ** | /etc/letsencrypt/live/aimaqaqshamy.kz/privkey.pem |

### Обновление SSL

```bash
# Проверка автообновления
sudo certbot renew --dry-run

# Принудительное обновление
sudo certbot renew

# Список сертификатов
sudo certbot certificates
```

---

## База данных PostgreSQL

| Параметр | Значение |
|----------|----------|
| **Тип** | PostgreSQL 14 |
| **Хост** | localhost |
| **Порт** | 5432 |
| **База данных** | aimak |
| **Пользователь** | aimak |
| **Пароль** | AimakSecure2025! |

### Строка подключения

```
DATABASE_URL="postgresql://aimak:AimakSecure2025!@localhost:5432/aimak?schema=public"
```

### Команды PostgreSQL

```bash
# Подключение к базе
sudo -u postgres psql -d aimak

# Просмотр таблиц
\dt

# Выход
\q
```

### Prisma команды

```bash
cd /var/www/aimaqaqshamy/apps/api

# Генерация клиента
pnpm prisma generate

# Применение миграций
pnpm prisma migrate deploy

# Просмотр БД (веб-интерфейс)
pnpm prisma studio
```

---

## Переменные окружения (.env)

**Расположение:** `/var/www/aimaqaqshamy/.env`

```env
# Database
DATABASE_URL="postgresql://aimak:AimakSecure2025!@localhost:5432/aimak?schema=public"

# Redis (если доступен)
REDIS_HOST=localhost
REDIS_PORT=6379

# Application
PORT=4000
NODE_ENV=production

# URLs
APP_URL=https://aimaqaqshamy.kz
FRONTEND_URL=https://aimaqaqshamy.kz
NEXT_PUBLIC_API_URL=https://aimaqaqshamy.kz/api

# JWT (ВАЖНО: замените на свои секреты!)
JWT_SECRET=aimak-jwt-secret-change-me-2025
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=aimak-refresh-secret-change-me-2025
JWT_REFRESH_EXPIRES_IN=7d

# Upload
UPLOAD_DIR=/var/www/aimaqaqshamy/uploads
MAX_FILE_SIZE=5242880

# App info
NEXT_PUBLIC_APP_NAME=Aimak Akshamy
NEXT_PUBLIC_APP_DESCRIPTION=City Newspaper
```

---

## Структура директорий

```
/var/www/aimaqaqshamy/
├── apps/
│   ├── api/                    # NestJS API Backend
│   │   ├── dist/               # Скомпилированный код
│   │   ├── src/                # Исходный код
│   │   ├── prisma/             # Схема и миграции БД
│   │   └── package.json
│   └── web/                    # Next.js Frontend
│       ├── .next/              # Сборка Next.js
│       ├── src/                # Исходный код
│       └── package.json
├── logs/                       # PM2 логи
│   ├── api-error.log
│   ├── api-out.log
│   ├── web-error.log
│   └── web-out.log
├── uploads/                    # Загруженные файлы
├── ecosystem.config.js         # Конфигурация PM2
├── .env                        # Переменные окружения
└── package.json
```

---

## Процедура обновления

```bash
# 1. Подключиться к серверу
ssh ubuntu@82.115.49.251

# 2. Перейти в директорию проекта
cd /var/www/aimaqaqshamy

# 3. Получить последние изменения
git pull origin main

# 4. Установить зависимости (если изменились)
pnpm install

# 5. Применить миграции БД (если есть новые)
cd apps/api
pnpm prisma migrate deploy
cd ../..

# 6. Пересобрать приложения
cd apps/api && pnpm build && cd ../..
cd apps/web && pnpm build && cd ../..

# 7. Перезапустить сервисы
pm2 restart all

# 8. Проверить статус
pm2 status
curl -I https://aimaqaqshamy.kz
```

---

## Учетные данные

### Администратор сайта
- **Email:** admin@aimak.kz
- **Пароль:** (установить через скрипт create-admin.js)

### SSH доступ
- **Хост:** 82.115.49.251
- **Пользователь:** ubuntu
- **Метод:** SSH ключ или пароль

---

## Диагностика и устранение неполадок

### Проверка статуса

```bash
# PM2 статус
pm2 status

# Nginx статус
sudo systemctl status nginx

# PostgreSQL статус
sudo systemctl status postgresql

# Порты
sudo ss -tlnp | grep -E ":(80|443|3000|4000|5432)"
```

### Частые проблемы

#### 1. Сайт не открывается (502 Bad Gateway)

```bash
# Проверить PM2
pm2 status
pm2 restart all

# Проверить логи
pm2 logs --lines 50
```

#### 2. PM2 приложения в статусе "errored"

```bash
# Посмотреть логи ошибок
pm2 logs aimak-api --lines 50
pm2 logs aimak-web --lines 50

# Перезапустить
pm2 restart all
```

#### 3. Порт уже занят (EADDRINUSE)

```bash
# Найти процесс
sudo lsof -i :3000
sudo lsof -i :4000

# Убить процесс
sudo kill -9 <PID>

# Перезапустить PM2
pm2 restart all
```

#### 4. Nginx не запускается

```bash
# Проверить конфигурацию
sudo nginx -t

# Посмотреть логи
sudo tail -50 /var/log/nginx/error.log

# Проверить порт 80
sudo ss -tlnp | grep :80
sudo fuser -k 80/tcp
sudo systemctl restart nginx
```

#### 5. SSL сертификат истёк

```bash
# Обновить сертификат
sudo certbot renew

# Перезапустить nginx
sudo systemctl restart nginx
```

---

## Полезные команды

```bash
# Быстрый деплой
cd /var/www/aimaqaqshamy && git pull && pnpm install && pm2 restart all

# Просмотр всех логов
pm2 logs

# Очистка логов PM2
pm2 flush

# Мониторинг ресурсов
pm2 monit

# Информация о системе
htop
df -h
free -m

# Проверка SSL
curl -I https://aimaqaqshamy.kz
openssl s_client -connect aimaqaqshamy.kz:443 -servername aimaqaqshamy.kz

# Тест API
curl https://aimaqaqshamy.kz/api/health
```

---

## Контакты и ресурсы

- **Репозиторий:** GitHub (m34959203/AIMAK)
- **Домен:** aimaqaqshamy.kz
- **Хостинг:** PS.kz

---

## История изменений

| Дата | Описание |
|------|----------|
| 2025-12-10 | Полная настройка VPS: nginx, PM2, SSL, PostgreSQL |
| 2025-12-10 | Исправлена проблема с nginx (conf.d вместо sites-enabled) |
| 2025-12-10 | Установлен SSL сертификат Let's Encrypt |

---

*Документация создана автоматически. При изменениях в конфигурации обновите этот файл.*
