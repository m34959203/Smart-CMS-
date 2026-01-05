#!/usr/bin/env node

/**
 * Скрипт импорта статей с WordPress сайта aimaqaqshamy.kz
 * в новую систему на NestJS + Prisma
 */

const https = require('https');
const http = require('http');

const OLD_SITE = 'https://aimaqaqshamy.kz';
const NEW_API = process.env.NEW_API_URL || 'https://aimak-api-w8ps.onrender.com';
const ADMIN_EMAIL = 'admin@aimakakshamy.kz';
const ADMIN_PASSWORD = 'admin123';

// Категории: сопоставление старых с новыми
const CATEGORY_MAP = {
  1: 'zhanalyqtar', // Uncategorized → Жаңалықтар
};

let accessToken = null;
let adminId = null;

// Утилита для HTTP запросов
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const lib = urlObj.protocol === 'https:' ? https : http;

    const req = lib.request(url, options, (res) => {
      let data = '';
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
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Логин в новую систему
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
    console.log('✅ Вход выполнен. Пользователь:', response.body.user.email);
    return true;
  } else {
    console.error('❌ Ошибка входа:', response.body);
    return false;
  }
}

// Получить категорию из новой системы
async function getCategory(slug) {
  const response = await request(`${NEW_API}/api/categories`);

  if (response.status === 200) {
    const categories = response.body;
    return categories.find(c => c.slug === slug);
  }

  return null;
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

// Создать slug из заголовка
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

// Импортировать одну статью
async function importArticle(wpPost, category) {
  const title = stripHtml(wpPost.title.rendered);
  const content = wpPost.content.rendered;
  const excerpt = wpPost.excerpt ? stripHtml(wpPost.excerpt.rendered) : title.substring(0, 200);
  const slug = createSlug(title);

  const articleData = {
    titleKz: title,
    slugKz: slug + '-' + wpPost.id, // Добавляем ID чтобы избежать дубликатов
    contentKz: content,
    excerptKz: excerpt,
    categoryId: category.id,
    authorId: adminId,
    status: 'PUBLISHED',
    published: true,
    publishedAt: wpPost.date,
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
  console.log('📰 ИМПОРТ СТАТЕЙ С AIMAQAQSHAMY.KZ');
  console.log('=====================================\n');

  // Вход
  const loggedIn = await login();
  if (!loggedIn) {
    process.exit(1);
  }

  // Получаем категорию
  const category = await getCategory('zhanalyqtar');
  if (!category) {
    console.error('❌ Категория "zhanalyqtar" не найдена');
    process.exit(1);
  }

  console.log('✅ Категория найдена:', category.nameKz);

  // Спрашиваем сколько импортировать
  const args = process.argv.slice(2);
  const limit = args[0] ? parseInt(args[0]) : 10;

  console.log(`\n📊 Импорт первых ${limit} статей...\n`);

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

      process.stdout.write(`📝 [${imported + 1}/${limit}] ${stripHtml(post.title.rendered).substring(0, 60)}... `);

      const result = await importArticle(post, category);

      if (result.success) {
        console.log('✅');
        imported++;
      } else {
        console.log('❌', result.error.message || 'Ошибка');
        failed++;
      }

      // Небольшая задержка чтобы не перегружать API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    page++;

    if (page > totalPages) {
      break;
    }
  }

  console.log('\n=====================================');
  console.log(`✅ Импортировано: ${imported}`);
  console.log(`❌ Ошибок: ${failed}`);
  console.log('=====================================\n');
}

main().catch(console.error);
