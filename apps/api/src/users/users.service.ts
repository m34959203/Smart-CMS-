import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(take = 100, skip = 0) {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      take, // Limit results to prevent memory exhaustion
      skip,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        articles: {
          select: {
            id: true,
            titleKz: true,
            titleRu: true,
            slugKz: true,
            slugRu: true,
            published: true,
            publishedAt: true,
            createdAt: true,
          },
          take: 50, // Limit articles to prevent memory exhaustion
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'User deleted successfully' };
  }

  /**
   * Временный метод для создания первого админа
   * Работает только если в системе ещё нет админов
   */
  async createFirstAdmin(email: string) {
    // Проверяем, есть ли уже админы в системе
    const existingAdmins = await this.prisma.user.count({
      where: { role: Role.ADMIN },
    });

    if (existingAdmins > 0) {
      throw new ForbiddenException('Admin already exists in the system');
    }

    // Находим пользователя по email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    if (user.role === Role.ADMIN) {
      throw new BadRequestException('User is already an admin');
    }

    // Повышаем до админа
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { role: Role.ADMIN },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: 'First admin created successfully',
      user: updatedUser,
    };
  }
}
