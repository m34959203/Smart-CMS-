# Настройка AIMAK на VPS без Plesk

## Проблема
Сайт доступен по IP-адресу (82.115.49.251), но **не доступен** по домену (aimaqaqshamy.kz).
На сервере **НЕТ Plesk** - это обычный VPS с Ubuntu.

## Что нужно настроить

Для работы домена на VPS без Plesk нужно:
1. ✅ **DNS** - настроить в панели регистратора домена
2. ✅ **Nginx** - установить и настроить на сервере
3. ✅ **SSL** - установить Let's Encrypt сертификат
4. ✅ **PM2** - запустить приложения

---

## Шаг 1: Проверка DNS

### Выполните на любом компьютере:

```bash
nslookup aimaqaqshamy.kz
```

**Должно вернуть:**
```
Name:    aimaqaqshamy.kz
Address: 82.115.49.251
```

### Если DNS не настроен:

1. Войдите в панель регистратора домена .kz (где купили домен)
2. Найдите раздел "Управление DNS" или "DNS Settings"
3. Добавьте A-записи:

| Тип | Имя | Значение        | TTL  |
|-----|-----|----------------|------|
| A   | @   | 82.115.49.251  | 3600 |
| A   | www | 82.115.49.251  | 3600 |

4. Сохраните и подождите 5-30 минут для распространения DNS
5. Проверьте снова: `nslookup aimaqaqshamy.kz`

---

## Шаг 2: Установка и настройка Nginx

### 2.1. Проверка установки Nginx

Подключитесь к серверу по SSH:

```bash
# Проверка, установлен ли nginx
nginx -v
```

**Если nginx не установлен:**

```bash
sudo apt update
sudo apt install nginx -y
```

**Проверка работы:**

```bash
sudo systemctl status nginx
```

Должен быть статус: **active (running)**

### 2.2. Создание конфигурации для домена

```bash
# Создайте файл конфигурации
sudo nano /etc/nginx/sites-available/aimaqaqshamy
```

**Скопируйте эту конфигурацию:**

```nginx
# ==========================================
# Nginx Configuration for aimaqaqshamy.kz
# ==========================================

# Upstream definitions
upstream api_backend {
    server 127.0.0.1:4000;
    keepalive 64;
}

upstream web_frontend {
    server 127.0.0.1:3000;
    keepalive 64;
}

# HTTP server - redirect to HTTPS (временно закомментировано)
server {
    listen 80;
    listen [::]:80;
    server_name aimaqaqshamy.kz www.aimaqaqshamy.kz;

    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Временно: проксирование на приложение (для тестирования)
    # После установки SSL раскомментируйте редирект ниже

    # API proxy
    location /api {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }

    # Web proxy
    location / {
        proxy_pass http://web_frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }

    # После установки SSL закомментируйте блоки выше и раскомментируйте:
    # Redirect all HTTP to HTTPS
    # location / {
    #     return 301 https://$server_name$request_uri;
    # }
}

# HTTPS server (активируется после установки SSL)
# Раскомментируйте этот блок после установки SSL-сертификата
#
# server {
#     listen 443 ssl http2;
#     listen [::]:443 ssl http2;
#     server_name aimaqaqshamy.kz www.aimaqaqshamy.kz;
#
#     # SSL certificates
#     ssl_certificate /etc/letsencrypt/live/aimaqaqshamy.kz/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/aimaqaqshamy.kz/privkey.pem;
#
#     # SSL configuration
#     ssl_protocols TLSv1.2 TLSv1.3;
#     ssl_ciphers HIGH:!aNULL:!MD5;
#     ssl_prefer_server_ciphers on;
#
#     # Logs
#     access_log /var/log/nginx/aimaqaqshamy-access.log;
#     error_log /var/log/nginx/aimaqaqshamy-error.log;
#
#     # Max upload size
#     client_max_body_size 10M;
#
#     # API proxy
#     location /api {
#         proxy_pass http://api_backend;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade $http_upgrade;
#         proxy_set_header Connection 'upgrade';
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#         proxy_cache_bypass $http_upgrade;
#         proxy_read_timeout 60s;
#     }
#
#     # Static files - uploaded content
#     location /uploads {
#         alias /var/www/aimaqaqshamy/uploads;
#         expires 30d;
#         add_header Cache-Control "public, immutable";
#         access_log off;
#     }
#
#     # Next.js static files
#     location /_next/static {
#         proxy_pass http://web_frontend;
#         expires 365d;
#         add_header Cache-Control "public, immutable";
#     }
#
#     # Next.js images
#     location /_next/image {
#         proxy_pass http://web_frontend;
#         proxy_cache_valid 200 30d;
#     }
#
#     # Main Next.js application
#     location / {
#         proxy_pass http://web_frontend;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade $http_upgrade;
#         proxy_set_header Connection 'upgrade';
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#         proxy_cache_bypass $http_upgrade;
#         proxy_read_timeout 60s;
#     }
#
#     # Security headers
#     add_header X-Frame-Options "SAMEORIGIN" always;
#     add_header X-Content-Type-Options "nosniff" always;
#     add_header X-XSS-Protection "1; mode=block" always;
#     add_header Referrer-Policy "strict-origin-when-cross-origin" always;
#
#     # Hide nginx version
#     server_tokens off;
# }
```

**Сохраните файл:** `Ctrl+X`, затем `Y`, затем `Enter`

### 2.3. Активация конфигурации

```bash
# Создайте символическую ссылку
sudo ln -s /etc/nginx/sites-available/aimaqaqshamy /etc/nginx/sites-enabled/

# Удалите дефолтную конфигурацию (если есть)
sudo rm -f /etc/nginx/sites-enabled/default

# Проверьте конфигурацию на ошибки
sudo nginx -t
```

**Должно быть:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

**Если есть ошибки:** проверьте правильность скопированной конфигурации.

### 2.4. Перезапуск Nginx

```bash
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## Шаг 3: Проверка работы PM2

### 3.1. Проверка статуса PM2

```bash
pm2 status
```

**Должно быть:**
```
┌────┬──────────────┬─────────┬──────────┐
│ id │ name         │ status  │ cpu      │
├────┼──────────────┼─────────┼──────────┤
│ 0  │ aimak-api    │ online  │ 0%       │
│ 1  │ aimak-web    │ online  │ 0%       │
└────┴──────────────┴─────────┴──────────┘
```

### 3.2. Если PM2 не запущен:

```bash
# Определите директорию проекта
cd /var/www/aimaqaqshamy  # или другая директория где установлен проект

# Запустите PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 3.3. Проверка локальной работы приложений

```bash
# Тест API
curl http://localhost:4000/api/health

# Тест Web
curl -I http://localhost:3000
```

Оба должны вернуть успешный ответ.

---

## Шаг 4: Тестирование через домен

### 4.1. Проверка HTTP (без SSL)

```bash
curl -I http://aimaqaqshamy.kz
```

Должно вернуть HTTP 200 или 301.

### 4.2. Открытие в браузере

Откройте: **http://aimaqaqshamy.kz** (без HTTPS пока)

Сайт должен открыться! Если не открывается:

```bash
# Проверьте логи nginx
sudo tail -f /var/log/nginx/error.log

# Проверьте логи PM2
pm2 logs --lines 50
```

---

## Шаг 5: Установка SSL-сертификата

После того как сайт работает по HTTP, установите SSL.

### 5.1. Установка Certbot

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

### 5.2. Создание директории для Let's Encrypt

```bash
sudo mkdir -p /var/www/certbot
sudo chown -R www-data:www-data /var/www/certbot
```

### 5.3. Получение сертификата

```bash
sudo certbot --nginx -d aimaqaqshamy.kz -d www.aimaqaqshamy.kz
```

**Вам будет задано несколько вопросов:**
1. Email адрес: введите ваш email
2. Согласие с ToS: `Y`
3. Подписка на новости: `N` (по желанию)
4. Редирект на HTTPS: `2` (Yes, redirect)

Certbot **автоматически** обновит конфигурацию nginx!

### 5.4. Если Certbot не может обновить конфигурацию автоматически

Отредактируйте конфигурацию вручную:

```bash
sudo nano /etc/nginx/sites-available/aimaqaqshamy
```

1. **Закомментируйте** блоки `location /api` и `location /` в секции HTTP (server listen 80)
2. **Раскомментируйте** строку редиректа:
   ```nginx
   location / {
       return 301 https://$server_name$request_uri;
   }
   ```
3. **Раскомментируйте** весь блок HTTPS (server listen 443 ssl)

Сохраните и перезапустите nginx:

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 5.5. Настройка автообновления SSL

```bash
# Проверка автообновления
sudo certbot renew --dry-run
```

Если команда выполнена успешно, сертификат будет автоматически обновляться.

---

## Шаг 6: Финальная проверка

### 6.1. Проверка HTTPS

```bash
curl -I https://aimaqaqshamy.kz
```

Должно вернуть HTTP 200.

### 6.2. Открытие в браузере

Откройте: **https://aimaqaqshamy.kz**

Сайт должен открыться с зеленым замочком (SSL)!

### 6.3. Проверка редиректа HTTP → HTTPS

```bash
curl -I http://aimaqaqshamy.kz
```

Должно вернуть HTTP 301 (редирект на HTTPS).

---

## Шаг 7: Настройка Firewall (опционально)

Если используется UFW firewall:

```bash
# Разрешить HTTP и HTTPS
sudo ufw allow 'Nginx Full'

# Или по отдельности:
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Проверка статуса
sudo ufw status
```

---

## Краткий чеклист

- [ ] DNS настроен: `nslookup aimaqaqshamy.kz` → 82.115.49.251
- [ ] Nginx установлен: `nginx -v`
- [ ] Конфигурация создана: `/etc/nginx/sites-available/aimaqaqshamy`
- [ ] Конфигурация активирована: симлинк в `/etc/nginx/sites-enabled/`
- [ ] Nginx перезапущен: `sudo systemctl restart nginx`
- [ ] PM2 работает: `pm2 status` → оба online
- [ ] HTTP работает: `curl http://aimaqaqshamy.kz`
- [ ] SSL установлен: `sudo certbot --nginx -d aimaqaqshamy.kz -d www.aimaqaqshamy.kz`
- [ ] HTTPS работает: `curl https://aimaqaqshamy.kz`
- [ ] Редирект работает: HTTP → HTTPS

---

## Автоматизированный скрипт установки

Для автоматической установки nginx и настройки используйте:

```bash
cd /path/to/aimak  # ваша директория проекта
sudo bash setup-vps-nginx.sh
```

Этот скрипт автоматически:
1. Установит nginx
2. Создаст конфигурацию
3. Активирует её
4. Перезапустит nginx

---

## Диагностика проблем

### Проблема: Домен не открывается

```bash
# 1. Проверьте DNS
nslookup aimaqaqshamy.kz

# 2. Проверьте nginx
sudo systemctl status nginx
sudo nginx -t

# 3. Проверьте порты
sudo netstat -tlnp | grep nginx

# 4. Проверьте логи
sudo tail -f /var/log/nginx/error.log

# 5. Проверьте PM2
pm2 status
pm2 logs --lines 50
```

### Проблема: 502 Bad Gateway

```bash
# PM2 не работает или приложения упали
pm2 status
pm2 restart all

# Проверьте что порты 3000 и 4000 слушаются
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :4000
```

### Проблема: SSL не устанавливается

```bash
# Убедитесь что DNS настроен
nslookup aimaqaqshamy.kz

# Убедитесь что порт 80 открыт
sudo ufw status
curl -I http://aimaqaqshamy.kz

# Попробуйте вручную
sudo certbot certonly --webroot -w /var/www/certbot -d aimaqaqshamy.kz -d www.aimaqaqshamy.kz
```

---

## Полезные команды

```bash
# Nginx
sudo systemctl status nginx      # Статус
sudo systemctl restart nginx     # Перезапуск
sudo systemctl stop nginx        # Остановка
sudo nginx -t                    # Проверка конфигурации
sudo tail -f /var/log/nginx/error.log  # Логи ошибок

# PM2
pm2 status                       # Статус приложений
pm2 logs                         # Все логи
pm2 restart all                  # Перезапуск всех
pm2 stop all                     # Остановка всех
pm2 monit                        # Мониторинг

# SSL (Let's Encrypt)
sudo certbot certificates        # Список сертификатов
sudo certbot renew              # Обновить сертификаты
sudo certbot delete             # Удалить сертификат

# Система
sudo systemctl status            # Общий статус системы
sudo netstat -tlnp              # Открытые порты
sudo ufw status                 # Статус firewall
```

---

## Дальнейшие шаги

После успешной настройки:

1. **Смените пароль администратора:**
   - Откройте: https://aimaqaqshamy.kz/admin
   - Войдите: admin@aimakakshamy.kz / admin123
   - Смените пароль

2. **Настройте автоматическое обновление:**
   - Создайте скрипт для `git pull` и перезапуска PM2

3. **Настройте мониторинг:**
   - Установите PM2 Plus для мониторинга
   - Настройте алерты

4. **Настройте бэкапы:**
   - База данных (PostgreSQL)
   - Загруженные файлы (/uploads)

---

**Последнее обновление:** 2025-12-10
**Версия:** 1.0 (для VPS без Plesk)
