import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsArray, IsEnum } from 'class-validator';
import { SocialMediaPlatform } from '@prisma/client';

export enum ArticleStatus {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export class UpdateArticleDto {
  // Kazakh content
  @ApiPropertyOptional({ example: 'Жаңартылған тақырып' })
  @IsString()
  @IsOptional()
  titleKz?: string;

  @ApiPropertyOptional({ example: 'Жаңартылған мазмұн...' })
  @IsString()
  @IsOptional()
  contentKz?: string;

  @ApiPropertyOptional({ example: 'Жаңартылған сипаттама' })
  @IsString()
  @IsOptional()
  excerptKz?: string;

  // Russian content
  @ApiPropertyOptional({ example: 'Обновленный заголовок' })
  @IsString()
  @IsOptional()
  titleRu?: string;

  @ApiPropertyOptional({ example: 'Обновленное содержание...' })
  @IsString()
  @IsOptional()
  contentRu?: string;

  @ApiPropertyOptional({ example: 'Обновленное описание' })
  @IsString()
  @IsOptional()
  excerptRu?: string;

  // Common fields
  @ApiPropertyOptional({ example: 'https://example.com/new-image.jpg' })
  @IsString()
  @IsOptional()
  coverImage?: string;

  @ApiPropertyOptional({ example: 'new-category-uuid' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: ['tag-uuid-1', 'tag-uuid-3'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tagIds?: string[];

  // Status and flags
  @ApiPropertyOptional({ example: 'PUBLISHED', enum: ArticleStatus })
  @IsEnum(ArticleStatus)
  @IsOptional()
  status?: ArticleStatus;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isBreaking?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  allowComments?: boolean;

  // Social Media Auto-Publish
  @ApiPropertyOptional({ example: false, description: 'Automatically publish to social media' })
  @IsBoolean()
  @IsOptional()
  autoPublishEnabled?: boolean;

  @ApiPropertyOptional({ example: ['TELEGRAM', 'INSTAGRAM'], enum: SocialMediaPlatform, isArray: true })
  @IsArray()
  @IsEnum(SocialMediaPlatform, { each: true })
  @IsOptional()
  autoPublishPlatforms?: SocialMediaPlatform[];

  // Backward compatibility
  @ApiPropertyOptional({ example: true, deprecated: true, description: 'Use status=PUBLISHED instead' })
  @IsBoolean()
  @IsOptional()
  published?: boolean;
}
