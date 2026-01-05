# Упрощенная инструкция по получению Instagram Access Token

## Вариант 1: Через Graph API Explorer (быстро, но временно)

### Шаг 1: Откройте Graph API Explorer
https://developers.facebook.com/tools/explorer/2255248114985516/

### Шаг 2: Настройте разрешения

1. **Выберите приложение**: "AIMAK Auto Publisher" (уже выбрано)

2. **Добавьте разрешения** (кликните "Add a Permission"):
   - ✅ `instagram_basic`
   - ✅ `instagram_content_publish`
   - ✅ `pages_show_list` (ВАЖНО!)
   - ✅ `pages_read_engagement`

3. **Нажмите "Generate Access Token"**

4. **Авторизуйтесь** и выберите:
   - Ваш Facebook аккаунт
   - Page "AIMAK"
   - Разрешите все запрошенные доступы

### Шаг 3: Получите Instagram Business Account ID

В поле запроса введите:
```
me/accounts?fields=instagram_business_account,name
```

Нажмите "Submit" - вы получите:
```json
{
  "data": [
    {
      "instagram_business_account": {
        "id": "17841451299954292"
      },
      "name": "AIMAK",
      "id": "PAGE_ID"
    }
  ]
}
```

Сохраните этот Instagram ID: `17841451299954292`

### Шаг 4: Протестируйте токен

В поле запроса введите:
```
17841451299954292?fields=id,username,name
```

Если вернулся JSON с данными - **ТОКЕН РАБОТАЕТ!** ✅

Если "Access denied" - приложение в Development Mode, нужен App Review.

### Шаг 5: Создайте долгосрочный токен

Краткосрочный токен из Explorer живет ~1-2 часа. Создадим долгосрочный (60 дней):

```bash
curl -X GET "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=2255248114985516&client_secret=9b6beabfd5386fd60a907713927962d5&fb_exchange_token=SHORT_TOKEN"
```

Замените `SHORT_TOKEN` на токен из Explorer.

Ответ:
```json
{
  "access_token": "LONG_LIVED_TOKEN",
  "token_type": "bearer",
  "expires_in": 5184000
}
```

Используйте `LONG_LIVED_TOKEN` в админ-панели AIMAK.

---

## Вариант 2: Если токен не работает (Development Mode)

**Симптомы:**
- "Access denied" при запросах к Instagram
- "Object does not exist" при создании media container

**Причина:**
Приложение в Development Mode - Instagram API недоступно без App Review.

**Решение:**
Следуйте инструкции в `FACEBOOK_APP_REVIEW_GUIDE.md` для перевода в Live Mode.

---

## Автоматическое обновление токена

Токены истекают через 60 дней. Для автоматизации добавьте в cron:

```bash
# Обновлять токен каждые 50 дней
0 0 */50 * * /path/to/refresh-token.sh
```

Скрипт `refresh-token.sh`:
```bash
#!/bin/bash
CURRENT_TOKEN="получить из БД"
NEW_TOKEN=$(curl -s "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=2255248114985516&client_secret=9b6beabfd5386fd60a907713927962d5&fb_exchange_token=${CURRENT_TOKEN}" | jq -r '.access_token')

# Обновить в БД через API админки
curl -X PATCH "https://aimaqaqshamy.kz/api/social-media/instagram" \
  -H "Content-Type: application/json" \
  -d "{\"accessToken\": \"${NEW_TOKEN}\"}"
```

---

## Лимиты Instagram API (из инструкции Grok)

- **Публикации**: Максимум 100 в день
- **Медиа**: Обязательно изображение/видео (чистый текст не поддерживается)
- **Размер изображения**: Минимум 320x320, максимум 8MB
- **Формат**: JPG, PNG
- **Caption**: Максимум 2200 символов
- **URL в caption**: Только первый URL станет кликабельным

---

## Тестирование

После получения токена:

1. **Сохраните в админке**: https://aimaqaqshamy.kz/admin/settings/social-media
2. **Опубликуйте статью**
3. **Проверьте логи**: `pm2 logs api --lines 50`
4. **Проверьте Instagram**: https://instagram.com/aimaqaqshamy.kz

Если работает - поздравляю! 🎉

Если ошибка - смотрите Вариант 2 (App Review).
