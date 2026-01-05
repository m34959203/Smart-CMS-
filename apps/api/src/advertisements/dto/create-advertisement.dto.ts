import { IsString, IsEnum, IsOptional, IsBoolean, IsInt, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdType, AdPosition, AdSize } from '@prisma/client';

export class CreateAdvertisementDto {
  @ApiProperty()
  @IsString()
  code!: string;

  @ApiProperty()
  @IsString()
  nameKz!: string;

  @ApiProperty()
  @IsString()
  nameRu!: string;

  @ApiProperty({ enum: AdType })
  @IsEnum(AdType)
  type!: AdType;

  @ApiProperty({ enum: AdPosition })
  @IsEnum(AdPosition)
  position!: AdPosition;

  @ApiProperty({ enum: AdSize })
  @IsEnum(AdSize)
  size!: AdSize;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customHtml?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clickUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  yandexBlockId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  googleAdSlot?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  googleAdClient?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  priority?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
