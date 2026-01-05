import { IsArray, IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { SocialMediaPlatform } from '@prisma/client';

export class PublishToSocialMediaDto {
  @IsString()
  articleId!: string;

  @IsArray()
  @IsEnum(SocialMediaPlatform, { each: true })
  platforms!: SocialMediaPlatform[];

  @IsBoolean()
  @IsOptional()
  forceRepublish?: boolean;
}
