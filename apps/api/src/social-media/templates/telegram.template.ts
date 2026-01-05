/**
 * Форматирование статьи для публикации в Telegram
 */
export function formatTelegramPost(
  article: any,
  language: 'kz' | 'ru' = 'ru',
): string {
  const title = language === 'kz' ? article.titleKz : article.titleRu;
  const excerpt = language === 'kz' ? article.excerptKz : article.excerptRu;
  const slug = language === 'kz' ? article.slugKz : article.slugRu;

  // URL к статье
  const frontendUrl = process.env.FRONTEND_URL || 'https://aimaqaqshamy.kz';
  const articleUrl = `${frontendUrl}/${language}/articles/${slug}`;

  let message = `📰 <b>${title}</b>\n\n`;

  // Добавляем краткое описание
  if (excerpt) {
    const cleanExcerpt = stripHtml(excerpt);
    message += `${cleanExcerpt}\n\n`;
  }

  // Добавляем категорию
  if (article.category) {
    const categoryName =
      language === 'kz' ? article.category.nameKz : article.category.nameRu;
    message += `🏷 <i>${categoryName}</i>\n\n`;
  }

  // Добавляем теги (максимум 5)
  if (article.tags && article.tags.length > 0) {
    const tagNames = article.tags
      .slice(0, 5)
      .map((tag: any) => {
        const tagName = language === 'kz' ? tag.nameKz : tag.nameRu;
        return `#${tagName.replace(/\s+/g, '_')}`;
      })
      .join(' ');
    message += `${tagNames}\n\n`;
  }

  // Добавляем флаги
  if (article.isBreaking) {
    message += `🔥 <b>СРОЧНАЯ НОВОСТЬ</b>\n\n`;
  }

  // Ссылка на полную статью
  message += `📖 <a href="${articleUrl}">Читать полностью</a>`;

  return message;
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
