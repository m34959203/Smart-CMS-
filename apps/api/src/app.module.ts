import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './common/prisma/prisma.module';
import { SupabaseModule } from './common/supabase/supabase.module';
import { AIModule } from './common/ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ArticlesModule } from './articles/articles.module';
import { CategoriesModule } from './categories/categories.module';
import { TagsModule } from './tags/tags.module';
import { HealthModule } from './health/health.module';
import { SetupModule } from './setup/setup.module';
import { MediaModule } from './media/media.module';
import { AdvertisementsModule } from './advertisements/advertisements.module';
import { MagazineIssuesModule } from './magazine-issues/magazine-issues.module';
import { TranslationModule } from './translation/translation.module';
import { SocialMediaModule } from './social-media/social-media.module';
import { AppController } from './app.controller';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { BootstrapAdminService } from './bootstrap-admin.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    SupabaseModule,
    AIModule,
    AuthModule,
    UsersModule,
    ArticlesModule,
    CategoriesModule,
    TagsModule,
    HealthModule,
    SetupModule,
    MediaModule,
    AdvertisementsModule,
    MagazineIssuesModule,
    TranslationModule,
    SocialMediaModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    BootstrapAdminService,
  ],
})
export class AppModule {}
