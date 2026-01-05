import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Updated Category Name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Жаңалықтар' })
  @IsString()
  @IsOptional()
  nameKz?: string;

  @ApiPropertyOptional({ example: 'Новости' })
  @IsString()
  @IsOptional()
  nameRu?: string;

  @ApiPropertyOptional({ example: 'Жаңалықтар сипаттамасы' })
  @IsString()
  @IsOptional()
  descriptionKz?: string;

  @ApiPropertyOptional({ example: 'Описание новостей' })
  @IsString()
  @IsOptional()
  descriptionRu?: string;
}
