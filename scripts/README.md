# Скрипты для управления Render

## update-render-env.sh

Bash скрипт для обновления переменных окружения в Render через API.

### Использование:

```bash
# Установите переменные окружения
export RENDER_API_KEY="your-render-api-key"
export SERVICE_ID="srv-your-service-id"

# Запустите скрипт
./scripts/update-render-env.sh
```

### Переопределение значений:

```bash
# Установите свои значения
export NEW_GEMINI_KEY="your-new-gemini-key"
export NEW_OPENROUTER_MODEL="your-model"

./scripts/update-render-env.sh
```

### Требования:

- curl
- bash 4.0+
- Render API key
- Service ID

## update-render-env.js

Node.js скрипт для обновления переменных окружения в Render через API.

### Использование:

```bash
# С переменными окружения
RENDER_API_KEY="your-key" SERVICE_ID="srv-id" node scripts/update-render-env.js

# Или с параметрами
node scripts/update-render-env.js srv-your-service-id your-render-api-key
```

### Переопределение значений:

```bash
NEW_GEMINI_KEY="your-key" \
NEW_OPENROUTER_MODEL="your-model" \
node scripts/update-render-env.js srv-id api-key
```

### Требования:

- Node.js 14+
- Render API key
- Service ID

## Получение необходимых данных

### Render API Key:

1. Откройте: https://dashboard.render.com/account/settings
2. Перейдите в раздел "API Keys"
3. Создайте новый ключ или скопируйте существующий

### Service ID:

1. Откройте ваш сервис в Dashboard
2. Service ID находится в URL: `https://dashboard.render.com/web/<YOUR_SERVICE_ID>`
3. Например: `srv-c1234567890abcdef`

## Что обновляется

По умолчанию скрипты обновляют:

- `GEMINI_API_KEY`: Новый ключ Google Gemini API
- `OPENROUTER_MODEL`: Модель для OpenRouter (`meta-llama/llama-3.2-3b-instruct:free`)

## Безопасность

- Никогда не коммитьте API ключи в git
- Используйте переменные окружения
- После использования очистите историю команд: `history -c`

## Альтернативы

### Render Dashboard (рекомендуется для новичков):

https://dashboard.render.com → Services → aimak-api → Environment

### Render CLI:

```bash
# Установка
npm install -g @render/cli

# Авторизация
render login

# Обновление
render env:set KEY="value" --service=aimak-api
```

## Troubleshooting

### Ошибка: Unauthorized (401)

Проверьте RENDER_API_KEY:
- Ключ должен быть актуальным
- Убедитесь, что нет лишних пробелов
- Проверьте права доступа

### Ошибка: Service not found (404)

Проверьте SERVICE_ID:
- ID должен начинаться с `srv-`
- Проверьте в Dashboard: URL сервиса
- Убедитесь, что у вас есть доступ к сервису

### Ошибка: Rate limit (429)

Слишком много запросов к Render API:
- Подождите 1 минуту
- Не запускайте скрипт параллельно

### Скрипт завершается без вывода

Проверьте права:
```bash
chmod +x scripts/update-render-env.sh
```

Проверьте bash:
```bash
bash --version  # Должна быть 4.0+
```

## Логи

Скрипты выводят детальную информацию:
- Зеленый ✓: Успешно
- Красный ✗: Ошибка
- Желтый: Информация

Пример успешного вывода:
```
==================================================
  Обновление переменных окружения Render
==================================================

Service ID: srv-c1234567890abcdef

Переменные для обновления:
  GEMINI_API_KEY: AIzaSyAkB14IdkDF6K...
  OPENROUTER_MODEL: meta-llama/llama-3.2-3b-instruct:free

Обновление GEMINI_API_KEY... ✓ OK
Обновление OPENROUTER_MODEL... ✓ OK

==================================================
  Обновление завершено!
==================================================
```

## Дополнительно

Для получения дополнительной информации см.:
- `/home/user/AIMAK/docs/RENDER_ENV_UPDATE.md` - Полная инструкция
- `/home/user/AIMAK/docs/AI_CATEGORIZATION_TROUBLESHOOTING.md` - Диагностика проблем
