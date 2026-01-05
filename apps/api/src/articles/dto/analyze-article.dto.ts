import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AnalyzeArticleDto {
  @ApiProperty({ description: 'Article title in Kazakh', required: true })
  @IsString()
  titleKz!: string;

  @ApiProperty({ description: 'Article content in Kazakh', required: true })
  @IsString()
  contentKz!: string;

  @ApiProperty({ description: 'Article excerpt in Kazakh', required: false })
  @IsString()
  @IsOptional()
  excerptKz?: string;

  @ApiProperty({ description: 'Article title in Russian', required: false })
  @IsString()
  @IsOptional()
  titleRu?: string;

  @ApiProperty({ description: 'Article content in Russian', required: false })
  @IsString()
  @IsOptional()
  contentRu?: string;

  @ApiProperty({ description: 'Article excerpt in Russian', required: false })
  @IsString()
  @IsOptional()
  excerptRu?: string;

  @ApiProperty({
    description: 'Target language for AI improvements (kz or ru)',
    required: false,
    enum: ['kz', 'ru'],
    default: 'kz'
  })
  @IsString()
  @IsIn(['kz', 'ru'])
  @IsOptional()
  targetLanguage?: 'kz' | 'ru';
}
