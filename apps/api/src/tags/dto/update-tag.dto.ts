import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateTagDto {
  @ApiPropertyOptional({ example: 'Updated Tag Name' })
  @IsString()
  @IsOptional()
  name?: string;
}
