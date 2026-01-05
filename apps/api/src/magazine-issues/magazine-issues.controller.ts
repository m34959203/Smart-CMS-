import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { MagazineIssuesService } from './magazine-issues.service';
import { CreateMagazineIssueDto } from './dto/create-magazine-issue.dto';
import { UpdateMagazineIssueDto } from './dto/update-magazine-issue.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Role } from '@prisma/client';

@ApiTags('Magazine Issues')
@Controller('magazine-issues')
export class MagazineIssuesController {
  constructor(private readonly magazineIssuesService: MagazineIssuesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Загрузить новый выпуск журнала (Editor/Admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'PDF файл выпуска журнала',
        },
        issueNumber: { type: 'number', example: 1 },
        publishDate: { type: 'string', example: '2025-01-15T00:00:00Z' },
        titleKz: { type: 'string', example: 'Қаңтар айының шығарылымы' },
        titleRu: { type: 'string', example: 'Январский выпуск' },
        pagesCount: { type: 'number', example: 120 },
        coverImageUrl: { type: 'string', example: 'https://example.com/cover.jpg' },
        isPublished: { type: 'boolean', example: true },
        isPinned: { type: 'boolean', example: false },
      },
      required: ['file', 'issueNumber', 'publishDate', 'titleKz', 'titleRu'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createMagazineIssueDto: CreateMagazineIssueDto,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('PDF файл обязателен');
    }

    // Transformation is now handled by @Transform decorators in the DTO
    return this.magazineIssuesService.create(createMagazineIssueDto, file, user.id);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Получить все выпуски журнала' })
  @ApiQuery({ name: 'published', required: false, type: Boolean, description: 'Фильтр по статусу публикации' })
  findAll(@Query('published') published?: string) {
    const publishedBool = published === 'true' ? true : published === 'false' ? false : undefined;
    return this.magazineIssuesService.findAll(publishedBool);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Получить выпуск по ID' })
  findOne(@Param('id') id: string) {
    return this.magazineIssuesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить выпуск (Editor/Admin only)' })
  update(@Param('id') id: string, @Body() updateMagazineIssueDto: UpdateMagazineIssueDto) {
    return this.magazineIssuesService.update(id, updateMagazineIssueDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить выпуск (Editor/Admin only)' })
  remove(@Param('id') id: string) {
    return this.magazineIssuesService.remove(id);
  }

  @Post(':id/view')
  @Public()
  @ApiOperation({ summary: 'Увеличить счетчик просмотров' })
  incrementViews(@Param('id') id: string) {
    return this.magazineIssuesService.incrementViews(id);
  }

  @Post(':id/download')
  @Public()
  @ApiOperation({ summary: 'Увеличить счетчик скачиваний' })
  incrementDownloads(@Param('id') id: string) {
    return this.magazineIssuesService.incrementDownloads(id);
  }
}
