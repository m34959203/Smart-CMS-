import { IsBoolean, IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { SocialMediaPlatform } from '@prisma/client';

export class UpdateSocialMediaConfigDto {
  @IsEnum(SocialMediaPlatform)
  platform!: SocialMediaPlatform;

  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['kz', 'ru'])
  defaultLanguage?: string;

  // Telegram
  @IsOptional()
  @IsString()
  botToken?: string;

  @IsOptional()
  @IsString()
  chatId?: string;

  // Instagram
  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  pageId?: string;

  // Instagram Webhooks
  @IsOptional()
  @IsString()
  webhookVerifyToken?: string;

  @IsOptional()
  @IsBoolean()
  webhookEnabled?: boolean;

  @IsOptional()
  @IsString()
  webhookAppSecret?: string;

  // TikTok
  @IsOptional()
  @IsString()
  tiktokClientKey?: string;

  @IsOptional()
  @IsString()
  tiktokClientSecret?: string;

  @IsOptional()
  @IsString()
  tiktokAccessToken?: string;

  @IsOptional()
  @IsString()
  tiktokRefreshToken?: string;

  @IsOptional()
  @IsString()
  tiktokOpenId?: string;

  // Facebook
  @IsOptional()
  @IsString()
  facebookAccessToken?: string;

  @IsOptional()
  @IsString()
  facebookPageId?: string;
}
