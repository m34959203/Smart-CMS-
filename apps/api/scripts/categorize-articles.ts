#!/usr/bin/env tsx

/**
 * Скрипт для автоматического распределения статей по категориям
 * с использованием AI анализа содержимого (OpenRouter Qwen)
 */

import { PrismaClient } from '@prisma/client';
import axios, { AxiosError } from 'axios';
import * as dotenv from 'dotenv';

// Загрузка переменных окружения
dotenv.config();

const prisma = new PrismaClient();

// Инициализация OpenRouter
const openRouterKey = process.env.OPENROUTER_API_KEY;
const openRouterModel = process.env.OPENROUTER_MODEL || 'qwen/qwen3-4b:free';

// Категории из базы данных
interface Category {
  id: string;
  slug: string;
  nameKz: string;
  nameRu: string;
  descriptionKz: string | null;
  descriptionRu: string | null;
}

// Описание категорий для AI
function getCategoriesDescription(categories: Category[]): string {
  return categories.map(cat => {
    return `- ${cat.slug} (${cat.nameKz} / ${cat.nameRu}): ${cat.descriptionRu || cat.descriptionKz || 'Без описания'}`;
  }).join('\n');
}

/**
 * Использование AI для определения подходящей категории
 */
async function categorizaArticleWithAI(
  article: { titleKz: string; contentKz: string; excerptKz?: string | null },
  categories: Category[]
): Promise<string | null> {
  const categoriesDesc = getCategoriesDescription(categories);

  const prompt = `Ты - эксперт по категоризации новостных статей. Проанализируй следующую статью и определи наиболее подходящую категорию.

СТАТЬЯ:
Заголовок: ${article.titleKz}
${article.excerptKz ? `Краткое описание: ${article.excerptKz}` : ''}
Содержание: ${article.contentKz.substring(0, 2000)}${article.contentKz.length > 2000 ? '...' : ''}

ДОСТУПНЫЕ КАТЕГОРИИ:
${categoriesDesc}

ИНСТРУКЦИИ:
1. Внимательно прочитай статью
2. Определи её основную тему
3. Выбери ОДНУ наиболее подходящую категорию из списка выше
4. Верни ТОЛЬКО slug категории (например: "zhanalyqtar", "ozekti", "sayasat", "madeniyet", "qogam", "kazakhmys")
5. Если статья про компанию Kazakhmys или горнодобывающую промышленность, выбери "kazakhmys"
6. Если статья про политику или правительство, выбери "sayasat"
7. Если статья про культуру, искусство, литературу, выбери "madeniyet"
8. Если статья про социальные вопросы, общество, выбери "qogam"
9. Если статья актуальна или важна, но не подходит к специфичным категориям, выбери "ozekti"
10. Для обычных новостей выбери "zhanalyqtar"

Верни ТОЛЬКО slug категории без дополнительного текста.`;

  let aiResponse: string | null = null;

  // Используем OpenRouter (Qwen)
  if (!openRouterKey) {
    console.error('  └─ ✗ OPENROUTER_API_KEY не настроен!');
    return null;
  }

  // Retry logic with exponential backoff
  const maxRetries = 2;
  const baseDelay = 2000;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`  └─ Используем OpenRouter (Qwen) API... (попытка ${attempt + 1}/${maxRetries + 1})`);
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: openRouterModel,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 50,
        },
        {
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://aimak.kz',
            'X-Title': 'AIMAK News',
          },
        },
      );

      if (response.data?.choices && response.data.choices.length > 0) {
        const choice = response.data.choices[0];
        aiResponse = (choice?.message?.content || choice?.message?.reasoning || '').trim();
        console.log('  └─ ✓ OpenRouter ответил');
        break;
      }
    } catch (error) {
      const isAxiosError = axios.isAxiosError(error);
      const status = isAxiosError ? (error as AxiosError).response?.status : undefined;

      // Retry on 429 (rate limit) or 5xx errors
      const shouldRetry = status === 429 || (status !== undefined && status >= 500);

      if (shouldRetry && attempt < maxRetries) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt), 10000);
        console.log(`  └─ ⚠️  Ошибка ${status || 'неизвестна'}, повтор через ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      console.error('  └─ ✗ OpenRouter ошибка:', error instanceof Error ? error.message : String(error));
      if (isAxiosError && (error as AxiosError).response) {
        const errResponse = (error as AxiosError).response;
        console.error(`  └─ Статус: ${errResponse?.status}, Данные:`, errResponse?.data);
      }
      break;
    }
  }

  if (!aiResponse) {
    console.error('  └─ ✗ Не удалось получить ответ от AI');
    return null;
  }

  // Валидация ответа - проверяем, что это валидный slug категории
  const validSlugs = categories.map(c => c.slug);
  const suggestedSlug = aiResponse.toLowerCase().trim();

  if (validSlugs.includes(suggestedSlug)) {
    return suggestedSlug;
  }

  console.error(`  └─ ⚠️  AI вернул невалидный slug: "${suggestedSlug}"`);
  return null;
}

/**
 * Основная функция
 */
async function main() {
  console.log('🔍 Начинаем категоризацию статей...\n');

  try {
    // Проверка API ключей
    if (!openRouterKey) {
      console.error('❌ Ошибка: Не настроен OPENROUTER_API_KEY!');
      console.error('   Установите OPENROUTER_API_KEY в .env файле');
      console.error('   Получите ключ на: https://openrouter.ai/keys');
      process.exit(1);
    }

    console.log('✓ AI сервис настроен: OpenRouter (Qwen)');

    // Получаем все категории
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    console.log(`✓ Загружено категорий: ${categories.length}\n`);
    categories.forEach(cat => {
      console.log(`  - ${cat.slug}: ${cat.nameKz} / ${cat.nameRu}`);
    });

    if (categories.length === 0) {
      console.error('\n❌ Нет доступных категорий! Запустите seed для категорий.');
      process.exit(1);
    }

    // Получаем все статьи
    const articles = await prisma.article.findMany({
      select: {
        id: true,
        titleKz: true,
        titleRu: true,
        contentKz: true,
        excerptKz: true,
        categoryId: true,
        category: {
          select: {
            slug: true,
            nameRu: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`\n✓ Найдено статей: ${articles.length}\n`);

    if (articles.length === 0) {
      console.log('Нет статей для обработки.');
      return;
    }

    // Статистика
    let processed = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // Обрабатываем каждую статью
    for (const article of articles) {
      processed++;
      console.log(`\n[${processed}/${articles.length}] ${article.titleKz || article.titleRu || 'Без названия'}`);
      console.log(`  └─ Текущая категория: ${article.category?.nameRu || 'Не установлена'} (${article.category?.slug || 'N/A'})`);

      try {
        // Используем AI для определения категории
        const suggestedSlug = await categorizaArticleWithAI(
          {
            titleKz: article.titleKz,
            contentKz: article.contentKz,
            excerptKz: article.excerptKz,
          },
          categories
        );

        if (!suggestedSlug) {
          console.log('  └─ ⚠️  Пропускаем - не удалось определить категорию');
          skipped++;
          continue;
        }

        const suggestedCategory = categories.find(c => c.slug === suggestedSlug);

        if (!suggestedCategory) {
          console.log(`  └─ ⚠️  Пропускаем - категория ${suggestedSlug} не найдена`);
          skipped++;
          continue;
        }

        // Проверяем, нужно ли обновлять
        if (article.category?.slug === suggestedSlug) {
          console.log(`  └─ ✓ Категория уже правильная: ${suggestedCategory.nameRu}`);
          skipped++;
          continue;
        }

        // Обновляем категорию
        await prisma.article.update({
          where: { id: article.id },
          data: { categoryId: suggestedCategory.id },
        });

        console.log(`  └─ ✅ Обновлено: ${article.category?.nameRu || 'Не установлена'} → ${suggestedCategory.nameRu}`);
        updated++;

        // Небольшая задержка, чтобы не превысить rate limit API
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`  └─ ✗ Ошибка при обработке: ${error instanceof Error ? error.message : String(error)}`);
        errors++;
      }
    }

    // Итоговая статистика
    console.log('\n' + '='.repeat(60));
    console.log('📊 ИТОГИ:');
    console.log('='.repeat(60));
    console.log(`Всего обработано:     ${processed}`);
    console.log(`Обновлено:            ${updated}`);
    console.log(`Пропущено:            ${skipped}`);
    console.log(`Ошибок:               ${errors}`);
    console.log('='.repeat(60) + '\n');

    // Показываем распределение по категориям
    console.log('📈 РАСПРЕДЕЛЕНИЕ ПО КАТЕГОРИЯМ:\n');
    for (const category of categories) {
      const count = await prisma.article.count({
        where: { categoryId: category.id },
      });
      console.log(`  ${category.nameRu.padEnd(25)} ${count} статей`);
    }

    console.log('\n✅ Готово!');

  } catch (error) {
    console.error('\n❌ Критическая ошибка:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запуск
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Фатальная ошибка:', error);
    process.exit(1);
  });
