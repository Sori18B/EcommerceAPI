import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ApiCookieAuth } from 'src/middlewares/auth/cookie-auth.decorator';

@ApiTags('Carrito de Compras')
@ApiCookieAuth()
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener mi carrito completo',
    description:
      'Retorna el carrito del usuario autenticado con todos sus items, información de productos y resumen de totales.',
  })
  @ApiResponse({
    status: 200,
    description: 'Carrito obtenido exitosamente',
    schema: {
      example: {
        success: true,
        data: {
          cartID: 1,
          items: [
            {
              cartItemID: 1,
              quantity: 2,
              addedAt: '2025-10-25T12:00:00.000Z',
              productVariant: {
                productVariantID: 1,
                sku: 'CAM-M-NEG-1234',
                price: 299.0,
                stock: 50,
                size: 'M',
                color: {
                  name: 'Negro',
                  hexCode: '#000000',
                },
                product: {
                  productID: 1,
                  name: 'Camiseta Básica de Algodón',
                  mainImage: 'https://example.com/image.jpg',
                  category: 'Camisetas',
                  gender: 'Unisex',
                },
              },
              subtotal: 598.0,
            },
          ],
          summary: {
            totalItems: 1,
            totalQuantity: 2,
            subtotal: 598.0,
            estimatedTotal: 598.0,
          },
        },
      },
    },
  })
  async getCart(@Request() req: any) {
    try {
      const userID = req.user.userID;
      return await this.cartService.getCart(userID);
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Error al obtener el carrito',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('items')
  @ApiOperation({
    summary: 'Agregar producto al carrito',
    description:
      'Agrega un producto (variante específica con talla y color) al carrito. Si ya existe, incrementa la cantidad. Valida stock disponible.',
  })
  @ApiResponse({
    status: 201,
    description: 'Producto agregado exitosamente',
    schema: {
      example: {
        success: true,
        message: 'Producto agregado al carrito exitosamente',
        data: {
          cartItemID: 1,
          quantity: 2,
          addedAt: '2025-10-25T12:00:00.000Z',
          productVariant: {
            productVariantID: 1,
            sku: 'CAM-M-NEG-1234',
            price: 299.0,
            stock: 50,
            size: 'M',
            color: {
              name: 'Negro',
              hexCode: '#000000',
            },
            product: {
              productID: 1,
              name: 'Camiseta Básica',
              mainImage: 'https://example.com/image.jpg',
              category: 'Camisetas',
              gender: 'Unisex',
            },
          },
          subtotal: 598.0,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Stock insuficiente o producto no disponible',
    schema: {
      example: {
        success: false,
        message: 'Stock insuficiente. Solo hay 5 unidades disponibles',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Variante de producto no encontrada',
    schema: {
      example: {
        success: false,
        message: 'Variante de producto con ID 999 no encontrada',
      },
    },
  })
  async addToCart(@Body() dto: AddToCartDto, @Request() req: any) {
    try {
      const userID = req.user.userID;
      return await this.cartService.addToCart(userID, dto);
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Error al agregar al carrito',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('items/:cartItemID')
  @ApiOperation({
    summary: 'Actualizar cantidad de un item',
    description:
      'Actualiza la cantidad de un producto específico en el carrito. Valida que no exceda el stock disponible.',
  })
  @ApiParam({
    name: 'cartItemID',
    type: 'number',
    description: 'ID del item en el carrito',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Cantidad actualizada exitosamente',
    schema: {
      example: {
        success: true,
        message: 'Cantidad actualizada exitosamente',
        data: {
          cartItemID: 1,
          quantity: 5,
          productVariant: {
            productVariantID: 1,
            sku: 'CAM-M-NEG-1234',
            price: 299.0,
            stock: 50,
            size: 'M',
            color: {
              name: 'Negro',
              hexCode: '#000000',
            },
            product: {
              productID: 1,
              name: 'Camiseta Básica',
              mainImage: 'https://example.com/image.jpg',
              category: 'Camisetas',
              gender: 'Unisex',
            },
          },
          subtotal: 1495.0,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Stock insuficiente o item no pertenece al usuario',
    schema: {
      example: {
        success: false,
        message: 'Stock insuficiente. Solo hay 3 unidades disponibles',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Item no encontrado',
    schema: {
      example: {
        success: false,
        message: 'Item no encontrado en el carrito',
      },
    },
  })
  async updateCartItem(
    @Param('cartItemID', ParseIntPipe) cartItemID: number,
    @Body() dto: UpdateCartItemDto,
    @Request() req: any,
  ) {
    try {
      const userID = req.user.userID;
      return await this.cartService.updateCartItem(userID, cartItemID, dto);
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Error al actualizar el item',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('items/:cartItemID')
  @ApiOperation({
    summary: 'Eliminar item del carrito',
    description:
      'Elimina un producto específico del carrito del usuario autenticado.',
  })
  @ApiParam({
    name: 'cartItemID',
    type: 'number',
    description: 'ID del item a eliminar',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Item eliminado exitosamente',
    schema: {
      example: {
        success: true,
        message: 'Producto eliminado del carrito exitosamente',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Item no encontrado',
    schema: {
      example: {
        success: false,
        message: 'Item no encontrado en el carrito',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Item no pertenece al usuario',
    schema: {
      example: {
        success: false,
        message: 'Este item no pertenece a tu carrito',
      },
    },
  })
  async removeCartItem(
    @Param('cartItemID', ParseIntPipe) cartItemID: number,
    @Request() req: any,
  ) {
    try {
      const userID = req.user.userID;
      return await this.cartService.removeCartItem(userID, cartItemID);
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Error al eliminar el item',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete()
  @ApiOperation({
    summary: 'Vaciar todo el carrito',
    description:
      'Elimina todos los productos del carrito del usuario autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Carrito vaciado exitosamente',
    schema: {
      example: {
        success: true,
        message: 'Carrito vaciado exitosamente',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'No tiene carrito activo',
    schema: {
      example: {
        success: false,
        message: 'No tienes un carrito activo',
      },
    },
  })
  async clearCart(@Request() req: any) {
    try {
      const userID = req.user.userID;
      return await this.cartService.clearCart(userID);
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Error al vaciar el carrito',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('summary')
  @ApiOperation({
    summary: 'Obtener resumen del carrito',
    description:
      'Retorna solo los totales del carrito sin detalles de productos (útil para header/badge).',
  })
  @ApiResponse({
    status: 200,
    description: 'Resumen obtenido exitosamente',
    schema: {
      example: {
        success: true,
        data: {
          totalItems: 3,
          totalQuantity: 7,
          subtotal: 2497.0,
          estimatedTotal: 2497.0,
        },
      },
    },
  })
  async getCartSummary(@Request() req: any) {
    try {
      const userID = req.user.userID;
      return await this.cartService.getCartSummary(userID);
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Error al obtener el resumen',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
