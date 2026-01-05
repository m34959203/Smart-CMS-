import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SupabaseService } from '../common/supabase/supabase.service';
import { CreateMagazineIssueDto } from './dto/create-magazine-issue.dto';
import { UpdateMagazineIssueDto } from './dto/update-magazine-issue.dto';

@Injectable()
export class MagazineIssuesService {
  private readonly logger = new Logger(MagazineIssuesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  /**
   * Создать новый выпуск журнала
   */
  async create(dto: CreateMagazineIssueDto, pdfFile: Express.Multer.File, userId: string) {
    // Upload PDF to Supabase Storage
    const uploadResult = await this.supabase.uploadFile(
      pdfFile.buffer,
      pdfFile.originalname,
      pdfFile.mimetype,
    );

    if (!uploadResult) {
      this.logger.error('Failed to upload PDF to Supabase');
      throw new BadRequestException('Failed to upload PDF file');
    }

    this.logger.log(`PDF uploaded successfully: ${uploadResult.url}`);

    // Создать запись в БД
    const issue = await this.prisma.magazineIssue.create({
      data: {
        issueNumber: dto.issueNumber,
        publishDate: new Date(dto.publishDate),
        titleKz: dto.titleKz,
        titleRu: dto.titleRu,
        pdfFilename: uploadResult.path,
        pdfUrl: uploadResult.url,
        fileSize: pdfFile.size,
        pagesCount: dto.pagesCount,
        coverImageUrl: dto.coverImageUrl,
        isPublished: dto.isPublished ?? true,
        isPinned: dto.isPinned ?? false,
        uploadedById: userId,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return issue;
  }

  /**
   * Получить все выпуски (с фильтрацией)
   */
  async findAll(published?: boolean) {
    try {
      const where: any = {};

      if (published !== undefined) {
        where.isPublished = published;
      }

      const issues = await this.prisma.magazineIssue.findMany({
        where,
        orderBy: [
          { isPinned: 'desc' },
          { publishDate: 'desc' },
          { issueNumber: 'desc' },
        ],
        include: {
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return issues;
    } catch (error) {
      console.error('Error in magazineIssuesService.findAll:', error);
      // Возвращаем пустой массив вместо ошибки, если таблица пуста
      return [];
    }
  }

  /**
   * Получить один выпуск по ID
   */
  async findOne(id: string) {
    const issue = await this.prisma.magazineIssue.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!issue) {
      throw new NotFoundException(`Выпуск с ID ${id} не найден`);
    }

    return issue;
  }


  /**
   * Обновить выпуск
   */
  async update(id: string, dto: UpdateMagazineIssueDto) {
    await this.findOne(id);

    return await this.prisma.magazineIssue.update({
      where: { id },
      data: {
        ...dto,
        publishDate: dto.publishDate ? new Date(dto.publishDate) : undefined,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Удалить выпуск
   */
  async remove(id: string) {
    const issue = await this.findOne(id);

    // Удалить PDF файл из Supabase Storage
    try {
      await this.supabase.deleteFile(issue.pdfFilename);
    } catch (error) {
      this.logger.error(`Не удалось удалить файл ${issue.pdfFilename} из Supabase:`, error);
      // Продолжаем удаление записи из БД даже если файл не удален
    }

    // Удалить запись из БД
    await this.prisma.magazineIssue.delete({
      where: { id },
    });

    return { message: 'Выпуск успешно удален' };
  }

  /**
   * Увеличить счетчик просмотров
   */
  async incrementViews(id: string) {
    // Проверить существование записи
    const issue = await this.prisma.magazineIssue.findUnique({
      where: { id },
    });

    if (!issue) {
      throw new NotFoundException(`Выпуск с ID ${id} не найден`);
    }

    return await this.prisma.magazineIssue.update({
      where: { id },
      data: {
        viewsCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Увеличить счетчик скачиваний
   */
  async incrementDownloads(id: string) {
    // Проверить существование записи
    const issue = await this.prisma.magazineIssue.findUnique({
      where: { id },
    });

    if (!issue) {
      throw new NotFoundException(`Выпуск с ID ${id} не найден`);
    }

    return await this.prisma.magazineIssue.update({
      where: { id },
      data: {
        downloadsCount: {
          increment: 1,
        },
      },
    });
  }

}
