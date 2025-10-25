import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { AddFavoriteDto } from './dto/addFavorite.dto';
import { PrismaService } from 'src/config/prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async addFavorite(userID: number, dto: AddFavoriteDto) {
    // Validar que el usuario existe
    const user = await this.prisma.user.findUnique({
      where: { userID },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userID} no encontrado`);
    }

    // Validar que el producto existe y está activo
    const product = await this.prisma.product.findUnique({
      where: { productID: dto.productID },
    });

    if (!product) {
      throw new NotFoundException(
        `Producto con ID ${dto.productID} no encontrado`,
      );
    }

    if (!product.isActive) {
      throw new BadRequestException(
        'No se puede agregar a favoritos un producto inactivo',
      );
    }

    // Verificar si ya existe en favoritos
    const existingFavorite = await this.prisma.favorite.findUnique({
      where: {
        userID_productID: {
          userID,
          productID: dto.productID,
        },
      },
    });

    if (existingFavorite) {
      throw new ConflictException('Este producto ya está en tus favoritos');
    }

    // Crear el favorito
    const favorite = await this.prisma.favorite.create({
      data: {
        userID,
        productID: dto.productID,
      },
      include: {
        product: {
          include: {
            images: {
              where: { isMain: true },
              take: 1,
            },
            category: true,
            gender: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Producto agregado a favoritos exitosamente',
      data: {
        favoriteID: favorite.favoriteID,
        addedAt: favorite.addedAt,
        product: {
          productID: favorite.product.productID,
          name: favorite.product.name,
          description: favorite.product.description,
          basePrice: favorite.product.basePrice,
          category: favorite.product.category.categoryName,
          gender: favorite.product.gender.genderName,
          mainImage: favorite.product.images[0]?.imageURL || null,
        },
      },
    };
  }

  async getUserFavorites(userID: number) {
    // Validar que el usuario existe
    const user = await this.prisma.user.findUnique({
      where: { userID },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userID} no encontrado`);
    }

    const favorites = await this.prisma.favorite.findMany({
      where: { userID },
      include: {
        product: {
          include: {
            images: {
              where: { isMain: true },
              take: 1,
            },
            category: true,
            gender: true,
            variants: {
              where: { isActive: true },
              select: {
                price: true,
                stock: true,
              },
            },
          },
        },
      },
      orderBy: {
        addedAt: 'desc',
      },
    });

    // Filtrar productos activos
    const activeFavorites = favorites.filter((fav) => fav.product.isActive);

    return {
      success: true,
      count: activeFavorites.length,
      data: activeFavorites.map((fav) => ({
        favoriteID: fav.favoriteID,
        addedAt: fav.addedAt,
        product: {
          productID: fav.product.productID,
          name: fav.product.name,
          description: fav.product.description,
          basePrice: fav.product.basePrice,
          category: fav.product.category.categoryName,
          gender: fav.product.gender.genderName,
          mainImage: fav.product.images[0]?.imageURL || null,
          minPrice: Math.min(
            ...fav.product.variants.map((v) => Number(v.price)),
          ),
          maxPrice: Math.max(
            ...fav.product.variants.map((v) => Number(v.price)),
          ),
          totalStock: fav.product.variants.reduce((sum, v) => sum + v.stock, 0),
        },
      })),
    };
  }

  async removeFavorite(userID: number, productID: number) {
    // Buscar el favorito
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userID_productID: {
          userID,
          productID,
        },
      },
    });

    if (!favorite) {
      throw new NotFoundException('Este producto no está en tus favoritos');
    }

    // Eliminar el favorito
    await this.prisma.favorite.delete({
      where: {
        favoriteID: favorite.favoriteID,
      },
    });

    return {
      success: true,
      message: 'Producto eliminado de favoritos exitosamente',
    };
  }

  async checkFavorite(userID: number, productID: number) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userID_productID: {
          userID,
          productID,
        },
      },
    });

    return {
      success: true,
      isFavorite: !!favorite,
      favoriteID: favorite?.favoriteID || null,
    };
  }

  async getFavoritesCount(userID: number) {
    const count = await this.prisma.favorite.count({
      where: {
        userID,
        product: {
          isActive: true,
        },
      },
    });

    return {
      success: true,
      count,
    };
  }
}
