# Scripts / Скрипты

Служебные скрипты для развертывания, настройки и обслуживания Smart CMS.

## Структура папки

```
scripts/
├── README.md               # Этот файл
├── setup-env.sh            # Интерактивная настройка окружения
├── deploy/                 # Скрипты развертывания
│   ├── quickstart.sh       # Быстрая установка PS.kz
│   ├── vps-install.sh      # Установка на VPS
│   ├── plesk-deploy.sh     # Развертывание на Plesk
│   └── remote-install.sh   # Удаленная установка
├── setup/                  # Скрипты настройки
│   ├── nginx-setup.sh      # Настройка Nginx
│   └── setup-vps-nginx.sh  # Настройка Nginx на VPS
├── maintenance/            # Скрипты обслуживания
│   ├── fix-pm2.sh          # Исправление PM2
│   └── diagnose-domain.sh  # Диагностика домена
├── import/                 # Скрипты импорта
│   └── windows/            # PowerShell скрипты
│       ├── import-wordpress.ps1
│       └── quick-import.ps1
├── scraper/                # Скрипты парсинга
│   └── (Python скрипты)
├── update-render-env.sh    # Обновление переменных Render
└── update-render-env.js    # Node.js версия
```

---

## Deploy Scripts / Скрипты развертывания

### quickstart.sh

Автоматическая установка на PS.kz хостинг.

```bash
# На сервере PS.kz
cd /var/www/vhosts/yourdomain.kz/httpdocs
bash scripts/deploy/quickstart.sh
```

### vps-install.sh

Установка на чистый VPS (Ubuntu/Debian).

```bash
# На VPS
git clone https://github.com/m34959203/Smart-CMS-.git
cd Smart-CMS-
bash scripts/deploy/vps-install.sh
```

### plesk-deploy.sh

Развертывание через Plesk панель.

```bash
bash scripts/deploy/plesk-deploy.sh
```

---

## Setup Scripts / Скрипты настройки

### setup-env.sh

Интерактивная настройка переменных окружения.

```bash
./scripts/setup-env.sh
```

Скрипт поможет:
- Создать .env файлы из примеров
- Настроить API ключи для AI (Gemini/OpenRouter)
- Получить пошаговые инструкции

### setup-vps-nginx.sh

Автоматическая настройка Nginx для VPS.

```bash
sudo bash scripts/setup/setup-vps-nginx.sh yourdomain.kz
```

---

## Maintenance Scripts / Скрипты обслуживания

### fix-pm2.sh

Исправление проблем с PM2.

```bash
bash scripts/maintenance/fix-pm2.sh
```

### diagnose-domain.sh

Диагностика проблем с доменом.

```bash
bash scripts/maintenance/diagnose-domain.sh yourdomain.kz
```

---

## Import Scripts / Скрипты импорта

### Windows (PowerShell)

```powershell
# Импорт из WordPress
.\scripts\import\windows\import-wordpress.ps1

# Быстрый импорт
.\scripts\import\windows\quick-import.ps1
```

---

## Render Environment Update

### update-render-env.sh

Bash скрипт для обновления переменных окружения в Render.

```bash
export RENDER_API_KEY="your-render-api-key"
export SERVICE_ID="srv-your-service-id"
./scripts/update-render-env.sh
```

### update-render-env.js

Node.js версия.

```bash
RENDER_API_KEY="your-key" SERVICE_ID="srv-id" node scripts/update-render-env.js
```

---

## Требования

| Скрипт | Требования |
|--------|------------|
| Bash скрипты | Bash 4.0+, curl |
| Node.js скрипты | Node.js 18+ |
| PowerShell | Windows PowerShell 5.1+ |

---

## Безопасность

- Никогда не коммитьте API ключи в git
- Используйте переменные окружения
- После использования очистите историю: `history -c`

---

## Связанная документация

- [Deployment Guide](../docs/deployment/README.md)
- [Environment Variables](../docs/deployment/ENVIRONMENT.md)
- [VPS Setup](../docs/deployment/VPS_SETUP.md)
- [Plesk Setup](../docs/deployment/PLESK.md)
