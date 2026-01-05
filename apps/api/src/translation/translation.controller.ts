import { Controller, Post, Body, UseGuards, UsePipes, ValidationPipe, Logger } from '@nestjs/common';
import { TranslationService } from './translation.service';
import { TranslateDto, TranslateArticleDto } from './dto/translate.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('translation')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TranslationController {
  private readonly logger = new Logger(TranslationController.name);

  constructor(private readonly translationService: TranslationService) {}

  @Post('text')
  @Roles('EDITOR', 'ADMIN')
  @UsePipes(new ValidationPipe({ transform: true }))
  async translateText(@Body() translateDto: TranslateDto) {
    this.logger.log('Text translation request received');
    return this.translationService.translateText(translateDto);
  }

  @Post('article')
  @Roles('EDITOR', 'ADMIN')
  @UsePipes(new ValidationPipe({ transform: true }))
  async translateArticle(@Body() translateArticleDto: TranslateArticleDto) {
    this.logger.log('Article translation request received');
    this.logger.debug(`Request data: ${JSON.stringify({
      titleLength: translateArticleDto.title?.length,
      contentLength: translateArticleDto.content?.length,
      sourceLanguage: translateArticleDto.sourceLanguage,
      targetLanguage: translateArticleDto.targetLanguage,
    })}`);
    return this.translationService.translateArticle(translateArticleDto);
  }
}
