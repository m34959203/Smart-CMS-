# Руководство по исправлению доступа к домену aimaqaqshamy.kz

## Проблема
Сайт доступен по IP-адресу (82.115.49.251), но **не доступен** по домену (aimaqaqshamy.kz).

## Возможные причины

### 1. DNS не настроен правильно
DNS-запись домена не указывает на IP-адрес сервера.

### 2. Отсутствует конфигурация Nginx в Plesk
Nginx-директивы не добавлены в панель Plesk, поэтому Plesk не знает, как маршрутизировать запросы к приложениям Node.js.

---

## Диагностика

### Шаг 1: Проверка DNS

Выполните эту команду с **любого компьютера** (не обязательно с сервера):

```bash
nslookup aimaqaqshamy.kz
```

**Ожидаемый результат:**
```
Server:  dns.server.com
Address:  x.x.x.x

Name:    aimaqaqshamy.kz
Address: 82.115.49.251
```

❌ **Если вы видите другой IP-адрес или ошибку:**
→ DNS настроен неправильно. **Перейдите к разделу "Решение 1: Настройка DNS"**

✅ **Если вы видите IP 82.115.49.251:**
→ DNS работает правильно. **Перейдите к разделу "Решение 2: Настройка Plesk"**

---

### Шаг 2: Проверка статуса PM2 на сервере

Подключитесь к серверу через SSH или Консоль VNC в Plesk и выполните:

```bash
pm2 status
```

**Ожидаемый результат:**
```
┌────┬──────────────┬─────────┬──────────┐
│ id │ name         │ status  │ cpu      │
├────┼──────────────┼─────────┼──────────┤
│ 0  │ aimak-api    │ online  │ 0%       │
│ 1  │ aimak-web    │ online  │ 0%       │
└────┴──────────────┴─────────┴──────────┘
```

❌ **Если статус "errored" или "stopped":**
→ PM2 не работает. **Перейдите к разделу "Решение 3: Перезапуск PM2"**

✅ **Если оба приложения "online":**
→ PM2 работает правильно. Продолжайте диагностику.

---

### Шаг 3: Тест локального подключения

На сервере выполните:

```bash
# Тест API
curl http://localhost:4000/api/health

# Тест Web
curl -I http://localhost:3000
```

**Ожидаемый результат:**
- API должен вернуть ответ (например, `{"status":"ok"}`)
- Web должен вернуть `HTTP/1.1 200 OK`

❌ **Если получаете ошибки:**
→ Приложения не работают. **Перейдите к разделу "Решение 3: Перезапуск PM2"**

---

### Шаг 4: Проверка SSL-сертификата

```bash
curl -I https://aimaqaqshamy.kz
```

❌ **Если получаете timeout или SSL error:**
→ SSL-сертификат не настроен. **Перейдите к разделу "Решение 4: SSL-сертификат"**

---

## Решения

## Решение 1: Настройка DNS

Если DNS не указывает на правильный IP-адрес:

### Вариант A: Использование панели управления регистратора

1. Войдите в панель управления вашего регистратора домена (где вы купили домен .kz)
2. Найдите настройки DNS для домена `aimaqaqshamy.kz`
3. Добавьте или измените **A-запись**:

| Тип | Имя | Значение        | TTL  |
|-----|-----|----------------|------|
| A   | @   | 82.115.49.251  | 3600 |
| A   | www | 82.115.49.251  | 3600 |

4. Сохраните изменения
5. Подождите 5-30 минут для распространения DNS
6. Повторите проверку: `nslookup aimaqaqshamy.kz`

### Вариант B: Использование Cloudflare (если используется)

1. Войдите в Cloudflare
2. Выберите домен `aimaqaqshamy.kz`
3. Перейдите в раздел **DNS**
4. Добавьте или измените записи:

| Тип | Имя            | Содержимое    | Прокси | TTL  |
|-----|----------------|---------------|--------|------|
| A   | aimaqaqshamy.kz| 82.115.49.251 | ❌     | Auto |
| A   | www            | 82.115.49.251 | ❌     | Auto |

⚠️ **ВАЖНО:** Отключите прокси (серый облако), иначе могут быть проблемы с WebSocket.

---

## Решение 2: Настройка Nginx в Plesk

Это **самая частая причина** проблемы при использовании Plesk!

### Шаги настройки:

1. **Войдите в Plesk:**
   - URL: https://82.115.49.251:8443 (или ваш URL Plesk)

2. **Перейдите к настройкам домена:**
   - Нажмите: **Websites & Domains** (Сайты и домены)
   - Найдите: **aimaqaqshamy.kz**
   - Нажмите: **Apache & nginx Settings** (Настройки Apache и nginx)

3. **Прокрутите вниз до раздела "Additional nginx directives"**

4. **Вставьте следующую конфигурацию:**

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

5. **Нажмите "OK"** для сохранения

6. **Подождите 10-30 секунд** для применения конфигурации

7. **Проверьте доступность:**
   ```bash
   curl -I https://aimaqaqshamy.kz
   ```

### Скриншоты пути в Plesk:

```
Plesk → Websites & Domains → aimaqaqshamy.kz → Apache & nginx Settings
                                                  ↓
                                    Scroll down to "Additional nginx directives"
```

---

## Решение 3: Перезапуск PM2

Если PM2 показывает статус "errored" или приложения не отвечают:

### Вариант A: Быстрое исправление (используйте готовый скрипт)

```bash
cd /var/www/vhosts/aimaqaqshamy.kz/httpdocs
sudo bash fix-pm2.sh
```

### Вариант B: Ручное исправление

```bash
# 1. Остановить все процессы
pm2 stop all

# 2. Удалить все процессы
pm2 delete all

# 3. Перейти в директорию проекта
cd /var/www/vhosts/aimaqaqshamy.kz/httpdocs

# 4. Переустановить зависимости (если нужно)
pnpm install --force

# 5. Сгенерировать Prisma Client
cd apps/api
pnpm prisma generate
cd ../..

# 6. Пересобрать приложения
pnpm --filter api build
pnpm --filter web build

# 7. Запустить PM2
pm2 start ecosystem.config.js

# 8. Сохранить конфигурацию PM2
pm2 save

# 9. Проверить статус
pm2 status
```

**Ожидаемый результат:**
```
┌────┬──────────────┬─────────┬──────────┐
│ id │ name         │ status  │ cpu      │
├────┼──────────────┼─────────┼──────────┤
│ 0  │ aimak-api    │ online  │ 0%       │
│ 1  │ aimak-web    │ online  │ 0%       │
└────┴──────────────┴─────────┴──────────┘
```

---

## Решение 4: Настройка SSL-сертификата

Если HTTPS не работает:

### Использование Let's Encrypt в Plesk:

1. **Войдите в Plesk**

2. **Перейдите к SSL/TLS:**
   - Нажмите: **Websites & Domains**
   - Найдите: **aimaqaqshamy.kz**
   - Нажмите: **SSL/TLS Certificates**

3. **Установите Let's Encrypt:**
   - Нажмите кнопку: **Install** (рядом с Let's Encrypt)
   - Выберите: **Include www subdomain** (включить поддомен www)
   - Установите галочку: **Assign the certificate to the domain**
   - Нажмите: **Get it free**

4. **Включите редирект на HTTPS:**
   - Вернитесь в **Hosting Settings** для домена
   - Включите: **Redirect from HTTP to HTTPS**
   - Нажмите: **OK**

5. **Проверьте:**
   ```bash
   curl -I https://aimaqaqshamy.kz
   ```

---

## Полная проверка после исправления

Выполните все команды по порядку:

```bash
# 1. DNS-проверка (с любого компьютера)
nslookup aimaqaqshamy.kz

# 2. Статус PM2 (на сервере)
pm2 status

# 3. Проверка локальных портов (на сервере)
curl http://localhost:4000/api/health
curl -I http://localhost:3000

# 4. Проверка HTTPS (с любого компьютера)
curl -I https://aimaqaqshamy.kz

# 5. Проверка в браузере
# Откройте: https://aimaqaqshamy.kz
```

---

## Логи для отладки

Если проблема не решена, проверьте логи:

```bash
# PM2 логи
pm2 logs --lines 50

# PM2 логи конкретного приложения
pm2 logs aimak-api --lines 50
pm2 logs aimak-web --lines 50

# Nginx логи (если есть доступ)
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Plesk логи (если есть доступ)
sudo tail -f /var/log/plesk/error.log
```

---

## Контакты для поддержки

Если проблема не решена:

1. **Скопируйте вывод всех команд диагностики**
2. **Сделайте скриншоты настроек Plesk**
3. **Сохраните логи PM2 и Nginx**
4. **Создайте issue на GitHub** с полной информацией

---

## Быстрая справка

| Проблема | Решение |
|----------|---------|
| DNS не указывает на IP | Решение 1: Настройка DNS |
| Сайт показывает 502 Gateway | Решение 2: Настройка Nginx в Plesk |
| PM2 показывает "errored" | Решение 3: Перезапуск PM2 |
| SSL/HTTPS не работает | Решение 4: Настройка SSL-сертификата |

---

**Последнее обновление:** 2025-12-10
