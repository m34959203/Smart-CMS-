import { Module, forwardRef } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { ArticleCategorizationService } from './article-categorization.service';
import { TranslationModule } from '../translation/translation.module';
import { SocialMediaModule } from '../social-media/social-media.module';

@Module({
  imports: [TranslationModule, forwardRef(() => SocialMediaModule)],
  controllers: [ArticlesController],
  providers: [ArticlesService, ArticleCategorizationService],
  exports: [ArticlesService, ArticleCategorizationService],
})
export class ArticlesModule {}
