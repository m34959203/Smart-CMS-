#!/usr/bin/env node

/**
 * Проверка категорий на WordPress сайте
 */

const https = require('https');

const OLD_SITE = 'https://aimaqaqshamy.kz';

function request(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('Получаю категории с WordPress...\n');

  try {
    // Получить категории
    const categories = await request(`${OLD_SITE}/wp-json/wp/v2/categories?per_page=100`);

    console.log('Найдено категорий:', categories.length);
    console.log('\nСписок категорий:\n');

    categories.forEach(cat => {
      console.log(`ID: ${cat.id}, Slug: ${cat.slug}, Name: ${cat.name}, Count: ${cat.count}`);
    });

    // Получить несколько статей для анализа категорий
    console.log('\n\nПолучаю статьи для анализа...\n');
    const posts = await request(`${OLD_SITE}/wp-json/wp/v2/posts?per_page=20&_embed`);

    const categoryStats = {};
    posts.forEach(post => {
      post.categories.forEach(catId => {
        if (!categoryStats[catId]) {
          categoryStats[catId] = 0;
        }
        categoryStats[catId]++;
      });
    });

    console.log('Категории в первых 20 статьях:');
    Object.entries(categoryStats).forEach(([catId, count]) => {
      const cat = categories.find(c => c.id === parseInt(catId));
      console.log(`  ${cat?.name || 'Unknown'} (ID: ${catId}): ${count} статей`);
    });

  } catch (error) {
    console.error('Ошибка:', error.message);
  }
}

main();
