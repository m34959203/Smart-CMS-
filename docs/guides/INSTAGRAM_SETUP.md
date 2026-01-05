# Instagram API Setup Guide

## Текущий статус

✅ **РАБОТАЕТ:**
- Telegram автопубликация с изображениями
- URL encoding для кириллических имен файлов
- Retry логика и fallback механизмы

❌ **НЕ РАБОТАЕТ:**
- Instagram автопубликация (требует дополнительной настройки Facebook App)

## Проблема

Instagram API требует:
1. **Live Mode** приложения (требует прохождения App Review от Meta)
2. **ИЛИ** правильный Page Access Token с разрешениями

Текущая ошибка:
```
Unsupported post request. Object with ID '17841451299954292' does not exist,
cannot be loaded due to missing permissions
```

## Что уже настроено

1. ✅ Facebook Page "AIMAK" создана
2. ✅ Instagram Business Account @aimaqaqshamy.kz привязан к Page
3. ✅ Instagram Graph API добавлен в приложение
4. ✅ Instagram аккаунт добавлен как тестировщик
5. ✅ Код для Instagram публикации готов в `apps/api/src/social-media/instagram.service.ts`

## Данные для настройки

- **Facebook App ID**: `2255248114985516`
- **Facebook App Secret**: `9b6beabfd5386fd60a907713927962d5`
- **Instagram Business Account ID**: `17841451299954292`
- **Instagram Username**: `@aimaqaqshamy.kz`

## Решение #1: App Review (Рекомендуется для продакшена)

### Шаги:

1. **Подготовьте приложение для проверки**:
   - Заполните Privacy Policy URL
   - Заполните Terms of Service URL
   - Добавьте описание приложения
   - Добавьте скриншоты функционала

2. **Запросите разрешения**:
   - Перейдите в https://developers.facebook.com/apps/2255248114985516/app-review/
   - Запросите разрешения:
     - `instagram_basic`
     - `instagram_content_publish`
     - `pages_show_list`
     - `pages_read_engagement`

3. **Предоставьте видео демонстрацию**:
   - Покажите как ваше приложение публикует контент в Instagram
   - Объясните зачем нужны разрешения

4. **Отправьте на проверку**:
   - Нажмите "Submit for Review"
   - Дождитесь одобрения (обычно 3-5 рабочих дней)

5. **После одобрения**:
   - Переключите App Mode на "Live"
   - Создайте новый Access Token
   - Обновите токен в админ-панели AIMAK

## Решение #2: Использовать сторонний сервис (Быстрое решение)

Альтернативные сервисы для Instagram автопубликации:

1. **Buffer** (https://buffer.com/)
   - Поддерживает Instagram Business
   - API для автоматизации
   - $15/месяц за базовый план

2. **Hootsuite** (https://hootsuite.com/)
   - Профессиональный инструмент
   - API доступ
   - От $99/месяц

3. **Later** (https://later.com/)
   - Специализируется на Instagram
   - API для разработчиков
   - От $25/месяц

## Решение #3: Продолжить в Development Mode (Временное)

Если нужно протестировать функционал до App Review:

1. **Получите правильный Page Access Token**:
   ```bash
   # Используйте помощник по интеграции
   https://developers.facebook.com/apps/2255248114985516/use_cases/customize/?use_case_enum=INSTAGRAM_BUSINESS&selected_tab=API-Integration-Helper
   ```

2. **В разделе "Сгенерируйте маркеры доступа"**:
   - Нажмите "Добавить аккаунт"
   - Авторизуйтесь и выберите Page AIMAK
   - Скопируйте **User Access Token** (будет показан на странице)

3. **Обновите настройки**:
   - Откройте https://aimaqaqshamy.kz/admin/settings/social-media
   - Вкладка Instagram
   - Вставьте новый токен
   - Instagram Business Account ID: `17841451299954292`
   - Сохраните

4. **Тестируйте**:
   - Опубликуйте статью
   - Проверьте логи: `pm2 logs api --lines 50`
   - Если ошибка "missing permissions" - нужен App Review

## Техническая информация

### Файлы кода:

- `apps/api/src/social-media/instagram.service.ts` - Instagram API сервис
- `apps/api/src/social-media/social-media.service.ts` - Оркестрация публикаций
- `apps/web/src/app/admin/settings/social-media/page.tsx` - UI настроек

### Процесс публикации:

1. Создание media container:
   ```typescript
   POST https://graph.facebook.com/v21.0/{ig-account-id}/media
   {
     image_url: "https://aimaqaqshamy.kz/uploads/image.jpg",
     caption: "Текст поста"
   }
   ```

2. Публикация контейнера:
   ```typescript
   POST https://graph.facebook.com/v21.0/{ig-account-id}/media_publish
   {
     creation_id: {container-id}
   }
   ```

### Требования Instagram API:

- ✅ Instagram Business Account (у нас есть)
- ✅ Привязка к Facebook Page (настроена)
- ✅ Facebook Developer App (создано)
- ❌ App в Live Mode ИЛИ правильный токен (нужно сделать)

## Рекомендация

**Для продакшена**: Пройдите App Review (Решение #1)
**Для тестирования**: Используйте сторонний сервис (Решение #2)

**Время на App Review**: 3-7 рабочих дней
**Шанс одобрения**: Высокий, если правильно заполните заявку

## Контакты поддержки

- Facebook App Review: https://developers.facebook.com/support/
- Instagram API Docs: https://developers.facebook.com/docs/instagram-api/

---

**Последнее обновление**: 2025-12-18
**Статус**: Ожидает App Review для Live Mode
