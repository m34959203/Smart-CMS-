import { PrismaClient, ArticleStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function publishAllArticles() {
  try {
    console.log('🔍 Проверка статей...\n');

    const allArticles = await prisma.article.findMany({
      include: {
        category: true,
        author: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    console.log(`Найдено статей: ${allArticles.length}\n`);

    if (allArticles.length === 0) {
      console.log('❌ В базе данных нет статей!');
      return;
    }

    // Показать текущий статус
    allArticles.forEach((article, index) => {
      console.log(`Статья #${index + 1}:`);
      console.log(`  Заголовок: ${article.titleKz}`);
      console.log(`  Категория: ${article.category?.nameKz || 'N/A'}`);
      console.log(`  Статус: ${article.status}`);
      console.log(`  Published: ${article.published}`);
      console.log('');
    });

    // Обновить все статьи на PUBLISHED
    console.log('📝 Изменяю статус всех статей на PUBLISHED...\n');

    const result = await prisma.article.updateMany({
      data: {
        status: ArticleStatus.PUBLISHED,
        published: true,
        publishedAt: new Date(),
      }
    });

    console.log(`✅ Обновлено статей: ${result.count}`);

    // Проверить результат
    const publishedArticles = await prisma.article.findMany({
      where: {
        published: true,
      },
      include: {
        category: true,
      }
    });

    console.log(`\n✅ Теперь опубликовано статей: ${publishedArticles.length}`);

    publishedArticles.forEach((article, index) => {
      console.log(`\n${index + 1}. ${article.titleKz}`);
      console.log(`   Категория: ${article.category?.nameKz}`);
      console.log(`   Slug (KZ): ${article.slugKz}`);
      console.log(`   URL: /kz/${article.category?.slug}/${article.slugKz}`);
    });

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

publishAllArticles();
