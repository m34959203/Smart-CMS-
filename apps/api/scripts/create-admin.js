#!/usr/bin/env node

/**
 * Скрипт для создания админа вручную
 * Использование: node scripts/create-admin.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  console.log('🔧 Creating admin user...');

  try {
    // Проверяем подключение к БД
    await prisma.$connect();
    console.log('✅ Connected to database');

    // Проверяем, есть ли уже админ с таким email
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@aimakakshamy.kz' },
    });

    if (existingAdmin) {
      console.log('⚠️  Admin already exists with email: admin@aimakakshamy.kz');
      console.log('   ID:', existingAdmin.id);
      console.log('   Role:', existingAdmin.role);
      console.log('   Created:', existingAdmin.createdAt);

      // Обновляем пароль
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true,
          isVerified: true,
        },
      });
      console.log('✅ Password updated to: admin123');
      return;
    }

    // Создаём нового админа
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.create({
      data: {
        email: 'admin@aimakakshamy.kz',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Aimak Akshamy',
        role: 'ADMIN',
        isActive: true,
        isVerified: true,
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('   Email:', admin.email);
    console.log('   Password: admin123');
    console.log('   Role:', admin.role);
    console.log('   ID:', admin.id);

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    if (error.code === 'P2002') {
      console.error('   User with this email already exists');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin()
  .then(() => {
    console.log('\n✨ Done! You can now login with:');
    console.log('   Email: admin@aimakakshamy.kz');
    console.log('   Password: admin123');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
