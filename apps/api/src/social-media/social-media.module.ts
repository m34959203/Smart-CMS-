import { Module } from '@nestjs/common';
import { SocialMediaController } from './social-media.controller';
import { SocialMediaService } from './social-media.service';
import { TelegramService } from './telegram.service';
import { InstagramService } from './instagram.service';
import { InstagramWebhookService } from './instagram-webhook.service';
import { InstagramWebhookController } from './instagram-webhook.controller';
import { TiktokService } from './tiktok.service';
import { TiktokOAuthController } from './tiktok-oauth.controller';
import { FacebookService } from './facebook.service';
import { PrismaService } from '../common/prisma/prisma.service';

@Module({
  controllers: [SocialMediaController, InstagramWebhookController, TiktokOAuthController],
  providers: [
    SocialMediaService,
    TelegramService,
    InstagramService,
    InstagramWebhookService,
    TiktokService,
    FacebookService,
    PrismaService,
  ],
  exports: [SocialMediaService, InstagramWebhookService],
})
export class SocialMediaModule {}
