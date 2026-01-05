import { IsNotEmpty, IsString, IsInt, Min, Max, IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMagazineIssueDto {
  @ApiProperty({ example: 1, description: 'Номер выпуска' })
  @Transform(({ value }) => {
    // Handle both direct number and string from FormData
    const num = typeof value === 'string' ? parseInt(value, 10) : value;
    return isNaN(num) ? value : num;
  })
  @IsInt()
  @Min(1)
  issueNumber!: number;

  @ApiProperty({ example: '2025-01-15T00:00:00Z', description: 'Дата публикации' })
  @IsDateString()
  publishDate!: string;

  @ApiProperty({ example: 'Қаңтар айының шығарылымы', description: 'Название на казахском' })
  @IsString()
  @IsNotEmpty()
  titleKz!: string;

  @ApiProperty({ example: 'Январский выпуск', description: 'Название на русском' })
  @IsString()
  @IsNotEmpty()
  titleRu!: string;

  @ApiProperty({ example: 120, description: 'Количество страниц', required: false })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const num = typeof value === 'string' ? parseInt(value, 10) : value;
    return isNaN(num) ? value : num;
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  pagesCount?: number;

  @ApiProperty({ example: 'https://example.com/cover.jpg', description: 'URL обложки', required: false })
  @IsString()
  @IsOptional()
  coverImageUrl?: string;

  @ApiProperty({ example: true, description: 'Опубликован', required: false })
  @Transform(({ value }) => {
    // Handle boolean from FormData (comes as string "true"/"false")
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @ApiProperty({ example: false, description: 'Закреплен', required: false })
  @Transform(({ value }) => {
    // Handle boolean from FormData (comes as string "true"/"false")
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;
}
