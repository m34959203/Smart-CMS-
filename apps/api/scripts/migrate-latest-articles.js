#!/usr/bin/env node

/**
 * Скрипт миграции 20 последних статей из WordPress с изображениями
 *
 * Использование:
 *   node migrate-latest-articles.js
 *
 * Опции:
 *   --limit=N        - количество статей (по умолчанию 20)
 *   --no-images      - импорт без изображений
 *   --api-url=URL    - URL нового API
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ==========================================
// КОНФИГУРАЦИЯ
// ==========================================
const OLD_SITE = 'https://aimaqaqshamy.kz';
const NEW_API = process.env.NEW_API_URL || 'http://localhost:4000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@aimakakshamy.kz';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Глобальные переменные
let accessToken = null;
let adminId = null;
let uploadedImages = new Map(); // Кеш загруженных изображений

// ==========================================
// HTTP УТИЛИТЫ
// ==========================================

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const lib = urlObj.protocol === 'https:' ? https : http;

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

    req.on('error', reject);

    if (options.body) {
      const bodyStr = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      req.write(bodyStr);
    }

    req.end();
  });
}

// Скачать изображение
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const lib = urlObj.protocol === 'https:' ? https : http;

    lib.get(url, (res) => {
      // Проверка редиректов
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadImage(res.headers.location)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const contentType = res.headers['content-type'] || 'image/jpeg';
        resolve({ buffer, contentType });
      });
    }).on('error', reject);
  });
}

// Загрузить изображение на новый сервер
function uploadImage(buffer, contentType, filename) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

    // Формируем multipart/form-data тело
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
            reject(new Error(`Upload failed: ${response.message || 'Unknown error'}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ==========================================
// WORDPRESS API
// ==========================================

async function getWordPressPosts(limit = 20) {
  const url = `${OLD_SITE}/wp-json/wp/v2/posts?per_page=${limit}&page=1&_embed&orderby=date&order=desc`;

  try {
    const response = await request(url);
    return response.body;
  } catch (error) {
    console.error('❌ Ошибка получения статей:', error.message);
    return [];
  }
}

// ==========================================
// АУТЕНТИФИКАЦИЯ
// ==========================================

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
    console.log('✅ Вход выполнен');
    return true;
  } else {
    console.error('❌ Ошибка входа:', response.body);
    return false;
  }
}

// ==========================================
// УТИЛИТЫ
// ==========================================

// Очистка HTML
function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
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

// Найти все URL изображений в HTML контенте
function findImageUrls(html) {
  const regex = /<img[^>]+src="([^">]+)"/g;
  const urls = [];
  let match;

  while ((match = regex.exec(html)) !== null) {
    urls.push(match[1]);
  }

  return urls;
}

// ==========================================
// РАБОТА С ИЗОБРАЖЕНИЯМИ
// ==========================================

async function downloadAndUploadImage(imageUrl) {
  // Проверяем кеш
  if (uploadedImages.has(imageUrl)) {
    return uploadedImages.get(imageUrl);
  }

  try {
    const { buffer, contentType } = await downloadImage(imageUrl);
    const filename = path.basename(new URL(imageUrl).pathname);
    const newUrl = await uploadImage(buffer, contentType, filename);

    // Сохраняем в кеш
    uploadedImages.set(imageUrl, newUrl);

    return newUrl;
  } catch (error) {
    console.error(`  ⚠️  Ошибка загрузки ${imageUrl}: ${error.message}`);
    return null;
  }
}

async function processContentImages(content) {
  const imageUrls = findImageUrls(content);

  if (imageUrls.length === 0) {
    return content;
  }

  console.log(`  📷 Найдено изображений в контенте: ${imageUrls.length}`);

  let processedContent = content;

  for (const oldUrl of imageUrls) {
    const newUrl = await downloadAndUploadImage(oldUrl);
    if (newUrl) {
      processedContent = processedContent.replace(oldUrl, newUrl);
    }
  }

  return processedContent;
}

// ==========================================
// ПОЛУЧЕНИЕ КАТЕГОРИИ
// ==========================================

async function getCategory(slug = 'zhanalyqtar') {
  const response = await request(`${NEW_API}/api/categories`);
  if (response.status === 200) {
    return response.body.find(c => c.slug === slug);
  }
  return null;
}

// ==========================================
// ИМПОРТ СТАТЬИ
// ==========================================

async function importArticle(wpPost, category, withImages = true) {
  const title = stripHtml(wpPost.title.rendered);
  let content = wpPost.content.rendered;
  const excerpt = wpPost.excerpt ? stripHtml(wpPost.excerpt.rendered) : title.substring(0, 200);
  const slug = createSlug(title);

  console.log(`\n📝 [${wpPost.id}] ${title.substring(0, 60)}...`);

  let coverImageUrl = null;

  if (withImages) {
    // Главное изображение (featured image)
    if (wpPost._embedded && wpPost._embedded['wp:featuredmedia'] && wpPost._embedded['wp:featuredmedia'][0]) {
      const featuredMedia = wpPost._embedded['wp:featuredmedia'][0];
      const imageUrl = featuredMedia.source_url;

      if (imageUrl) {
        console.log('  🖼️  Загрузка главного изображения...');
        coverImageUrl = await downloadAndUploadImage(imageUrl);
        if (coverImageUrl) {
          console.log('  ✅ Главное изображение загружено');
        }
      }
    }

    // Изображения в контенте
    console.log('  🔍 Обработка изображений в контенте...');
    content = await processContentImages(content);
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
  };

  if (coverImageUrl) {
    articleData.coverImage = coverImageUrl;
  }

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
      console.log('  ✅ Статья импортирована');
      return { success: true, article: response.body };
    } else {
      console.log('  ❌ Ошибка импорта:', response.body.message || 'Неизвестная ошибка');
      return { success: false, error: response.body };
    }
  } catch (error) {
    console.log('  ❌ Ошибка импорта:', error.message);
    return { success: false, error: error.message };
  }
}

// ==========================================
// ГЛАВНАЯ ФУНКЦИЯ
// ==========================================

async function main() {
  console.log('\n┌────────────────────────────────────────────────┐');
  console.log('│  📰 МИГРАЦИЯ СТАТЕЙ ИЗ WORDPRESS              │');
  console.log('│  Сохранение последних статей с изображениями   │');
  console.log('└────────────────────────────────────────────────┘\n');

  // Параметры
  const args = process.argv.slice(2);
  let limit = 20;
  let withImages = true;

  // Обработка аргументов
  for (const arg of args) {
    if (arg.startsWith('--limit=')) {
      limit = parseInt(arg.split('=')[1]) || 20;
    } else if (arg === '--no-images') {
      withImages = false;
    } else if (arg.startsWith('--api-url=')) {
      NEW_API = arg.split('=')[1];
    }
  }

  console.log(`⚙️  Параметры миграции:`);
  console.log(`   • Количество статей: ${limit}`);
  console.log(`   • Изображения: ${withImages ? 'ДА' : 'НЕТ'}`);
  console.log(`   • WordPress сайт: ${OLD_SITE}`);
  console.log(`   • Новый API: ${NEW_API}\n`);

  // Вход в систему
  const loggedIn = await login();
  if (!loggedIn) {
    console.error('\n❌ Не удалось войти в систему. Проверьте credentials.\n');
    process.exit(1);
  }

  // Получаем категорию
  console.log('\n📁 Получение категории...');
  const category = await getCategory('zhanalyqtar');
  if (!category) {
    console.error('❌ Категория "zhanalyqtar" не найдена');
    console.error('   Создайте категорию или измените slug в скрипте\n');
    process.exit(1);
  }
  console.log(`✅ Категория: ${category.nameKz} (${category.slug})`);

  // Получаем статьи из WordPress
  console.log(`\n📥 Получение ${limit} последних статей из WordPress...`);
  const posts = await getWordPressPosts(limit);

  if (posts.length === 0) {
    console.error('❌ Не удалось получить статьи из WordPress\n');
    process.exit(1);
  }

  console.log(`✅ Получено статей: ${posts.length}`);

  // Импорт статей
  console.log('\n' + '='.repeat(50));
  console.log('НАЧАЛО ИМПОРТА');
  console.log('='.repeat(50));

  let imported = 0;
  let failed = 0;

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    console.log(`\n[${i + 1}/${posts.length}]`);

    const result = await importArticle(post, category, withImages);

    if (result.success) {
      imported++;
    } else {
      failed++;
    }

    // Небольшая задержка между запросами
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Итоги
  console.log('\n' + '='.repeat(50));
  console.log('ЗАВЕРШЕНО');
  console.log('='.repeat(50));
  console.log(`✅ Успешно импортировано: ${imported}`);
  console.log(`❌ Ошибок: ${failed}`);
  console.log(`📷 Загружено изображений: ${uploadedImages.size}`);
  console.log('='.repeat(50) + '\n');
}

// Запуск
main().catch(error => {
  console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', error);
  process.exit(1);
});
