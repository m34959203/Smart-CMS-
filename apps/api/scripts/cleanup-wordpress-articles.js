#!/usr/bin/env node

/**
 * Удаление статей импортированных из WordPress (с испорченной кодировкой)
 */

const https = require('https');

const NEW_API = process.env.NEW_API_URL || 'https://aimak-api-w8ps.onrender.com';
const ADMIN_EMAIL = 'admin@aimakakshamy.kz';
const ADMIN_PASSWORD = 'admin123';

let accessToken = null;

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);

    const req = https.request(url, options, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
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

async function login() {
  console.log('🔐 Logging in...');

  const response = await request(`${NEW_API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
  });

  if (response.status === 200 || response.status === 201) {
    accessToken = response.body.accessToken;
    console.log('✅ Logged in as:', response.body.user.email);
    return true;
  } else {
    console.error('❌ Login failed:', response.body);
    return false;
  }
}

async function getArticles() {
  const response = await request(`${NEW_API}/api/articles`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (response.status === 200) {
    return response.body;
  }

  return [];
}

async function deleteArticle(id, title) {
  try {
    const response = await request(`${NEW_API}/api/articles/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (response.status === 200 || response.status === 204) {
      return { success: true };
    } else {
      return { success: false, error: response.body };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🗑️  CLEANUP WORDPRESS IMPORTED ARTICLES');
  console.log('=====================================\n');

  const loggedIn = await login();
  if (!loggedIn) {
    process.exit(1);
  }

  console.log('📊 Fetching articles...\n');
  const articles = await getArticles();

  // Найти статьи импортированные из WordPress (slug содержит -wp и цифры)
  const wpArticles = articles.filter(a => a.slugKz && a.slugKz.match(/-wp\d+$/));

  console.log(`Found ${wpArticles.length} WordPress articles to delete\n`);

  let deleted = 0;
  for (const article of wpArticles) {
    process.stdout.write(`🗑️  Deleting: ${article.titleKz.substring(0, 60)}... `);

    const result = await deleteArticle(article.id, article.titleKz);

    if (result.success) {
      console.log('✅');
      deleted++;
    } else {
      console.log('❌', result.error);
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n=====================================');
  console.log(`✅ Deleted: ${deleted} articles`);
  console.log('=====================================\n');
}

main().catch(console.error);
