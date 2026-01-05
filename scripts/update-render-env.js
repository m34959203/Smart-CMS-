#!/usr/bin/env node

/**
 * Скрипт для обновления переменных окружения в Render через API
 *
 * Использование:
 *   1. Получите API ключ Render: https://dashboard.render.com/account/settings
 *   2. Найдите Service ID: https://dashboard.render.com/web/<YOUR_SERVICE_ID>
 *   3. Запустите: node scripts/update-render-env.js <SERVICE_ID> <RENDER_API_KEY>
 *
 * Или используйте переменные окружения:
 *   RENDER_API_KEY=<key> SERVICE_ID=<id> node scripts/update-render-env.js
 */

const https = require('https');

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

// Получаем параметры
const SERVICE_ID = process.argv[2] || process.env.SERVICE_ID;
const RENDER_API_KEY = process.argv[3] || process.env.RENDER_API_KEY;

// Новые значения переменных
const NEW_GEMINI_KEY = process.env.NEW_GEMINI_KEY || 'AIzaSyAkB14IdkDF6KwtZ3aVtpIhGRBU68wdDIs';
const NEW_OPENROUTER_MODEL = process.env.NEW_OPENROUTER_MODEL || 'meta-llama/llama-3.2-3b-instruct:free';

// Проверка параметров
if (!SERVICE_ID || !RENDER_API_KEY) {
  console.error(`${colors.red}Ошибка: Не указаны обязательные параметры${colors.reset}\n`);
  console.log('Использование:');
  console.log(`  ${colors.cyan}node scripts/update-render-env.js <SERVICE_ID> <RENDER_API_KEY>${colors.reset}`);
  console.log('\nИли используйте переменные окружения:');
  console.log(`  ${colors.cyan}RENDER_API_KEY=<key> SERVICE_ID=<id> node scripts/update-render-env.js${colors.reset}`);
  console.log('\nПолучите API ключ: https://dashboard.render.com/account/settings');
  console.log('Найдите Service ID в URL: https://dashboard.render.com/web/<YOUR_SERVICE_ID>');
  process.exit(1);
}

console.log(`${colors.yellow}==================================================`);
console.log('  Обновление переменных окружения Render');
console.log(`==================================================${colors.reset}\n`);
console.log(`Service ID: ${SERVICE_ID}`);
console.log(`\n${colors.yellow}Переменные для обновления:${colors.reset}`);
console.log(`  GEMINI_API_KEY: ${NEW_GEMINI_KEY.substring(0, 20)}...`);
console.log(`  OPENROUTER_MODEL: ${NEW_OPENROUTER_MODEL}\n`);

/**
 * Обновить переменную окружения через Render API
 */
function updateEnvVar(key, value) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ value });

    const options = {
      hostname: 'api.render.com',
      port: 443,
      path: `/v1/services/${SERVICE_ID}/env-vars/${key}`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, statusCode: res.statusCode, body });
        } else {
          resolve({ success: false, statusCode: res.statusCode, body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Главная функция
 */
async function main() {
  try {
    // Обновляем GEMINI_API_KEY
    process.stdout.write('Обновление GEMINI_API_KEY... ');
    const geminiResult = await updateEnvVar('GEMINI_API_KEY', NEW_GEMINI_KEY);
    if (geminiResult.success) {
      console.log(`${colors.green}✓ OK${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ Ошибка (HTTP ${geminiResult.statusCode})${colors.reset}`);
      console.log(`Response: ${geminiResult.body}`);
    }

    // Обновляем OPENROUTER_MODEL
    process.stdout.write('Обновление OPENROUTER_MODEL... ');
    const openrouterResult = await updateEnvVar('OPENROUTER_MODEL', NEW_OPENROUTER_MODEL);
    if (openrouterResult.success) {
      console.log(`${colors.green}✓ OK${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ Ошибка (HTTP ${openrouterResult.statusCode})${colors.reset}`);
      console.log(`Response: ${openrouterResult.body}`);
    }

    console.log(`\n${colors.green}==================================================`);
    console.log('  Обновление завершено!');
    console.log(`==================================================${colors.reset}\n`);
    console.log(`${colors.yellow}Следующие шаги:${colors.reset}`);
    console.log('1. Render автоматически передеплоит сервис');
    console.log('2. Дождитесь завершения деплоя (~3-5 минут)');
    console.log(`3. Проверьте логи: https://dashboard.render.com/web/${SERVICE_ID}/logs`);
    console.log(`4. Проверьте переменные: https://dashboard.render.com/web/${SERVICE_ID}/env\n`);

  } catch (error) {
    console.error(`\n${colors.red}Критическая ошибка:${colors.reset}`, error);
    process.exit(1);
  }
}

main();
