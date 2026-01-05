# Подробная инструкция по прохождению Facebook App Review для Instagram API

## Обзор процесса

**Время проверки**: 3-7 рабочих дней
**Шанс одобрения**: Высокий при правильной подготовке
**Стоимость**: Бесплатно

## Этап 1: Подготовка приложения (1-2 часа)

### Шаг 1.1: Заполнить основную информацию приложения

1. **Откройте настройки приложения**:
   https://developers.facebook.com/apps/2255248114985516/settings/basic/

2. **Заполните обязательные поля**:

   **App Domains** (Домены приложения):
   ```
   aimaqaqshamy.kz
   ```

   **Privacy Policy URL** (Политика конфиденциальности):
   ```
   https://aimaqaqshamy.kz/privacy
   ```
   ⚠️ **ВАЖНО**: Эта страница должна существовать! Создадим её позже.

   **Terms of Service URL** (Условия использования):
   ```
   https://aimaqaqshamy.kz/terms
   ```
   ⚠️ **ВАЖНО**: Эта страница должна существовать! Создадим её позже.

   **App Icon** (Иконка приложения):
   - Размер: 1024x1024 пикселей
   - Формат: PNG или JPG
   - Используйте логотип AIMAK

   **Category** (Категория):
   - Выберите: **Business and Pages** или **News**

   **Business Use** (Использование для бизнеса):
   - Выберите: **Yourself or your own business**

3. **Сохраните изменения**

### Шаг 1.2: Создать Privacy Policy и Terms of Service

Создадим 2 страницы на сайте AIMAK:

**A) Privacy Policy (Политика конфиденциальности)**

Создайте страницу `/privacy` с примерно таким содержанием:

```markdown
# Политика конфиденциальности AIMAK Auto Publisher

Последнее обновление: 18 декабря 2025 г.

## Какие данные мы собираем

AIMAK Auto Publisher - это приложение для автоматической публикации новостей с сайта
aimaqaqshamy.kz в социальные сети (Telegram и Instagram).

Мы собираем и обрабатываем следующие данные:

1. **Данные Facebook Page**:
   - ID страницы
   - Название страницы
   - Access Token для публикации

2. **Данные Instagram Business Account**:
   - ID Instagram аккаунта
   - Username Instagram
   - Access Token для публикации

3. **Публикуемый контент**:
   - Заголовки статей
   - Изображения статей
   - Текст анонсов
   - Ссылки на полные статьи

## Как мы используем данные

Мы используем собранные данные только для:
- Автоматической публикации новостных статей в ваш Instagram аккаунт
- Автоматической публикации новостных статей в ваш Telegram канал

Мы НЕ:
- Не передаем ваши данные третьим лицам
- Не продаем ваши данные
- Не используем данные для рекламы
- Не храним данные дольше, чем необходимо

## Какие разрешения мы запрашиваем

### Instagram API разрешения:

- `instagram_basic` - для доступа к базовой информации вашего Instagram аккаунта
- `instagram_content_publish` - для публикации контента в ваш Instagram
- `pages_show_list` - для получения списка ваших Facebook Pages
- `pages_read_engagement` - для чтения данных о вовлеченности

## Хранение данных

- Access Tokens хранятся в зашифрованном виде в защищенной базе данных
- Данные публикаций хранятся локально на вашем сервере
- Мы не храним историю ваших постов после публикации

## Удаление данных

Вы можете в любой момент:
1. Удалить Access Token из настроек приложения
2. Отозвать разрешения приложения в настройках Facebook
3. Запросить полное удаление данных по email: admin@aimaqaqshamy.kz

## Безопасность

Мы применяем industry-standard меры безопасности:
- HTTPS шифрование
- Защищенное хранилище токенов
- Регулярные обновления безопасности

## Контакты

По вопросам конфиденциальности:
Email: admin@aimaqaqshamy.kz
Сайт: https://aimaqaqshamy.kz

## Изменения политики

Мы можем обновлять эту политику. Изменения вступают в силу после публикации
обновленной версии на этой странице.
```

**B) Terms of Service (Условия использования)**

Создайте страницу `/terms` с примерно таким содержанием:

```markdown
# Условия использования AIMAK Auto Publisher

Последнее обновление: 18 декабря 2025 г.

## Принятие условий

Используя AIMAK Auto Publisher, вы соглашаетесь с этими условиями.

## Описание сервиса

AIMAK Auto Publisher - это инструмент для автоматической публикации новостных
статей с сайта aimaqaqshamy.kz в социальные сети.

## Использование сервиса

### Вы соглашаетесь:
- Использовать сервис только для публикации новостного контента
- Не публиковать запрещенный или незаконный контент
- Соблюдать правила платформ Instagram и Telegram
- Использовать только свои собственные аккаунты

### Вы НЕ можете:
- Использовать сервис для спама
- Публиковать чужой контент без разрешения
- Нарушать авторские права
- Использовать сервис для незаконной деятельности

## Ограничения

Сервис предоставляется "как есть":
- Мы не гарантируем 100% доступность
- Мы можем временно приостановить сервис для обслуживания
- Мы не несем ответственности за ошибки публикации

## Ответственность

Вы несете полную ответственность за:
- Контент, который публикуете
- Соблюдение законов вашей страны
- Соблюдение правил социальных платформ

## Прекращение использования

Вы можете прекратить использование сервиса в любой момент:
1. Удалив Access Token из настроек
2. Отозвав разрешения в Facebook

Мы можем прекратить предоставление сервиса:
- При нарушении этих условий
- По техническим причинам

## Изменения условий

Мы можем обновлять эти условия. Продолжение использования сервиса после
изменений означает принятие новых условий.

## Контакты

Email: admin@aimaqaqshamy.kz
Сайт: https://aimaqaqshamy.kz
```

### Шаг 1.3: Создать страницы Privacy и Terms на сайте

Я помогу создать эти страницы в вашем Next.js приложении.

<details>
<summary>Код для создания страниц (кликните чтобы развернуть)</summary>

Создайте файл `apps/web/src/app/privacy/page.tsx`:

```typescript
export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-6">Политика конфиденциальности</h1>

      <div className="prose prose-lg max-w-none">
        <p className="text-gray-600 mb-8">Последнее обновление: 18 декабря 2025 г.</p>

        <h2>Какие данные мы собираем</h2>
        <p>AIMAK Auto Publisher - это приложение для автоматической публикации новостей...</p>

        {/* Остальной контент из шаблона выше */}
      </div>
    </div>
  );
}
```

Создайте файл `apps/web/src/app/terms/page.tsx` аналогично.

</details>

### Шаг 1.4: Подготовить демо-видео

Facebook требует видео-демонстрацию использования разрешений.

**Требования к видео**:
- Длительность: 1-5 минут
- Формат: MP4, MOV, AVI
- Качество: HD (1280x720 или выше)
- Размер: до 50 MB
- Язык: Английский или с английскими субтитрами

**Что показать в видео**:

1. **Вступление (10 сек)**:
   - "This is AIMAK Auto Publisher application"
   - "It automatically publishes news articles to Instagram"

2. **Показать вход в систему (20 сек)**:
   - Откройте https://aimaqaqshamy.kz/admin
   - Войдите в админ-панель

3. **Показать настройки Instagram (30 сек)**:
   - Откройте Settings → Social Media → Instagram
   - Покажите поля Access Token и Instagram Account ID
   - Объясните: "Here admin enters Instagram API credentials"

4. **Показать создание статьи (1 мин)**:
   - Создайте/отредактируйте статью
   - Добавьте заголовок, текст, изображение
   - Нажмите "Опубликовать"
   - Объясните: "When article is published, it automatically posts to Instagram"

5. **Показать результат в Instagram (30 сек)**:
   - Откройте Instagram @aimaqaqshamy.kz
   - Покажите опубликованный пост
   - Объясните: "Here is the automatically published post"

6. **Показать логи (опционально, 20 сек)**:
   - Покажите логи публикации
   - Объясните: "Application logs show successful publication"

**Инструменты для записи**:
- Windows: OBS Studio, Xbox Game Bar
- Mac: QuickTime, ScreenFlow
- Linux: SimpleScreenRecorder, OBS Studio

**Пример скрипта для озвучки**:

```
Hello, I'm demonstrating AIMAK Auto Publisher application.

This application automatically publishes news articles from aimaqaqshamy.kz website
to Instagram Business account.

First, let me show you the admin panel where we manage social media integrations.
[Показать админ-панель]

Here in Social Media settings, we have Instagram section.
[Открыть настройки Instagram]

The admin enters Instagram API Access Token and Business Account ID here.
These credentials are used to publish content via Instagram Graph API.

Now let me create a news article.
[Создать статью с заголовком, текстом и изображением]

When I click Publish, the article is automatically posted to Instagram.
[Нажать Publish]

Let's check Instagram account to see the result.
[Открыть Instagram, показать пост]

Here you can see the post was successfully published with the article image and caption.

This is how AIMAK Auto Publisher uses Instagram API to automate news distribution.

Thank you.
```

## Этап 2: Запрос разрешений (30 минут)

### Шаг 2.1: Перейти в App Review

1. Откройте: https://developers.facebook.com/apps/2255248114985516/app-review/

2. Нажмите **"Request"** или **"Permissions and Features"**

### Шаг 2.2: Добавить разрешения для проверки

Нажмите **"Add Items"** и выберите:

1. **instagram_basic**
   - Назначение: "Get basic Instagram account information"

2. **instagram_content_publish**
   - Назначение: "Publish posts to Instagram"

3. **pages_show_list**
   - Назначение: "Get list of Facebook Pages"

4. **pages_read_engagement**
   - Назначение: "Read Page engagement data"

### Шаг 2.3: Заполнить форму для каждого разрешения

Для каждого разрешения нужно заполнить:

#### A) instagram_basic

**"Tell us how your app uses this permission"** (Как приложение использует разрешение):

```
Our news website (aimaqaqshamy.kz) uses instagram_basic permission to:

1. Verify that the connected Instagram account is a Business account
2. Get basic profile information (username, account ID) to confirm the correct
   account is connected
3. Display the connected account information in the admin settings panel

This permission is required as a prerequisite for instagram_content_publish permission.

Use case: When admin configures Instagram integration in our CMS, we need to verify
the Business account details before allowing automatic post publishing.
```

**"Upload a screen recording"** (Загрузить видео):
- Загрузите подготовленное демо-видео

**"Give us step-by-step instructions"** (Пошаговые инструкции):

```
Step-by-step instructions to test instagram_basic permission:

1. Login to admin panel at https://aimaqaqshamy.kz/admin
   Test credentials will be provided to reviewers

2. Navigate to Settings → Social Media Settings → Instagram tab

3. Click "Connect Instagram Account" button

4. Authenticate with Facebook and select Instagram Business account

5. App uses instagram_basic permission to:
   - Get Instagram account ID
   - Get username
   - Verify it's a Business account

6. Account information is displayed in the settings panel

7. This verifies the correct account is connected before enabling auto-publishing

Note: This permission is used only during initial setup and for displaying
current connection status.
```

#### B) instagram_content_publish

**"Tell us how your app uses this permission"**:

```
Our news website (aimaqaqshamy.kz) uses instagram_content_publish permission to:

1. Automatically publish news articles from our CMS to Instagram Business account
2. Share article images and captions with our audience on Instagram
3. Provide seamless multi-channel news distribution to our readers

Use case: When a journalist publishes a news article on our website, the system
automatically creates an Instagram post with:
- Article cover image
- Article title and summary as caption
- Link back to full article on website

This eliminates manual work of posting the same content to multiple platforms and
ensures our Instagram audience gets timely news updates.
```

**"Upload a screen recording"**:
- Используйте то же демо-видео

**"Give us step-by-step instructions"**:

```
Step-by-step instructions to test instagram_content_publish permission:

1. Login to admin panel: https://aimaqaqshamy.kz/admin
   (Test credentials will be provided)

2. Go to Articles section

3. Click "Create New Article" or edit existing article

4. Fill in article details:
   - Title: "Test News Article"
   - Content: News article text
   - Cover Image: Upload an image
   - Category: Select category

5. Enable "Publish to Instagram" checkbox (enabled by default)

6. Click "Publish" button

7. System automatically:
   - Creates Instagram media container using the article image
   - Adds caption with article title and link
   - Publishes to Instagram using instagram_content_publish permission

8. View published post on Instagram: @aimaqaqshamy.kz

9. Check application logs to verify successful publication

Expected result: Article appears as new post on Instagram Business account
with image and caption matching the article.
```

#### C) pages_show_list

**"Tell us how your app uses this permission"**:

```
We use pages_show_list permission to:

1. Display a list of Facebook Pages that admin has access to
2. Allow admin to select which Page is connected to their Instagram account
3. Verify the Page-Instagram connection before enabling auto-publishing

This is required because Instagram Business accounts must be linked to a
Facebook Page, and we need to identify the correct Page to get the Instagram
account association.

Use case: During Instagram integration setup, we fetch admin's Pages list to
show which Pages have Instagram accounts connected, allowing them to select
the correct one.
```

#### D) pages_read_engagement

**"Tell us how your app uses this permission"**:

```
We use pages_read_engagement permission to:

1. Read basic engagement data from the Facebook Page linked to Instagram account
2. Verify the Page is active and accessible
3. Ensure the Page-Instagram connection is properly configured

This permission helps us validate the setup and provide better error messages
if there are configuration issues.

Use case: When admin connects Instagram, we verify the associated Facebook Page
is accessible and properly linked to Instagram Business account.
```

### Шаг 2.4: Добавить Test Users (Тестовые пользователи)

Facebook нужны тестовые учетные данные для проверки.

1. **Перейдите в Roles → Test Users**:
   https://developers.facebook.com/apps/2255248114985516/roles/test-users/

2. **Или используйте реальные данные**:
   - В форме App Review есть поле **"Test User Credentials"**
   - Создайте временного пользователя админ-панели для проверяющих:

```
URL: https://aimaqaqshamy.kz/admin
Username: reviewer@facebook.test
Password: ReviewTest2025!
```

⚠️ **ВАЖНО**: Создайте этого пользователя перед отправкой на проверку!

### Шаг 2.5: Написать примечания для проверяющих

В поле **"Notes for Reviewers"** напишите:

```
Dear Facebook Review Team,

Thank you for reviewing our application.

APPLICATION PURPOSE:
AIMAK Auto Publisher is a content management system for aimaqaqshamy.kz news website.
It automatically publishes news articles to social media platforms (Instagram and Telegram).

TEST CREDENTIALS:
Admin Panel URL: https://aimaqaqshamy.kz/admin
Test Username: reviewer@facebook.test
Test Password: ReviewTest2025!

INSTAGRAM ACCOUNT FOR TESTING:
@aimaqaqshamy.kz - This is our production Instagram Business account

HOW TO TEST:
1. Login to admin panel with provided credentials
2. Navigate to Settings → Social Media → Instagram
3. Instagram is already configured (you'll see Account ID and Token fields)
4. Go to Articles section
5. Create or edit any article
6. Click Publish button
7. Article will auto-post to @aimaqaqshamy.kz Instagram

PERMISSIONS USAGE:
- instagram_basic: Get account info during setup
- instagram_content_publish: Auto-publish news articles
- pages_show_list: List Facebook Pages during setup
- pages_read_engagement: Verify Page configuration

VIDEO DEMONSTRATION:
The uploaded video shows the complete flow from creating an article
to automatic Instagram publication.

PRIVACY & TERMS:
Privacy Policy: https://aimaqaqshamy.kz/privacy
Terms of Service: https://aimaqaqshamy.kz/terms

Please let us know if you need any additional information.

Best regards,
AIMAK Development Team
```

## Этап 3: Отправка на проверку

### Шаг 3.1: Финальная проверка

Перед отправкой убедитесь:

- ✅ Privacy Policy доступна по ссылке
- ✅ Terms of Service доступны по ссылке
- ✅ App Icon загружена
- ✅ Демо-видео загружено
- ✅ Все разрешения добавлены
- ✅ Инструкции заполнены для каждого разрешения
- ✅ Тестовый пользователь создан и работает
- ✅ Instagram интеграция настроена
- ✅ Примечания для проверяющих заполнены

### Шаг 3.2: Отправить на проверку

1. Нажмите **"Submit for Review"** (Отправить на проверку)

2. Подтвердите отправку

3. Дождитесь email подтверждения

## Этап 4: Ожидание результатов (3-7 дней)

### Что происходит во время проверки

1. **Day 1-2**: Facebook получает заявку и назначает проверяющего
2. **Day 2-5**: Проверяющий тестирует приложение
3. **Day 5-7**: Принимается решение и отправляется уведомление

### Возможные результаты

#### ✅ APPROVED (Одобрено)

Email notification:
```
Your permissions have been approved!
You can now use these permissions in Live mode.
```

**Что делать дальше**:
1. Переключите App Mode на "Live"
2. Создайте новый Access Token в Graph API Explorer
3. Обновите токен в админ-панели AIMAK
4. Тестируйте публикацию в Instagram!

#### ❌ REJECTED (Отклонено)

Email содержит причины отклонения.

**Частые причины отклонения**:
1. Видео недостаточно подробное
2. Privacy Policy неполная
3. Инструкции неясные
4. Тестовые данные не работают
5. Приложение не соответствует use case

**Что делать**:
1. Прочитайте причины отклонения
2. Исправьте указанные проблемы
3. Обновите заявку
4. Отправьте повторно (можно сразу)

#### ⚠️ MORE INFO NEEDED (Нужна доп. информация)

Facebook может запросить:
- Дополнительные скриншоты
- Более подробное видео
- Разъяснения по использованию
- Дополнительную документацию

**Что делать**:
1. Ответьте на вопросы в течение 7 дней
2. Предоставьте запрошенную информацию
3. Проверка продолжится

## Этап 5: После одобрения

### Шаг 5.1: Переключить в Live Mode

1. **Откройте настройки приложения**:
   https://developers.facebook.com/apps/2255248114985516/settings/basic/

2. **Найдите переключатель App Mode** вверху страницы

3. **Переключите с "Development" на "Live"**

4. **Подтвердите переключение**

### Шаг 5.2: Получить новый Access Token

После переключения в Live Mode токены из Development Mode перестают работать.

1. **Откройте Graph API Explorer**:
   https://developers.facebook.com/tools/explorer/

2. **Выберите ваше приложение** "AIMAK Auto Publisher"

3. **Добавьте разрешения**:
   - instagram_basic
   - instagram_content_publish

4. **Нажмите "Generate Access Token"**

5. **Выберите Page AIMAK**

6. **Скопируйте токен**

### Шаг 5.3: Получить Long-Lived Token (Долгосрочный токен)

Токен из Graph API Explorer действует 1-2 часа. Для продакшена нужен долгосрочный (60 дней).

```bash
# Обменять краткосрочный токен на долгосрочный
curl -X GET "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=2255248114985516&client_secret=9b6beabfd5386fd60a907713927962d5&fb_exchange_token=YOUR_SHORT_TOKEN"
```

Или используйте Access Token Debugger:
https://developers.facebook.com/tools/debug/accesstoken/

### Шаг 5.4: Обновить настройки в AIMAK

1. **Откройте админ-панель**: https://aimaqaqshamy.kz/admin/settings/social-media

2. **Перейдите на вкладку Instagram**

3. **Введите**:
   - Access Token: (долгосрочный токен)
   - Instagram Business Account ID: 17841451299954292

4. **Включите** "Включить публикацию в Instagram"

5. **Сохраните**

### Шаг 5.5: Тестирование

1. Создайте/отредактируйте статью
2. Нажмите "Опубликовать"
3. Проверьте логи: `pm2 logs api --lines 50`
4. Проверьте Instagram: https://instagram.com/aimaqaqshamy.kz

Если все работает - **поздравляю! Instagram автопубликация настроена!** 🎉

## Частые вопросы (FAQ)

### Q: Сколько стоит App Review?
A: Бесплатно. Meta не взимает плату за проверку приложений.

### Q: Сколько раз можно подавать заявку?
A: Неограниченно. Если отклонили - исправьте и подайте снова.

### Q: Можно ли ускорить проверку?
A: Нет официального способа. Обычно занимает 3-7 дней.

### Q: Что если не одобрят?
A: Прочитайте причины, исправьте и подайте повторно.

### Q: Нужно ли продлевать токены?
A: Да, долгосрочные токены действуют 60 дней. Настройте автоматическое обновление или обновляйте вручную каждые 2 месяца.

### Q: Можно ли тестировать во время проверки?
A: Да, в Development Mode все продолжает работать для тестовых пользователей.

### Q: Что делать если токен истек?
A: Создайте новый токен в Graph API Explorer и обновите в настройках AIMAK.

## Полезные ссылки

- **App Review Documentation**: https://developers.facebook.com/docs/app-review
- **Instagram API Documentation**: https://developers.facebook.com/docs/instagram-api
- **Support**: https://developers.facebook.com/support/bugs/

---

**Следующий шаг**: Начните с Этапа 1 - создайте страницы Privacy и Terms!

Удачи с прохождением App Review! 🚀
