import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SocialMediaService } from './social-media.service';
import { PublishToSocialMediaDto } from './dto/publish-to-social-media.dto';
import { UpdateSocialMediaConfigDto } from './dto/update-social-media-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, SocialMediaPlatform } from '@prisma/client';

@Controller('social-media')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SocialMediaController {
  constructor(private readonly socialMediaService: SocialMediaService) {}

  /**
   * Опубликовать статью в социальные сети
   * POST /social-media/publish
   * @param dto.forceRepublish - если true, публикует повторно даже если уже была успешная публикация
   */
  @Post('publish')
  @Roles(Role.EDITOR, Role.ADMIN)
  async publishArticle(@Body() dto: PublishToSocialMediaDto) {
    return this.socialMediaService.publishArticle(
      dto.articleId,
      dto.platforms,
      dto.forceRepublish || false,
    );
  }

  /**
   * Получить конфигурацию платформы
   * GET /social-media/config/:platform
   */
  @Get('config/:platform')
  @Roles(Role.ADMIN)
  async getConfig(@Param('platform') platform: SocialMediaPlatform) {
    return this.socialMediaService.getConfig(platform);
  }

  /**
   * Получить все конфигурации
   * GET /social-media/config
   */
  @Get('config')
  @Roles(Role.ADMIN)
  async getAllConfigs() {
    return this.socialMediaService.getAllConfigs();
  }

  /**
   * Обновить конфигурацию платформы
   * PUT /social-media/config/:platform
   */
  @Put('config/:platform')
  @Roles(Role.ADMIN)
  async updateConfig(
    @Param('platform') platform: SocialMediaPlatform,
    @Body() dto: UpdateSocialMediaConfigDto,
  ) {
    return this.socialMediaService.updateConfig(platform, dto);
  }

  /**
   * Получить историю публикаций статьи
   * GET /social-media/publications/:articleId
   */
  @Get('publications/:articleId')
  @Roles(Role.EDITOR, Role.ADMIN)
  async getPublications(@Param('articleId') articleId: string) {
    return this.socialMediaService.getPublications(articleId);
  }
}
