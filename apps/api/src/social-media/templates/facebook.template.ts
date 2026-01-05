/**
 * Форматирование статьи для публикации в Facebook
 * Facebook имеет ограничения:
 * - Post text: максимум 63,206 символов
 * - Рекомендуемая длина: 40-80 символов для вовлеченности
 * - Хештеги: рекомендуется 1-3
 */
export function formatFacebookPost(
  article: any,
  language: 'kz' | 'ru' = 'ru',
): string {
  const title = language === 'kz' ? article.titleKz : article.titleRu;
  const excerpt = language === 'kz' ? article.excerptKz : article.excerptRu;
  const slug = language === 'kz' ? article.slugKz : article.slugRu;

  // URL к статье
  const frontendUrl = process.env.FRONTEND_URL || 'https://aimaqaqshamy.kz';
  const articleUrl = `${frontendUrl}/${language}/articles/${slug}`;

  let message = '';

  // Добавляем эмодзи для срочных новостей
  if (article.isBreaking) {
    message += '🔴 ';
    message += language === 'kz' ? 'ШҰҒЫЛ ЖАҢАЛЫҚ\n\n' : 'СРОЧНАЯ НОВОСТЬ\n\n';
  }

  // Заголовок
  message += `📰 ${title}\n\n`;

  // Добавляем краткое описание
  if (excerpt) {
    const cleanExcerpt = stripHtml(excerpt);
    // Facebook работает лучше с более длинными постами, до 300 символов
    const truncatedExcerpt =
      cleanExcerpt.length > 300
        ? cleanExcerpt.substring(0, 300) + '...'
        : cleanExcerpt;
    message += `${truncatedExcerpt}\n\n`;
  }

  // Добавляем категорию
  if (article.category) {
    const categoryName =
      language === 'kz' ? article.category.nameKz : article.category.nameRu;
    message += `📁 ${categoryName}\n\n`;
  }

  // Призыв к действию
  const cta = language === 'kz'
    ? '👉 Толық мақаланы оқу үшін сілтемені басыңыз'
    : '👉 Нажмите на ссылку, чтобы прочитать полную статью';
  message += `${cta}\n\n`;

  // Ссылка
  message += `🔗 ${articleUrl}\n\n`;

  // Собираем хештеги (1-3 для Facebook)
  const hashtags: string[] = [];

  // Категория как хештег
  if (article.category) {
    const categoryName =
      language === 'kz' ? article.category.nameKz : article.category.nameRu;
    const cleanCategory = cleanHashtag(categoryName);
    if (cleanCategory) {
      hashtags.push(`#${cleanCategory}`);
    }
  }

  // Базовые хештеги бренда
  hashtags.push('#AIMAK');
  hashtags.push('#Сатпаев');

  // Добавляем теги статьи (до 2)
  if (article.tags && article.tags.length > 0) {
    article.tags.slice(0, 2).forEach((tag: any) => {
      const tagName = language === 'kz' ? tag.nameKz : tag.nameRu;
      const cleanTag = cleanHashtag(tagName);
      if (cleanTag && !hashtags.some(h => h.toLowerCase() === `#${cleanTag}`.toLowerCase())) {
        hashtags.push(`#${cleanTag}`);
      }
    });
  }

  // Ограничиваем до 3 хештегов для Facebook
  message += hashtags.slice(0, 3).join(' ');

  return message;
}

/**
 * Форматирование caption для фото-поста Facebook
 */
export function formatFacebookPhotoCaption(
  article: any,
  language: 'kz' | 'ru' = 'ru',
): string {
  const title = language === 'kz' ? article.titleKz : article.titleRu;
  const excerpt = language === 'kz' ? article.excerptKz : article.excerptRu;
  const slug = language === 'kz' ? article.slugKz : article.slugRu;

  const frontendUrl = process.env.FRONTEND_URL || 'https://aimaqaqshamy.kz';
  const articleUrl = `${frontendUrl}/${language}/articles/${slug}`;

  let caption = '';

  // Заголовок
  if (article.isBreaking) {
    caption += '🔴 ';
  }
  caption += `${title}\n\n`;

  // Краткое описание
  if (excerpt) {
    const cleanExcerpt = stripHtml(excerpt);
    const truncatedExcerpt =
      cleanExcerpt.length > 250
        ? cleanExcerpt.substring(0, 250) + '...'
        : cleanExcerpt;
    caption += `${truncatedExcerpt}\n\n`;
  }

  // Ссылка на полную статью
  caption += `📖 ${language === 'kz' ? 'Толығырақ' : 'Подробнее'}: ${articleUrl}\n\n`;

  // Хештеги
  const hashtags = ['#AIMAK', '#Сатпаев'];

  if (article.category) {
    const categoryName =
      language === 'kz' ? article.category.nameKz : article.category.nameRu;
    const cleanCategory = cleanHashtag(categoryName);
    if (cleanCategory) {
      hashtags.push(`#${cleanCategory}`);
    }
  }

  caption += hashtags.slice(0, 3).join(' ');

  return caption;
}

/**
 * Получить URL статьи для Facebook link preview
 */
export function getArticleUrl(
  article: any,
  language: 'kz' | 'ru' = 'ru',
): string {
  const slug = language === 'kz' ? article.slugKz : article.slugRu;
  const frontendUrl = process.env.FRONTEND_URL || 'https://aimaqaqshamy.kz';
  return `${frontendUrl}/${language}/articles/${slug}`;
}

/**
 * Очистка строки для использования как хештег
 */
function cleanHashtag(text: string): string {
  return text
    .replace(/\s+/g, '') // Убрать пробелы
    .replace(/[^\wА-Яа-яЁёӘәІіҢңҒғҮүҰұҚқӨөҺһ]/g, '') // Оставить только буквы и цифры
    .toLowerCase();
}

/**
 * Удаление HTML тегов из текста
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Удалить HTML теги
    .replace(/&nbsp;/g, ' ') // Заменить &nbsp; на пробел
    .replace(/&amp;/g, '&') // Заменить &amp; на &
    .replace(/&lt;/g, '<') // Заменить &lt; на <
    .replace(/&gt;/g, '>') // Заменить &gt; на >
    .replace(/&quot;/g, '"') // Заменить &quot; на "
    .replace(/&#39;/g, "'") // Заменить &#39; на '
    .trim();
}
