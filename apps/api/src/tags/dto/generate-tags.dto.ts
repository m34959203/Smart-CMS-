import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateTagsDto {
  @ApiProperty({ description: 'Article title in Kazakh', required: true })
  @IsString()
  titleKz!: string;

  @ApiProperty({ description: 'Article content in Kazakh', required: true })
  @IsString()
  contentKz!: string;

  @ApiProperty({ description: 'Article title in Russian', required: false })
  @IsString()
  @IsOptional()
  titleRu?: string;

  @ApiProperty({ description: 'Article content in Russian', required: false })
  @IsString()
  @IsOptional()
  contentRu?: string;
}
