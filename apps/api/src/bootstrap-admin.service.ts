import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from './common/prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class BootstrapAdminService implements OnModuleInit {
  private readonly logger = new Logger(BootstrapAdminService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.createDefaultAdmin();
  }

  private async createDefaultAdmin() {
    try {
      // Проверяем, есть ли уже админы в системе
      const adminCount = await this.prisma.user.count({
        where: { role: Role.ADMIN },
      });

      if (adminCount > 0) {
        this.logger.log('Admin user already exists, skipping bootstrap');
        return;
      }

      // Проверяем, есть ли уже пользователь с таким email
      const existingUser = await this.prisma.user.findUnique({
        where: { email: 'admin@aimak.kz' },
      });

      if (existingUser) {
        // Если пользователь существует, просто повышаем до админа
        await this.prisma.user.update({
          where: { id: existingUser.id },
          data: { role: Role.ADMIN },
        });
        this.logger.log('✅ Existing user admin@aimak.kz promoted to ADMIN');
      } else {
        // Создаём нового админа
        const hashedPassword = await bcrypt.hash('YourPassword123!', 10);

        await this.prisma.user.create({
          data: {
            email: 'admin@aimak.kz',
            password: hashedPassword,
            firstName: 'Admin',
            lastName: 'User',
            role: Role.ADMIN,
          },
        });

        this.logger.log('✅ Default admin created successfully');
        this.logger.log('   Email: admin@aimak.kz');
        this.logger.log('   Password: YourPassword123!');
        this.logger.log('   ⚠️  ВАЖНО: Смените пароль после первого входа!');
      }
    } catch (error) {
      this.logger.error('Failed to create default admin:', error);
    }
  }
}
