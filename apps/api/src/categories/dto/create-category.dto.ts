import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateCategoryDto {
  // Legacy field (optional for backward compatibility)
  @ApiPropertyOptional({ example: 'Technology' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Articles about technology' })
  @IsString()
  @IsOptional()
  description?: string;

  // Bilingual fields
  @ApiPropertyOptional({ example: 'Технология' })
  @IsString()
  @IsOptional()
  nameKz?: string;

  @ApiPropertyOptional({ example: 'Технология' })
  @IsString()
  @IsOptional()
  nameRu?: string;

  @ApiPropertyOptional({ example: 'custom-slug' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ example: 'Технология туралы мақалалар' })
  @IsString()
  @IsOptional()
  descriptionKz?: string;

  @ApiPropertyOptional({ example: 'Статьи о технологиях' })
  @IsString()
  @IsOptional()
  descriptionRu?: string;
}
