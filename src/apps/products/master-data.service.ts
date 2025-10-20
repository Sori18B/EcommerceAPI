import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/config/prisma/prisma.service';
import {
  CreateRoleDto,
  CreateGenderDto,
  CreateCategoryDto,
  CreateSizeDto,
  CreateColorDto,
} from './dto/master-data.dto';

@Injectable()
export class MasterDataService {
  constructor(private prisma: PrismaService) {}

  async createRole(dto: CreateRoleDto) {
    const existing = await this.prisma.role.findUnique({
      where: { roleName: dto.roleName },
    });

    if (existing)
      return { success: true, message: 'Role already exists', role: existing };

    const role = await this.prisma.role.create({
      data: { roleName: dto.roleName },
    });
    return { success: true, role };
  }

  async createGender(dto: CreateGenderDto) {
    const existing = await this.prisma.gender.findFirst({
      where: { genderName: dto.genderName },
    });
    if (existing)
      return {
        success: true,
        message: 'Gender already exists',
        gender: existing,
      };

    const gender = await this.prisma.gender.create({
      data: { genderName: dto.genderName },
    });
    return { success: true, gender };
  }

  async createCategory(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findFirst({
      where: { categoryName: dto.categoryName },
    });
    if (existing)
      return {
        success: true,
        message: 'Category already exists',
        category: existing,
      };

    const category = await this.prisma.category.create({
      data: {
        categoryName: dto.categoryName,
        description: dto.description || null,
        isActive: dto.isActive ?? true,
      },
    });
    return { success: true, category };
  }

  async createSize(dto: CreateSizeDto) {
    const existing = await this.prisma.size.findFirst({
      where: { sizeLabel: dto.sizeLabel },
    });
    if (existing)
      return { success: true, message: 'Size already exists', size: existing };

    const size = await this.prisma.size.create({
      data: { sizeLabel: dto.sizeLabel, sizeOrder: dto.sizeOrder ?? 0 },
    });
    return { success: true, size };
  }

  async createColor(dto: CreateColorDto) {
    const existing = await this.prisma.color.findFirst({
      where: { colorName: dto.colorName },
    });
    if (existing)
      return {
        success: true,
        message: 'Color already exists',
        color: existing,
      };

    const color = await this.prisma.color.create({
      data: { colorName: dto.colorName, hexCode: dto.hexCode },
    });
    return { success: true, color };
  }

  // Crear datos base por defecto (idempotente)
  async createDefaults() {
    const roles = ['admin', 'user', 'moderator'];
    const genders = ['Hombre', 'Mujer', 'Unisex', 'Niño', 'Niña'];
    const categories = [
      { categoryName: 'Ropa', description: 'Prendas de vestir en general' },
      { categoryName: 'Calzado', description: 'Zapatos, tenis y sandalias' },
      {
        categoryName: 'Accesorios',
        description: 'Bolsas, cinturones y complementos',
      },
      { categoryName: 'Deportivo', description: 'Ropa y equipo deportivo' },
      { categoryName: 'Casual', description: 'Ropa para uso diario' },
    ];
    const sizes = [
      'XS',
      'S',
      'M',
      'L',
      'XL',
      'XXL',
      '28',
      '30',
      '32',
      '34',
      '36',
      '38',
    ];
    const colors = [
      { colorName: 'Negro', hexCode: '#000000' },
      { colorName: 'Blanco', hexCode: '#FFFFFF' },
      { colorName: 'Azul', hexCode: '#0066CC' },
      { colorName: 'Rojo', hexCode: '#CC0000' },
      { colorName: 'Verde', hexCode: '#00CC00' },
      { colorName: 'Amarillo', hexCode: '#FFCC00' },
      { colorName: 'Rosa', hexCode: '#FF6699' },
      { colorName: 'Gris', hexCode: '#666666' },
      { colorName: 'Morado', hexCode: '#6600CC' },
      { colorName: 'Naranja', hexCode: '#FF6600' },
    ];

    const result = await this.prisma.$transaction(async (prisma) => {
      const createdRoles = [] as any[];
      for (const r of roles) {
        const existing = await prisma.role.findUnique({
          where: { roleName: r },
        });
        if (!existing)
          createdRoles.push(
            await prisma.role.create({ data: { roleName: r } }),
          );
      }

      const createdGenders = [] as any[];
      for (const g of genders) {
        const existing = await prisma.gender.findFirst({
          where: { genderName: g },
        });
        if (!existing)
          createdGenders.push(
            await prisma.gender.create({ data: { genderName: g } }),
          );
      }

      const createdCategories = [] as any[];
      for (const c of categories) {
        const existing = await prisma.category.findFirst({
          where: { categoryName: c.categoryName },
        });
        if (!existing)
          createdCategories.push(
            await prisma.category.create({
              data: {
                categoryName: c.categoryName,
                description: c.description,
                isActive: true,
              },
            }),
          );
      }

      const createdSizes = [] as any[];
      let order = 1;
      for (const s of sizes) {
        const existing = await prisma.size.findFirst({
          where: { sizeLabel: s },
        });
        if (!existing)
          createdSizes.push(
            await prisma.size.create({
              data: { sizeLabel: s, sizeOrder: order++ },
            }),
          );
      }

      const createdColors = [] as any[];
      for (const col of colors) {
        const existing = await prisma.color.findFirst({
          where: { colorName: col.colorName },
        });
        if (!existing)
          createdColors.push(
            await prisma.color.create({
              data: { colorName: col.colorName, hexCode: col.hexCode },
            }),
          );
      }

      return {
        createdRoles,
        createdGenders,
        createdCategories,
        createdSizes,
        createdColors,
      };
    });

    return { success: true, seeded: result };
  }
}
