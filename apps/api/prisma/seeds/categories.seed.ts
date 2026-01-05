import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  {
    slug: 'zhanalyqtar',
    nameKz: 'ЖАҢАЛЫҚТАР',
    nameRu: 'НОВОСТИ',
    descriptionKz: 'Сатпаев қаласы мен облысының соңғы жаңалықтары',
    descriptionRu: 'Последние новости города Сатпаев и области',
    sortOrder: 1,
  },
  {
    slug: 'ozekti',
    nameKz: 'ӨЗЕКТІ',
    nameRu: 'АКТУАЛЬНО',
    descriptionKz: 'Өзекті мәселелер мен маңызды оқиғалар',
    descriptionRu: 'Актуальные вопросы и важные события',
    sortOrder: 2,
  },
  {
    slug: 'sayasat',
    nameKz: 'САЯСАТ',
    nameRu: 'ПОЛИТИКА',
    descriptionKz: 'Саяси жаңалықтар және талдаулар',
    descriptionRu: 'Политические новости и аналитика',
    sortOrder: 3,
  },
  {
    slug: 'madeniyet',
    nameKz: 'МӘДЕНИЕТ',
    nameRu: 'КУЛЬТУРА',
    descriptionKz: 'Мәдени оқиғалар, өнер және әдебиет',
    descriptionRu: 'Культурные события, искусство и литература',
    sortOrder: 4,
  },
  {
    slug: 'qogam',
    nameKz: 'ҚОҒАМ',
    nameRu: 'ОБЩЕСТВО',
    descriptionKz: 'Қоғамдық өмір және әлеуметтік мәселелер',
    descriptionRu: 'Общественная жизнь и социальные вопросы',
    sortOrder: 5,
  },
  {
    slug: 'kazakhmys',
    nameKz: 'Казахмыс',
    nameRu: 'Казахмыс',
    descriptionKz: 'Қазақмыс корпорациясы жаңалықтары',
    descriptionRu: 'Новости корпорации Казахмыс',
    sortOrder: 6,
  },
];

async function seedCategories() {
  console.log('🌱 Seeding categories...');

  for (const category of categories) {
    const existing = await prisma.category.findUnique({
      where: { slug: category.slug },
    });

    if (existing) {
      console.log(`✓ Category "${category.slug}" already exists, updating...`);
      await prisma.category.update({
        where: { slug: category.slug },
        data: category,
      });
    } else {
      console.log(`+ Creating category "${category.slug}"...`);
      await prisma.category.create({
        data: category,
      });
    }
  }

  console.log('✅ Categories seeded successfully!');
}

async function main() {
  try {
    await seedCategories();
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
