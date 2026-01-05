import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdvertisementsService } from './advertisements.service';
import { CreateAdvertisementDto } from './dto/create-advertisement.dto';
import { UpdateAdvertisementDto } from './dto/update-advertisement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Role, AdPosition } from '@prisma/client';

@ApiTags('advertisements')
@Controller('advertisements')
export class AdvertisementsController {
  constructor(private advertisementsService: AdvertisementsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create advertisement (Admin only)' })
  create(@Body() dto: CreateAdvertisementDto) {
    return this.advertisementsService.create(dto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all advertisements' })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  findAll(@Query('active') active?: string) {
    if (active === 'true') {
      return this.advertisementsService.findActive();
    }
    return this.advertisementsService.findAll();
  }

  @Get('position/:position')
  @Public()
  @ApiOperation({ summary: 'Get advertisement by position' })
  findByPosition(@Param('position') position: AdPosition) {
    return this.advertisementsService.findByPosition(position);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get advertisement by ID' })
  findOne(@Param('id') id: string) {
    return this.advertisementsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update advertisement (Admin only)' })
  update(@Param('id') id: string, @Body() dto: UpdateAdvertisementDto) {
    return this.advertisementsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete advertisement (Admin only)' })
  remove(@Param('id') id: string) {
    return this.advertisementsService.remove(id);
  }

  @Post(':id/impression')
  @Public()
  @ApiOperation({ summary: 'Increment advertisement impressions' })
  incrementImpressions(@Param('id') id: string) {
    return this.advertisementsService.incrementImpressions(id);
  }

  @Post(':id/click')
  @Public()
  @ApiOperation({ summary: 'Increment advertisement clicks' })
  incrementClicks(@Param('id') id: string) {
    return this.advertisementsService.incrementClicks(id);
  }
}
