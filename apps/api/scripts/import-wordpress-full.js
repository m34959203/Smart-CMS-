#!/usr/bin/env node

/**
 * Полный импорт статей с WordPress с проверками качества и дубликатов
 *
 * ПРОВЕРКИ ПРИ ИМПОРТЕ:
 * 1. Дубликаты - проверка по slug и WordPress ID
 * 2. Валидация заголовка - минимум 10 символов
 * 3. Валидация контента - минимум 100 символов текста
 * 4. Валидация превью - минимум 20 символов
 * 5. Главное изображение (превью) - ОБЯЗАТЕЛЬНО
 * 6. Изображения в контенте - все должны успешно загрузиться
 *
 * ФУНКЦИИ:
 * - Проверка существующих статей для предотвращения дубликатов
 * - Загрузка всех изображений (featured + из контента)
 * - Сохранение HTML форматирования
 * - Автоматическое создание и привязка тегов
 * - Поддержка пропуска статей (offset) для продолжения импорта
 */

const https = require('https');
const http = require('http');
const path = require('path');

const OLD_SITE = 'https://aimaqaqshamy.kz';
const NEW_API = process.env.NEW_API_URL || 'https://aimak-api-w8ps.onrender.com';
const ADMIN_EMAIL = 'admin@aimakakshamy.kz';
const ADMIN_PASSWORD = 'admin123';

// Маппинг категорий WordPress → наша система
const CATEGORY_MAPPING = {
  // По умолчанию все идут в ЖАҢАЛЫҚТАР
  'default': 'zhanalyqtar',
  // Можно добавить специфичные маппинги если известны категории
};

let accessToken = null;
let adminId = null;
let categoriesCache = {};
let wpCategoriesCache = {};
let tagsCache = {}; // Наши теги: { slug: tagObject }
let wpTagsCache = {}; // WordPress теги: { id: tagObject }
let existingArticles = new Set(); // Кеш существующих статей по slug и WP ID

// HTTP запрос с таймаутом
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const lib = urlObj.protocol === 'https:' ? https : http;
    const timeout = options.timeout || 30000; // 30 секунд по умолчанию

    const req = lib.request(url, options, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    // Установить таймаут
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeout}ms`));
    });

    req.on('error', reject);

    if (options.body) {
      const bodyStr = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      req.write(bodyStr);
    }

    req.end();
  });
}

// HTTP запрос с retry логикой
async function requestWithRetry(url, options = {}, maxRetries = 4) {
  const delays = [2000, 4000, 8000, 16000]; // Экспоненциальная задержка

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await request(url, options);
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;

      if (isLastAttempt) {
        throw error;
      }

      const delay = delays[attempt] || 16000;
      console.log(`\n⚠️  Ошибка сети (попытка ${attempt + 1}/${maxRetries + 1}): ${error.message}`);
      console.log(`   Повтор через ${delay / 1000} сек...`);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Скачать файл
function downloadFile(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const lib = urlObj.protocol === 'https:' ? https : http;

    const req = lib.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // Редирект
        return downloadFile(res.headers.location, timeout).then(resolve).catch(reject);
      }

      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const contentType = res.headers['content-type'] || 'image/jpeg';
        resolve({ buffer, contentType });
      });
    });

    // Установить таймаут
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error(`Download timeout after ${timeout}ms`));
    });

    req.on('error', reject);
  });
}

// Скачать файл с retry
async function downloadFileWithRetry(url, maxRetries = 3) {
  const delays = [2000, 4000, 8000];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await downloadFile(url, 45000);
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;

      if (isLastAttempt) {
        throw error;
      }

      const delay = delays[attempt] || 8000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Загрузить изображение
function uploadImage(buffer, contentType, filename) {
  return new Promise((resolve) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

    const header = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
      `Content-Type: ${contentType}\r\n\r\n`,
      'utf8'
    );

    const footer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
    const body = Buffer.concat([header, buffer, footer]);

    const urlObj = new URL(`${NEW_API}/api/media/upload`);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
        'Authorization': `Bearer ${accessToken}`
      }
    };

    const lib = urlObj.protocol === 'https:' ? https : http;

    const req = lib.request(options, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200 || res.statusCode === 201) {
            resolve(response.url);
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));

    req.write(body);
    req.end();
  });
}

// Логин
async function login() {
  console.log('🔐 Вход в систему...');

  const response = await request(`${NEW_API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
  });

  if (response.status === 200 || response.status === 201) {
    accessToken = response.body.accessToken;
    adminId = response.body.user.id;
    console.log('✅ Вход выполнен\n');
    return true;
  } else {
    console.error('❌ Ошибка входа:', response.body);
    return false;
  }
}

// Получить категории из новой системы
async function loadCategories() {
  const response = await request(`${NEW_API}/api/categories`);
  if (response.status === 200) {
    response.body.forEach(cat => {
      categoriesCache[cat.slug] = cat;
    });
    console.log(`✅ Загружено ${Object.keys(categoriesCache).length} категорий\n`);
  }
}

// Получить теги из новой системы
async function loadTags() {
  const response = await request(`${NEW_API}/api/tags`);
  if (response.status === 200) {
    response.body.forEach(tag => {
      tagsCache[tag.slug] = tag;
    });
    console.log(`✅ Загружено ${Object.keys(tagsCache).length} тегов\n`);
  }
}

// Загрузить существующие статьи для проверки дубликатов
async function loadExistingArticles() {
  try {
    const response = await request(`${NEW_API}/api/articles`);
    if (response.status === 200) {
      response.body.forEach(article => {
        // Сохраняем slug (казахский и русский)
        if (article.slugKz) existingArticles.add(article.slugKz);
        if (article.slugRu) existingArticles.add(article.slugRu);

        // Извлекаем WordPress ID из slug (формат: slug-123)
        const wpIdMatch = article.slugKz?.match(/-(\d+)$/);
        if (wpIdMatch) {
          existingArticles.add(`wp-${wpIdMatch[1]}`);
        }
      });
      console.log(`✅ Загружено ${response.body.length} существующих статей для проверки дубликатов\n`);
    }
  } catch (error) {
    console.log('⚠️  Не удалось загрузить существующие статьи');
  }
}

// Получить категории WordPress
async function loadWPCategories() {
  try {
    const response = await request(`${OLD_SITE}/wp-json/wp/v2/categories?per_page=100`);
    if (response.status === 200) {
      response.body.forEach(cat => {
        wpCategoriesCache[cat.id] = cat;
      });
      console.log(`✅ Загружено ${Object.keys(wpCategoriesCache).length} категорий WordPress\n`);
    }
  } catch (error) {
    console.log('⚠️  Не удалось загрузить категории WordPress');
  }
}

// Получить теги WordPress
async function loadWPTags() {
  try {
    const response = await request(`${OLD_SITE}/wp-json/wp/v2/tags?per_page=100`);
    if (response.status === 200) {
      response.body.forEach(tag => {
        wpTagsCache[tag.id] = tag;
      });
      console.log(`✅ Загружено ${Object.keys(wpTagsCache).length} тегов WordPress\n`);
    }
  } catch (error) {
    console.log('⚠️  Не удалось загрузить теги WordPress');
  }
}

// Определить категорию для статьи
function getTargetCategory(wpCategoryIds) {
  // Пока все статьи идут в "Жаңалықтар"
  // TODO: можно добавить маппинг по названиям категорий
  return categoriesCache['zhanalyqtar'];
}

// Создать slug для тега
function createTagSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-zа-яәіңғүұқөһ0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Создать тег
async function createTag(name) {
  try {
    const response = await request(`${NEW_API}/api/tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: { name }
    });

    if (response.status === 200 || response.status === 201) {
      const tag = response.body;
      tagsCache[tag.slug] = tag;
      return tag;
    }
  } catch (error) {
    // Тег может уже существовать
  }
  return null;
}

// Получить или создать тег по имени
async function getOrCreateTag(name) {
  const slug = createTagSlug(name);

  // Проверяем кеш
  if (tagsCache[slug]) {
    return tagsCache[slug];
  }

  // Создаем новый тег
  const tag = await createTag(name);
  return tag;
}

// Получить статьи из WordPress
async function getWordPressPosts(page = 1, perPage = 10) {
  const url = `${OLD_SITE}/wp-json/wp/v2/posts?per_page=${perPage}&page=${page}&_embed`;

  try {
    const response = await requestWithRetry(url, { timeout: 45000 });
    const totalPages = response.headers['x-wp-totalpages'];

    return {
      posts: response.body,
      totalPages: parseInt(totalPages) || 1
    };
  } catch (error) {
    console.error('\n❌ Ошибка получения статей:', error.message);
    return { posts: [], totalPages: 0 };
  }
}

// Обработать изображения в контенте
async function processContentImages(html) {
  const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
  let match;
  const replacements = [];

  // Найти все изображения
  while ((match = imgRegex.exec(html)) !== null) {
    const fullTag = match[0];
    const imgUrl = match[1];

    // Пропускаем если это не с нашего старого сайта
    if (!imgUrl.includes('aimaqaqshamy.kz') && !imgUrl.startsWith('http')) {
      continue;
    }

    const absoluteUrl = imgUrl.startsWith('http') ? imgUrl : `${OLD_SITE}${imgUrl}`;

    replacements.push({
      original: imgUrl,
      url: absoluteUrl,
      tag: fullTag
    });
  }

  let failedImages = 0;

  // Скачать и загрузить все изображения
  for (const img of replacements) {
    try {
      const { buffer, contentType } = await downloadFileWithRetry(img.url);
      const filename = path.basename(new URL(img.url).pathname);
      const newUrl = await uploadImage(buffer, contentType, filename);

      if (newUrl) {
        // Заменить URL в HTML
        html = html.replace(new RegExp(img.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newUrl);
        process.stdout.write('🖼️');
      } else {
        failedImages++;
        process.stdout.write('❌');
      }
    } catch (error) {
      // Изображение не загрузилось
      failedImages++;
      process.stdout.write('❌');
    }
  }

  return {
    html,
    totalImages: replacements.length,
    failedImages
  };
}

// Очистка HTML
function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

// Создать slug
function createSlug(title) {
  return title
    .toLowerCase()
    .replace(/[қ]/g, 'q')
    .replace(/[ә]/g, 'a')
    .replace(/[ғ]/g, 'g')
    .replace(/[ұ]/g, 'u')
    .replace(/[ү]/g, 'u')
    .replace(/[і]/g, 'i')
    .replace(/[ң]/g, 'n')
    .replace(/[һ]/g, 'h')
    .replace(/[ө]/g, 'o')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

// Импортировать статью
async function importArticle(wpPost) {
  const title = stripHtml(wpPost.title.rendered);
  let content = wpPost.content.rendered;
  const excerpt = wpPost.excerpt ? stripHtml(wpPost.excerpt.rendered) : title.substring(0, 200);
  const slug = createSlug(title);
  const fullSlug = slug + '-' + wpPost.id;

  // ПРОВЕРКА 1: Дубликаты - проверяем по slug и WordPress ID
  if (existingArticles.has(fullSlug) || existingArticles.has(`wp-${wpPost.id}`)) {
    return { success: false, error: 'Article already exists (duplicate)', skipped: true };
  }

  // ПРОВЕРКА 2: Валидация заголовка
  if (!title || title.length < 10) {
    return { success: false, error: 'Title too short or empty' };
  }

  // ПРОВЕРКА 3: Валидация контента - должен быть содержательный текст
  const textContent = stripHtml(content);
  if (!textContent || textContent.length < 100) {
    return { success: false, error: 'Content too short or empty (minimum 100 characters)' };
  }

  // ПРОВЕРКА 4: Валидация превью
  if (!excerpt || excerpt.length < 20) {
    return { success: false, error: 'Excerpt too short or empty (minimum 20 characters)' };
  }

  // Определить категорию
  const category = getTargetCategory(wpPost.categories);
  if (!category) {
    return { success: false, error: 'No category found' };
  }

  // ПРОВЕРКА 5: Главное изображение (превью) - ОБЯЗАТЕЛЬНО
  let coverImageUrl = null;

  if (!wpPost._embedded || !wpPost._embedded['wp:featuredmedia'] || !wpPost._embedded['wp:featuredmedia'][0]) {
    return { success: false, error: 'No featured media (cover image required)' };
  }

  const featuredMedia = wpPost._embedded['wp:featuredmedia'][0];
  const imageUrl = featuredMedia.source_url;

  if (!imageUrl) {
    return { success: false, error: 'No cover image URL found' };
  }

  // Загружаем превью
  process.stdout.write('📷');
  try {
    const { buffer, contentType } = await downloadFileWithRetry(imageUrl);
    const filename = path.basename(new URL(imageUrl).pathname);
    coverImageUrl = await uploadImage(buffer, contentType, filename);

    if (!coverImageUrl) {
      return { success: false, error: 'Failed to upload cover image' };
    }
  } catch (error) {
    return { success: false, error: `Cover image download failed: ${error.message}` };
  }

  // ПРОВЕРКА 6: Изображения в контенте - все должны успешно загрузиться
  const contentResult = await processContentImages(content);

  if (contentResult.failedImages > 0) {
    return {
      success: false,
      error: `Failed to upload ${contentResult.failedImages} of ${contentResult.totalImages} content images`
    };
  }

  content = contentResult.html;

  // Обработать теги
  const tagIds = [];
  if (wpPost.tags && wpPost.tags.length > 0) {
    for (const wpTagId of wpPost.tags) {
      const wpTag = wpTagsCache[wpTagId];
      if (wpTag) {
        const tag = await getOrCreateTag(wpTag.name);
        if (tag) {
          tagIds.push(tag.id);
          process.stdout.write('🏷️');
        }
      }
    }
  }

  const articleData = {
    titleKz: title,
    slugKz: slug + '-' + wpPost.id,
    contentKz: content,
    excerptKz: excerpt,
    categoryId: category.id,
    authorId: adminId,
    status: 'PUBLISHED',
    published: true,
    publishedAt: wpPost.date,
    coverImage: coverImageUrl, // Всегда есть, так как проверили выше
    tagIds: tagIds.length > 0 ? tagIds : undefined, // Добавляем теги если есть
  };

  try {
    const response = await request(`${NEW_API}/api/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: articleData
    });

    if (response.status === 200 || response.status === 201) {
      return { success: true, article: response.body };
    } else {
      return { success: false, error: response.body };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Главная функция
async function main() {
  console.log('📰 ПОЛНЫЙ ИМПОРТ СТАТЕЙ С WORDPRESS');
  console.log('=====================================\n');

  const args = process.argv.slice(2);
  const limit = args[0] ? parseInt(args[0]) : 20;
  const skipCount = args[1] ? parseInt(args[1]) : 0; // Пропустить первые N статей

  // Вход
  const loggedIn = await login();
  if (!loggedIn) {
    process.exit(1);
  }

  // Загрузить категории, теги и существующие статьи
  await loadCategories();
  await loadWPCategories();
  await loadTags();
  await loadWPTags();
  await loadExistingArticles(); // Загрузка для проверки дубликатов

  if (skipCount > 0) {
    console.log(`📊 Пропуск первых ${skipCount} статей, затем импорт ${limit} статей...\n`);
  } else {
    console.log(`📊 Импорт первых ${limit} статей...\n`);
  }

  let imported = 0;
  let failed = 0;
  let skipped = 0;
  let duplicates = 0; // Пропущенные дубликаты
  let page = 1;
  const perPage = 10;
  let totalProcessed = 0;

  while (imported < limit) {
    const { posts, totalPages } = await getWordPressPosts(page, perPage);

    if (posts.length === 0) {
      console.log('\n⚠️  Статьи закончились');
      break;
    }

    for (const post of posts) {
      if (imported >= limit) break;

      // Пропустить если нужно
      if (totalProcessed < skipCount) {
        totalProcessed++;
        skipped++;
        continue;
      }

      const wpCategory = wpCategoriesCache[post.categories[0]];
      const catName = wpCategory ? wpCategory.name : 'Uncategorized';
      const position = skipCount + imported + 1;

      process.stdout.write(`\n📝 [${position}] [${catName}] ${stripHtml(post.title.rendered).substring(0, 40)}... `);

      const result = await importArticle(post);

      if (result.success) {
        console.log(' ✅');
        imported++;
        // Добавляем в кеш существующих статей
        existingArticles.add(`wp-${post.id}`);
      } else {
        if (result.skipped) {
          console.log(` ⏭️  ${result.error}`);
          duplicates++;
        } else {
          console.log(` ❌ ${result.error}`);
          failed++;
        }
      }

      totalProcessed++;

      // Задержка между статьями
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    page++;

    if (page > totalPages) {
      console.log('\n⚠️  Достигнут конец списка статей WordPress');
      break;
    }
  }

  console.log('\n=====================================');
  console.log('📊 СТАТИСТИКА ИМПОРТА:');
  console.log('=====================================');
  if (skipped > 0) {
    console.log(`⏭️  Пропущено (offset): ${skipped}`);
  }
  console.log(`✅ Импортировано: ${imported}`);
  if (duplicates > 0) {
    console.log(`🔄 Дубликаты (пропущено): ${duplicates}`);
  }
  console.log(`❌ Ошибок: ${failed}`);
  console.log(`📈 Всего обработано: ${totalProcessed}`);
  console.log('=====================================\n');

  if (failed > 0) {
    console.log(`💡 Для продолжения импорта с позиции ${totalProcessed + 1} выполните:`);
    console.log(`   node apps/api/scripts/import-wordpress-full.js ${limit} ${totalProcessed}\n`);
  }
}

main().catch(console.error);
