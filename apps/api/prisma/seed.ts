import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Проверяем, есть ли уже админ
  const existingAdmin = await prisma.user.findFirst({
    where: { role: Role.ADMIN },
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists:', existingAdmin.email);
    return;
  }

  // Создаём админа с железобетонными credentials
  const adminEmail = 'admin@aimakakshamy.kz';
  const adminPassword = 'admin123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'Aimak Akshamy',
      role: Role.ADMIN,
      isActive: true,
      isVerified: true,
    },
  });

  console.log('✅ Admin user created:');
  console.log('   Email:', admin.email);
  console.log('   Password:', adminPassword);
  console.log('   Role:', admin.role);

  // Создаём базовые категории
  const categories = [
    {
      slug: 'news',
      nameKz: 'Жаңалықтар',
      nameRu: 'Новости',
      descriptionKz: 'Жаңалықтар',
      descriptionRu: 'Новости',
    },
    {
      slug: 'politics',
      nameKz: 'Саясат',
      nameRu: 'Политика',
      descriptionKz: 'Саяси жаңалықтар',
      descriptionRu: 'Политические новости',
    },
    {
      slug: 'economy',
      nameKz: 'Экономика',
      nameRu: 'Экономика',
      descriptionKz: 'Экономикалық жаңалықтар',
      descriptionRu: 'Экономические новости',
    },
    {
      slug: 'culture',
      nameKz: 'Мәдениет',
      nameRu: 'Культура',
      descriptionKz: 'Мәдени жаңалықтар',
      descriptionRu: 'Культурные новости',
    },
    {
      slug: 'sport',
      nameKz: 'Спорт',
      nameRu: 'Спорт',
      descriptionKz: 'Спорттық жаңалықтар',
      descriptionRu: 'Спортивные новости',
    },
  ];

  for (const [index, category] of categories.entries()) {
    const existing = await prisma.category.findUnique({
      where: { slug: category.slug },
    });

    if (!existing) {
      await prisma.category.create({
        data: {
          ...category,
          sortOrder: index,
        },
      });
      console.log(`✅ Category created: ${category.nameRu}`);
    }
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
