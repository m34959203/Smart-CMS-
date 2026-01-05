/**
 * Форматирование статьи для публикации в TikTok
 * TikTok имеет ограничения:
 * - Title: максимум 150 символов
 * - Description: максимум 2200 символов
 * - Хештеги: рекомендуется 3-5
 */
export function formatTiktokPost(
  article: any,
  language: 'kz' | 'ru' = 'ru',
): { title: string; description: string } {
  const title = language === 'kz' ? article.titleKz : article.titleRu;
  const excerpt = language === 'kz' ? article.excerptKz : article.excerptRu;
  const slug = language === 'kz' ? article.slugKz : article.slugRu;

  // URL к статье
  const frontendUrl = process.env.FRONTEND_URL || 'https://aimaqaqshamy.kz';
  const articleUrl = `${frontendUrl}/${language}/articles/${slug}`;

  // Заголовок (максимум 150 символов)
  let postTitle = title;
  if (postTitle.length > 147) {
    postTitle = postTitle.substring(0, 147) + '...';
  }

  // Описание
  let description = '';

  // Добавляем краткое описание
  if (excerpt) {
    const cleanExcerpt = stripHtml(excerpt);
    const truncatedExcerpt =
      cleanExcerpt.length > 200
        ? cleanExcerpt.substring(0, 200) + '...'
        : cleanExcerpt;
    description += `${truncatedExcerpt}\n\n`;
  }

  // Добавляем ссылку
  description += `🔗 ${articleUrl}\n\n`;

  // Собираем хештеги (рекомендуется 3-5 для TikTok)
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

  // Теги как хештеги (до 3)
  if (article.tags && article.tags.length > 0) {
    article.tags.slice(0, 3).forEach((tag: any) => {
      const tagName = language === 'kz' ? tag.nameKz : tag.nameRu;
      const cleanTag = cleanHashtag(tagName);
      if (cleanTag && !hashtags.includes(`#${cleanTag}`)) {
        hashtags.push(`#${cleanTag}`);
      }
    });
  }

  // Базовые хештеги бренда
  const brandHashtags = [
    '#AIMAK',
    '#Сатпаев',
    language === 'kz' ? '#жаналықтар' : '#новости',
    '#Казахстан',
  ];

  // Добавляем брендовые хештеги
  brandHashtags.forEach(tag => {
    if (!hashtags.includes(tag)) {
      hashtags.push(tag);
    }
  });

  // Специальные хештеги для срочных новостей
  if (article.isBreaking) {
    hashtags.unshift('#breaking');
    hashtags.unshift(language === 'kz' ? '#шұғыл' : '#срочно');
  }

  // Ограничиваем до 5 хештегов (рекомендация TikTok)
  description += hashtags.slice(0, 5).join(' ');

  return {
    title: postTitle,
    description: description.trim(),
  };
}

/**
 * Генерация caption для TikTok (короткий формат)
 */
export function formatTiktokCaption(
  article: any,
  language: 'kz' | 'ru' = 'ru',
): string {
  const { description } = formatTiktokPost(article, language);
  return description;
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
