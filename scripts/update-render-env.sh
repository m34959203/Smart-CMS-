#!/bin/bash

# ==========================================
# Скрипт для обновления переменных окружения в Render
# ==========================================
# Использование:
#   1. Получите API ключ Render: https://dashboard.render.com/account/settings
#   2. Найдите Service ID: https://dashboard.render.com/web/<YOUR_SERVICE_ID>
#   3. Запустите: RENDER_API_KEY=<ключ> SERVICE_ID=<service_id> ./scripts/update-render-env.sh
# ==========================================

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Проверка обязательных переменных
if [ -z "$RENDER_API_KEY" ]; then
    echo -e "${RED}Ошибка: Не установлена переменная RENDER_API_KEY${NC}"
    echo "Получите API ключ: https://dashboard.render.com/account/settings"
    echo "Затем запустите: RENDER_API_KEY=<ваш_ключ> SERVICE_ID=<service_id> $0"
    exit 1
fi

if [ -z "$SERVICE_ID" ]; then
    echo -e "${RED}Ошибка: Не установлена переменная SERVICE_ID${NC}"
    echo "Найдите Service ID в URL: https://dashboard.render.com/web/<YOUR_SERVICE_ID>"
    echo "Затем запустите: RENDER_API_KEY=<ваш_ключ> SERVICE_ID=<service_id> $0"
    exit 1
fi

# API endpoint
API_URL="https://api.render.com/v1/services/$SERVICE_ID/env-vars"

echo -e "${YELLOW}==================================================${NC}"
echo -e "${YELLOW}  Обновление переменных окружения Render${NC}"
echo -e "${YELLOW}==================================================${NC}"
echo ""
echo "Service ID: $SERVICE_ID"
echo ""

# Новые значения переменных
NEW_GEMINI_KEY="${NEW_GEMINI_KEY:-AIzaSyAkB14IdkDF6KwtZ3aVtpIhGRBU68wdDIs}"
NEW_OPENROUTER_MODEL="${NEW_OPENROUTER_MODEL:-meta-llama/llama-3.2-3b-instruct:free}"

echo -e "${YELLOW}Переменные для обновления:${NC}"
echo "  GEMINI_API_KEY: ${NEW_GEMINI_KEY:0:20}..."
echo "  OPENROUTER_MODEL: $NEW_OPENROUTER_MODEL"
echo ""

# Функция для обновления переменной
update_env_var() {
    local key=$1
    local value=$2

    echo -n "Обновление $key... "

    response=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/$key" \
        -H "Authorization: Bearer $RENDER_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"value\": \"$value\"}")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ Ошибка (HTTP $http_code)${NC}"
        echo "Response: $body"
        return 1
    fi
}

# Обновляем переменные
update_env_var "GEMINI_API_KEY" "$NEW_GEMINI_KEY"
update_env_var "OPENROUTER_MODEL" "$NEW_OPENROUTER_MODEL"

echo ""
echo -e "${GREEN}==================================================${NC}"
echo -e "${GREEN}  Обновление завершено!${NC}"
echo -e "${GREEN}==================================================${NC}"
echo ""
echo -e "${YELLOW}Следующие шаги:${NC}"
echo "1. Render автоматически передеплоит сервис"
echo "2. Дождитесь завершения деплоя (~3-5 минут)"
echo "3. Проверьте логи: https://dashboard.render.com/web/$SERVICE_ID/logs"
echo "4. Проверьте переменные: https://dashboard.render.com/web/$SERVICE_ID/env"
echo ""
