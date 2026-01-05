#!/usr/bin/env node

/**
 * Импорт статей с WordPress с автоматической AI категоризацией и загрузкой изображений
 * Использует существующий API endpoint для категоризации
 */

const https = require('https');
const http = require('http');
const path = require('path');

const OLD_SITE = 'https://aimaqaqshamy.kz';
const NEW_API = process.env.NEW_API_URL || 'https://aimak-api-w8ps.onrender.com';
const ADMIN_EMAIL = 'admin@aimakakshamy.kz';
const ADMIN_PASSWORD = 'admin123';

let accessToken = null;
let adminId = null;

// HTTP запрос с поддержкой SSL для Render окружения
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const lib = urlObj.protocol === 'https:' ? https : http;

    // Добавляем агент для обработки SSL-сертификатов в Render
    if (urlObj.protocol === 'https:' && !options.agent) {
      options.agent = new https.Agent({
        rejectUnauthorized: false, // Required for Render environment
      });
    }

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
  return new Promise((resolve) => {
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
      },
      agent: new https.Agent({
        rejectUnauthorized: false,
      })
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

// Получить статьи из WordPress
async function getWordPressPosts(page = 1, perPage = 10) {
  const url = `${OLD_SITE}/wp-json/wp/v2/posts?per_page=${perPage}&page=${page}&_embed`;

  try {
    const response = await request(url);
    const totalPages = response.headers['x-wp-totalpages'];

    return {
      posts: response.body,
      totalPages: parseInt(totalPages) || 1
    };
  } catch (error) {
    console.error('Ошибка получения статей:', error.message);
    return { posts: [], totalPages: 0 };
  }
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
async function importArticle(wpPost, withImages = true) {
  const title = stripHtml(wpPost.title.rendered);
  const content = wpPost.content.rendered;
  const excerpt = wpPost.excerpt ? stripHtml(wpPost.excerpt.rendered) : title.substring(0, 200);
  const slug = createSlug(title);

  // Импортируем со временной категорией (будет переназначена AI)
  const categoriesResponse = await request(`${NEW_API}/api/categories`);
  const categories = categoriesResponse.body;
  const defaultCategory = categories.find(c => c.slug === 'zhanalyqtar');

  if (!defaultCategory) {
    return { success: false, error: 'Default category not found' };
  }

  let coverImageUrl = null;

  if (withImages) {
    // Получить главное изображение (featured image)
    if (wpPost._embedded && wpPost._embedded['wp:featuredmedia'] && wpPost._embedded['wp:featuredmedia'][0]) {
      const featuredMedia = wpPost._embedded['wp:featuredmedia'][0];
      const imageUrl = featuredMedia.source_url;

      if (imageUrl) {
        process.stdout.write('📷 ');
        try {
          const { buffer, contentType } = await downloadImage(imageUrl);
          const filename = path.basename(new URL(imageUrl).pathname);
          coverImageUrl = await uploadImage(buffer, contentType, filename);
        } catch (error) {
          process.stdout.write('⚠️ ');
        }
      }
    }
  }

  const articleData = {
    titleKz: title,
    slugKz: slug + '-' + wpPost.id,
    contentKz: content,
    excerptKz: excerpt,
    categoryId: defaultCategory.id,
    authorId: adminId,
    status: 'PUBLISHED',
    published: true,
    publishedAt: wpPost.date,
  };

  // Добавить главное изображение если есть
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
      return { success: true, article: response.body };
    } else {
      return { success: false, error: response.body };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Категоризация всех статей через API
async function categorizeAllArticles() {
  console.log('\n🤖 Запуск AI категоризации...\n');

  try {
    const response = await request(`${NEW_API}/api/articles/categorize-all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      timeout: 600000, // 10 минут
    });

    if (response.status === 200 || response.status === 201) {
      const result = response.body;
      console.log('✅ Категоризация завершена');
      console.log(`   Всего статей: ${result.stats.total}`);
      console.log(`   Обновлено: ${result.stats.updated}`);
      console.log(`   Пропущено: ${result.stats.skipped}`);
      console.log(`   Ошибок: ${result.stats.errors}`);
      return true;
    } else {
      console.error('❌ Ошибка категоризации:', response.body);
      return false;
    }
  } catch (error) {
    console.error('❌ Ошибка при вызове API категоризации:', error.message);
    return false;
  }
}

// Главная функция
async function main() {
  console.log('📰 ИМПОРТ СТАТЕЙ С AI КАТЕГОРИЗАЦИЕЙ И ИЗОБРАЖЕНИЯМИ');
  console.log('=====================================================\n');

  // Вход
  const loggedIn = await login();
  if (!loggedIn) {
    process.exit(1);
  }

  // Параметры
  const args = process.argv.slice(2);
  const limit = args[0] ? parseInt(args[0]) : 10;
  const autoCategorize = args[1] !== 'skip'; // По умолчанию включена автокатегоризация
  const withImages = !args.includes('--no-images'); // По умолчанию включена загрузка изображений

  console.log(`📊 Импорт первых ${limit} статей...`);
  if (autoCategorize) {
    console.log('🤖 AI категоризация: ВКЛЮЧЕНА');
  } else {
    console.log('⏭️  AI категоризация: ПРОПУЩЕНА');
  }
  if (withImages) {
    console.log('🖼️  Загрузка изображений: ВКЛЮЧЕНА\n');
  } else {
    console.log('⏭️  Загрузка изображений: ПРОПУЩЕНА\n');
  }

  let imported = 0;
  let failed = 0;
  let page = 1;
  const perPage = 10;

  while (imported < limit) {
    const { posts, totalPages } = await getWordPressPosts(page, perPage);

    if (posts.length === 0) {
      break;
    }

    for (const post of posts) {
      if (imported >= limit) break;

      process.stdout.write(`📝 [${imported + 1}/${limit}] ${stripHtml(post.title.rendered).substring(0, 50)}... `);

      const result = await importArticle(post, withImages);

      if (result.success) {
        console.log('✅');
        imported++;
      } else {
        console.log('❌', result.error.message || 'Ошибка');
        failed++;
      }

      // Задержка
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    page++;

    if (page > totalPages) {
      break;
    }
  }

  console.log('\n=====================================================');
  console.log(`✅ Импортировано: ${imported}`);
  console.log(`❌ Ошибок: ${failed}`);
  console.log('=====================================================');

  // Автоматическая категоризация если включена
  if (autoCategorize && imported > 0) {
    await categorizeAllArticles();
  }

  console.log('\n✅ Готово!\n');
}

main().catch(console.error);
