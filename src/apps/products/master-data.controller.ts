import { Controller, Post, Body } from '@nestjs/common';
import { MasterDataService } from './master-data.service';
import {
  CreateRoleDto,
  CreateGenderDto,
  CreateCategoryDto,
  CreateSizeDto,
  CreateColorDto,
} from './dto/master-data.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('MasterData')
@Controller('products/master')
export class MasterDataController {
  constructor(private readonly master: MasterDataService) {}

  @Post('role')
  @ApiOperation({ summary: 'Crear role básico (si no existe)' })
  async createRole(@Body() dto: CreateRoleDto) {
    return this.master.createRole(dto);
  }

  @Post('gender')
  @ApiOperation({ summary: 'Crear gender básico (si no existe)' })
  async createGender(@Body() dto: CreateGenderDto) {
    return this.master.createGender(dto);
  }

  @Post('category')
  @ApiOperation({ summary: 'Crear category básica (si no existe)' })
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.master.createCategory(dto);
  }

  @Post('size')
  @ApiOperation({ summary: 'Crear size básica (si no existe)' })
  async createSize(@Body() dto: CreateSizeDto) {
    return this.master.createSize(dto);
  }

  @Post('color')
  @ApiOperation({ summary: 'Crear color básico (si no existe)' })
  async createColor(@Body() dto: CreateColorDto) {
    return this.master.createColor(dto);
  }

  @Post('init')
  @ApiOperation({
    summary:
      'Inicializar datos maestros por defecto (roles, genders, categories, sizes, colors)',
  })
  async initDefaults() {
    return this.master.createDefaults();
  }
}
