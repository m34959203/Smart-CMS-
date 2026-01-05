import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsArray, IsEnum } from 'class-validator';
import { SocialMediaPlatform } from '@prisma/client';

export enum ArticleStatus {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export class CreateArticleDto {
  // Kazakh content (required)
  @ApiProperty({ example: 'Сатпаевтың соңғы жаңалықтары' })
  @IsString()
  @IsNotEmpty()
  titleKz!: string;

  @ApiProperty({ example: 'Мақала мазмұны казахша...' })
  @IsString()
  @IsNotEmpty()
  contentKz!: string;

  @ApiPropertyOptional({ example: 'Мақаланың қысқаша сипаттамасы' })
  @IsString()
  @IsOptional()
  excerptKz?: string;

  // Russian content (optional)
  @ApiPropertyOptional({ example: 'Последние новости Сатпаева' })
  @IsString()
  @IsOptional()
  titleRu?: string;

  @ApiPropertyOptional({ example: 'Содержание статьи на русском...' })
  @IsString()
  @IsOptional()
  contentRu?: string;

  @ApiPropertyOptional({ example: 'Краткое описание статьи' })
  @IsString()
  @IsOptional()
  excerptRu?: string;

  // Common fields
  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsString()
  @IsOptional()
  coverImage?: string;

  @ApiProperty({ example: 'category-uuid' })
  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @ApiPropertyOptional({ example: ['tag-uuid-1', 'tag-uuid-2'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tagIds?: string[];

  // Status and flags
  @ApiPropertyOptional({ example: 'DRAFT', enum: ArticleStatus })
  @IsEnum(ArticleStatus)
  @IsOptional()
  status?: ArticleStatus;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isBreaking?: boolean;

  @ApiPropertyOptional({ example: false })
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
  @ApiPropertyOptional({ example: false, deprecated: true, description: 'Use status=PUBLISHED instead' })
  @IsBoolean()
  @IsOptional()
  published?: boolean;
}
