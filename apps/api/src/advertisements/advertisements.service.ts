import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateAdvertisementDto } from './dto/create-advertisement.dto';
import { UpdateAdvertisementDto } from './dto/update-advertisement.dto';
import { AdPosition } from '@prisma/client';

@Injectable()
export class AdvertisementsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAdvertisementDto) {
    const data: any = {
      ...dto,
    };

    if (dto.startDate) {
      data.startDate = new Date(dto.startDate);
    }
    if (dto.endDate) {
      data.endDate = new Date(dto.endDate);
    }

    return this.prisma.advertisement.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.advertisement.findMany({
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findActive() {
    const now = new Date();
    return this.prisma.advertisement.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: null },
          { startDate: null, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: { gte: now } },
        ],
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findByPosition(position: AdPosition) {
    const now = new Date();
    return this.prisma.advertisement.findMany({
      where: {
        position,
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: null },
          { startDate: null, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: { gte: now } },
        ],
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 1,
    });
  }

  async findOne(id: string) {
    const ad = await this.prisma.advertisement.findUnique({
      where: { id },
    });

    if (!ad) {
      throw new NotFoundException(`Advertisement with ID ${id} not found`);
    }

    return ad;
  }

  async update(id: string, dto: UpdateAdvertisementDto) {
    await this.findOne(id);

    const data: any = {
      ...dto,
    };

    if (dto.startDate) {
      data.startDate = new Date(dto.startDate);
    }
    if (dto.endDate) {
      data.endDate = new Date(dto.endDate);
    }

    return this.prisma.advertisement.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.advertisement.delete({
      where: { id },
    });
  }

  async incrementImpressions(id: string) {
    return this.prisma.advertisement.update({
      where: { id },
      data: {
        totalImpressions: {
          increment: 1,
        },
      },
    });
  }

  async incrementClicks(id: string) {
    return this.prisma.advertisement.update({
      where: { id },
      data: {
        totalClicks: {
          increment: 1,
        },
      },
    });
  }
}
