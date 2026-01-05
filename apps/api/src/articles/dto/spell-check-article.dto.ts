import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SpellCheckArticleDto {
  @ApiProperty({ description: 'Article title in Kazakh', required: false })
  @IsString()
  @IsOptional()
  titleKz?: string;

  @ApiProperty({ description: 'Article content in Kazakh', required: false })
  @IsString()
  @IsOptional()
  contentKz?: string;

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
}
