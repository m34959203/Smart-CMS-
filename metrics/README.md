# Метрики и скриншоты для Pitch Deck

Эта папка предназначена для хранения визуальных материалов для презентации Astana Hub ScaleUp.

## Необходимые скриншоты

### 1. Главная страница сайта
- **Файл:** `homepage-kz.png` и `homepage-ru.png`
- **Источник:** https://aimaqaqshamy.kz/kz и https://aimaqaqshamy.kz/ru
- **Что показать:** Двуязычный интерфейс, категории, последние статьи

### 2. Админ-панель
- **Файл:** `admin-dashboard.png`
- **Источник:** Локальная разработка или production
- **Что показать:** Общий вид админки с метриками

### 3. Редактор статей
- **Файл:** `article-editor.png`
- **Что показать:** TipTap WYSIWYG редактор с AI-переводом

### 4. Социальные сети
- **Файл:** `social-media-integration.png`
- **Что показать:** Настройки публикации в Telegram/Instagram

### 5. Рекламная система
- **Файл:** `advertising-management.png`
- **Что показать:** Управление рекламными блоками

### 6. PDF-журнал
- **Файл:** `pdf-magazine.png`
- **Что показать:** Онлайн просмотр журнала

### 7. Google Analytics (опционально)
- **Файл:** `google-analytics.png`
- **Что показать:** Трафик и пользователи за последний месяц

## Как сделать скриншоты

### macOS
```bash
# Весь экран
Cmd + Shift + 3

# Выделенная область
Cmd + Shift + 4

# Конкретное окно
Cmd + Shift + 4, затем Space
```

### Windows
```bash
# Весь экран
Win + PrintScreen

# Snipping Tool
Win + Shift + S
```

### Linux
```bash
# GNOME Screenshot
gnome-screenshot -i

# Flameshot (рекомендуется)
flameshot gui
```

## Рекомендуемые размеры

| Тип | Размер | Формат |
|-----|--------|--------|
| Полный экран | 1920x1080 | PNG |
| Область | 1200x800 | PNG |
| Для презентации | 1600x900 | PNG/JPG |

## Структура папки

```
metrics/
├── README.md           # Этот файл
├── homepage-kz.png     # Главная (казахский)
├── homepage-ru.png     # Главная (русский)
├── admin-dashboard.png # Админ-панель
├── article-editor.png  # Редактор статей
├── social-media.png    # Соц. сети
├── advertising.png     # Реклама
├── pdf-magazine.png    # PDF-журнал
└── analytics/          # Google Analytics скриншоты
    ├── traffic.png
    └── users.png
```

## Подготовка к Pitch Deck

1. Сделайте скриншоты всех ключевых экранов
2. Оптимизируйте изображения (TinyPNG, ImageOptim)
3. Добавьте в презентацию с описаниями на казахском/русском
4. Укажите live demo URL: https://aimaqaqshamy.kz/kz

## Google Analytics

Для установки Google Analytics:

1. Создайте аккаунт на https://analytics.google.com/
2. Добавьте property для aimaqaqshamy.kz
3. Получите Measurement ID (G-XXXXXXXXXX)
4. Добавьте в `.env` файл:
   ```
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   ```
5. Скрипт уже интегрирован в Next.js

После 2-4 недель соберите метрики:
- Количество пользователей
- Просмотры страниц
- Средняя продолжительность сеанса
- Географическое распределение
