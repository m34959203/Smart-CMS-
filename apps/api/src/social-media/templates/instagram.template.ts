/**
 * Форматирование статьи для публикации в Instagram
 */
export function formatInstagramPost(
  article: any,
  language: 'kz' | 'ru' = 'ru',
): string {
  const title = language === 'kz' ? article.titleKz : article.titleRu;
  const excerpt = language === 'kz' ? article.excerptKz : article.excerptRu;
  const slug = language === 'kz' ? article.slugKz : article.slugRu;

  // URL к статье
  const frontendUrl = process.env.FRONTEND_URL || 'https://aimaqaqshamy.kz';
  const articleUrl = `${frontendUrl}/${language}/articles/${slug}`;

  let caption = `${title}\n\n`;

  // Добавляем краткое описание (Instagram ограничивает до 2200 символов)
  if (excerpt) {
    const cleanExcerpt = stripHtml(excerpt);
    const truncatedExcerpt =
      cleanExcerpt.length > 150
        ? cleanExcerpt.substring(0, 150) + '...'
        : cleanExcerpt;
    caption += `${truncatedExcerpt}\n\n`;
  }

  // Добавляем ссылку на сайт (ссылки в Instagram не кликабельны)
  caption += `📰 Читайте на сайте aimaqaqshamy.kz\n\n`;

  // Собираем хештеги (максимум 30)
  const hashtags: string[] = [];

  // Категория как хештег
  if (article.category) {
    const categoryName =
      language === 'kz' ? article.category.nameKz : article.category.nameRu;
    hashtags.push(`#${categoryName.replace(/\s+/g, '')}`);
  }

  // Теги как хештеги (до 10)
  if (article.tags && article.tags.length > 0) {
    article.tags.slice(0, 10).forEach((tag: any) => {
      const tagName = language === 'kz' ? tag.nameKz : tag.nameRu;
      const cleanTag = tagName.replace(/\s+/g, '').replace(/[^\wА-Яа-яЁёӘәІіҢңҒғҮүҰұҚқӨөҺһ]/g, '');
      if (cleanTag) {
        hashtags.push(`#${cleanTag}`);
      }
    });
  }

  // Базовые хештеги бренда
  hashtags.push(
    '#AIMAK',
    '#Сатпаев',
    '#Satpaev',
    '#Жаңалықтар',
    '#Новости',
    '#Казахстан',
    '#Kazakhstan',
  );

  // Специальные хештеги для срочных новостей
  if (article.isBreaking) {
    hashtags.push('#СрочнаяНовость', '#Breaking');
  }

  // Ограничиваем до 30 хештегов
  caption += hashtags.slice(0, 30).join(' ');

  return caption;
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
