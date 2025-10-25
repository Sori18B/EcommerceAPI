import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Delete,
  ParseIntPipe,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { AddFavoriteDto } from './dto/addFavorite.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ApiCookieAuth } from 'src/middlewares/auth/cookie-auth.decorator';

@ApiTags('Favoritos')
@ApiCookieAuth()
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  @ApiOperation({
    summary: 'Agregar producto a favoritos',
    description:
      'Agrega un producto a la lista de favoritos del usuario autenticado. Valida que el producto exista y esté activo.',
  })
  @ApiResponse({
    status: 201,
    description: 'Producto agregado a favoritos exitosamente',
    schema: {
      example: {
        success: true,
        message: 'Producto agregado a favoritos exitosamente',
        data: {
          favoriteID: 1,
          addedAt: '2025-10-25T12:00:00.000Z',
          product: {
            productID: 1,
            name: 'Camisa Elegante',
            description: 'Camisa de algodón premium',
            basePrice: 599.99,
            category: 'Camisas',
            gender: 'Hombre',
            mainImage: 'https://example.com/image.jpg',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Producto no encontrado',
    schema: {
      example: {
        success: false,
        message: 'Producto con ID 999 no encontrado',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'El producto ya está en favoritos',
    schema: {
      example: {
        success: false,
        message: 'Este producto ya está en tus favoritos',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Producto inactivo',
    schema: {
      example: {
        success: false,
        message: 'No se puede agregar a favoritos un producto inactivo',
      },
    },
  })
  async addFavorite(@Body() dto: AddFavoriteDto, @Request() req: any) {
    try {
      const userID = req.user.userID;
      return await this.favoritesService.addFavorite(userID, dto);
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Error al agregar a favoritos',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener mis favoritos',
    description:
      'Obtiene la lista completa de productos favoritos del usuario autenticado, ordenados por fecha de agregado (más recientes primero).',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de favoritos obtenida exitosamente',
    schema: {
      example: {
        success: true,
        count: 3,
        data: [
          {
            favoriteID: 1,
            addedAt: '2025-10-25T12:00:00.000Z',
            product: {
              productID: 1,
              name: 'Camisa Elegante',
              description: 'Camisa de algodón premium',
              basePrice: 599.99,
              category: 'Camisas',
              gender: 'Hombre',
              mainImage: 'https://example.com/image.jpg',
              minPrice: 499.99,
              maxPrice: 699.99,
              totalStock: 50,
            },
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  async getMyFavorites(@Request() req: any) {
    try {
      const userID = req.user.userID;
      return await this.favoritesService.getUserFavorites(userID);
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Error al obtener favoritos',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':productID')
  @ApiOperation({
    summary: 'Eliminar producto de favoritos',
    description:
      'Elimina un producto específico de la lista de favoritos del usuario autenticado.',
  })
  @ApiParam({
    name: 'productID',
    type: 'number',
    description: 'ID del producto a eliminar de favoritos',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Producto eliminado de favoritos exitosamente',
    schema: {
      example: {
        success: true,
        message: 'Producto eliminado de favoritos exitosamente',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'El producto no está en favoritos',
    schema: {
      example: {
        success: false,
        message: 'Este producto no está en tus favoritos',
      },
    },
  })
  async removeFavorite(
    @Param('productID', ParseIntPipe) productID: number,
    @Request() req: any,
  ) {
    try {
      const userID = req.user.userID;
      return await this.favoritesService.removeFavorite(userID, productID);
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Error al eliminar de favoritos',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('check/:productID')
  @ApiOperation({
    summary: 'Verificar si un producto está en favoritos',
    description:
      'Verifica si un producto específico está en la lista de favoritos del usuario autenticado.',
  })
  @ApiParam({
    name: 'productID',
    type: 'number',
    description: 'ID del producto a verificar',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Verificación exitosa',
    schema: {
      example: {
        success: true,
        isFavorite: true,
        favoriteID: 1,
      },
    },
  })
  async checkFavorite(
    @Param('productID', ParseIntPipe) productID: number,
    @Request() req: any,
  ) {
    try {
      const userID = req.user.userID;
      return await this.favoritesService.checkFavorite(userID, productID);
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Error al verificar favorito',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('count')
  @ApiOperation({
    summary: 'Obtener cantidad de favoritos',
    description:
      'Obtiene el número total de productos favoritos del usuario autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Conteo de favoritos obtenido exitosamente',
    schema: {
      example: {
        success: true,
        count: 5,
      },
    },
  })
  async getFavoritesCount(@Request() req: any) {
    try {
      const userID = req.user.userID;
      return await this.favoritesService.getFavoritesCount(userID);
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Error al obtener conteo',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
