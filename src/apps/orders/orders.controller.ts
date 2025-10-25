import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Req,
  ParseIntPipe,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiCookieAuth,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { Roles } from 'src/middlewares/auth/roles.decorator';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  // ========================
  // ENDPOINTS PARA USUARIOS
  // ========================

  @Post()
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Crear orden desde carrito',
    description:
      'Crea una orden a partir del carrito actual del usuario. Valida stock, calcula totales y reduce inventario. El carrito se vacía automáticamente.',
  })
  @ApiResponse({
    status: 201,
    description: 'Orden creada exitosamente',
    schema: {
      example: {
        success: true,
        message: 'Orden creada exitosamente',
        data: {
          orderID: 1,
          orderStatus: 'pending',
          totalAmount: 1895.52,
          currency: 'mxn',
          itemsCount: 3,
          createdAt: '2025-10-25T12:00:00.000Z',
          order: {
            orderID: 1,
            userID: 2,
            orderStatus: 'pending',
            subtotalAmount: 1495.0,
            taxAmount: 239.2,
            shippingAmount: 99.0,
            totalAmount: 1833.2,
            orderDetails: [],
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Carrito vacío, stock insuficiente o dirección inválida',
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async createOrder(@Req() req: Request, @Body() dto: CreateOrderDto) {
    const userID = (req.user as any).userID;
    return this.ordersService.createOrderFromCart(userID, dto);
  }

  @Post('checkout')
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Crear sesión de Stripe Checkout',
    description:
      'Crea una sesión de pago en Stripe Checkout. Redirige al usuario a Stripe para completar el pago. Al confirmar, el webhook creará la orden automáticamente.',
  })
  @ApiResponse({
    status: 201,
    description: 'Sesión de Stripe creada exitosamente',
    schema: {
      example: {
        success: true,
        message: 'Sesión de checkout creada exitosamente',
        data: {
          sessionId: 'cs_test_a1234567890',
          sessionUrl:
            'https://checkout.stripe.com/c/pay/cs_test_a1234567890#fidkdWxOYHdgddsa',
          expiresAt: '2025-10-25T13:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Carrito vacío, stock insuficiente o dirección inválida',
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async createCheckoutSession(@Req() req: Request, @Body() dto: CheckoutDto) {
    const userID = (req.user as any).userID;
    return this.ordersService.createCheckoutSession(userID, dto);
  }

  @Get()
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Obtener mis órdenes',
    description:
      'Retorna el historial completo de órdenes del usuario actual, ordenadas por fecha (más recientes primero).',
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de órdenes',
    schema: {
      example: {
        success: true,
        data: {
          ordersCount: 5,
          orders: [
            {
              orderID: 1,
              orderStatus: 'delivered',
              orderDate: '2025-10-20T10:00:00.000Z',
              totalAmount: 1895.52,
              currency: 'mxn',
              itemsCount: 3,
              totalQuantity: 5,
              trackingNumber: 'DHL123456789',
              estimatedDeliveryDate: '2025-10-25T00:00:00.000Z',
              deliveryStatus: 'Entregado',
              paymentStatus: 'Pagado',
              items: [
                {
                  productName: 'Camiseta Básica',
                  variantSKU: 'CAM-M-NEG-1234',
                  size: 'M',
                  color: 'Negro',
                  quantity: 2,
                  priceAtPurchase: 299.0,
                  totalPrice: 598.0,
                  mainImage: 'https://example.com/image.jpg',
                },
              ],
              shippingAddress: {
                street: 'Av. Principal 123',
                city: 'Ciudad de México',
                state: 'CDMX',
                postalCode: '01234',
                countryCode: 'MX',
              },
            },
          ],
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async getUserOrders(@Req() req: Request) {
    const userID = (req.user as any).userID;
    return this.ordersService.getUserOrders(userID);
  }

  @Get(':orderID')
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Obtener detalle de orden',
    description:
      'Retorna información completa de una orden específica. Solo el dueño de la orden puede verla.',
  })
  @ApiParam({
    name: 'orderID',
    description: 'ID de la orden',
    example: 1,
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalle de la orden',
    schema: {
      example: {
        success: true,
        data: {
          orderID: 1,
          orderStatus: 'delivered',
          orderDate: '2025-10-20T10:00:00.000Z',
          subtotalAmount: 1495.0,
          taxAmount: 239.2,
          shippingAmount: 99.0,
          totalAmount: 1833.2,
          currency: 'mxn',
          paymentMethod: 'card',
          paidAt: '2025-10-20T10:05:00.000Z',
          trackingNumber: 'DHL123456789',
          estimatedDeliveryDate: '2025-10-25T00:00:00.000Z',
          actualDeliveryDate: '2025-10-24T14:30:00.000Z',
          customerNote: 'Por favor entreguen por la tarde',
          adminNote: 'Orden enviada con DHL',
          deliveryStatus: 'Entregado',
          paymentStatus: 'Pagado',
          items: [
            {
              orderDetailID: 1,
              productName: 'Camiseta Básica',
              variantSKU: 'CAM-M-NEG-1234',
              size: 'M',
              color: 'Negro',
              colorHex: '#000000',
              quantity: 2,
              priceAtPurchase: 299.0,
              subtotal: 598.0,
              discountAmount: 0.0,
              totalPrice: 598.0,
              mainImage: 'https://example.com/image.jpg',
            },
          ],
          shippingAddress: {
            firstName: 'Juan',
            lastName: 'Pérez',
            street: 'Av. Principal 123',
            neighborhood: 'Centro',
            city: 'Ciudad de México',
            state: 'CDMX',
            postalCode: '01234',
            countryCode: 'MX',
          },
          billingAddress: {
            firstName: 'Juan',
            lastName: 'Pérez',
            street: 'Av. Principal 123',
            neighborhood: 'Centro',
            city: 'Ciudad de México',
            state: 'CDMX',
            postalCode: '01234',
            countryCode: 'MX',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({
    status: 403,
    description: 'No tienes permiso para ver esta orden',
  })
  @ApiResponse({ status: 404, description: 'Orden no encontrada' })
  async getOrderById(
    @Req() req: Request,
    @Param('orderID', ParseIntPipe) orderID: number,
  ) {
    const userID = (req.user as any).userID;
    return this.ordersService.getOrderById(userID, orderID);
  }

  @Post(':orderID/cancel')
  @ApiCookieAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancelar orden',
    description:
      'Cancela una orden pendiente o en proceso. No se pueden cancelar órdenes enviadas o entregadas. Restaura el stock automáticamente.',
  })
  @ApiParam({
    name: 'orderID',
    description: 'ID de la orden a cancelar',
    example: 1,
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Orden cancelada exitosamente',
    schema: {
      example: {
        success: true,
        message: 'Orden cancelada exitosamente. El stock ha sido restaurado.',
        data: {
          orderID: 1,
          orderStatus: 'cancelled',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Orden no se puede cancelar (ya enviada, entregada o cancelada)',
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({
    status: 403,
    description: 'No tienes permiso para cancelar esta orden',
  })
  @ApiResponse({ status: 404, description: 'Orden no encontrada' })
  async cancelOrder(
    @Req() req: Request,
    @Param('orderID', ParseIntPipe) orderID: number,
  ) {
    const userID = (req.user as any).userID;
    return this.ordersService.cancelOrder(userID, orderID, false);
  }

  // ========================
  // ENDPOINTS PARA ADMINS
  // ========================

  @Get('admin/all')
  @Roles('admin')
  @ApiCookieAuth()
  @ApiOperation({
    summary: '[ADMIN] Obtener todas las órdenes',
    description:
      'Retorna todas las órdenes del sistema con paginación y filtros. Solo para administradores.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filtrar por estado de orden',
    example: 'pending',
    enum: [
      'pending',
      'paid',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded',
    ],
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Número máximo de resultados',
    example: 50,
    type: 'number',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Número de resultados a saltar (para paginación)',
    example: 0,
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de órdenes',
    schema: {
      example: {
        success: true,
        data: {
          totalCount: 150,
          currentPage: 1,
          totalPages: 3,
          ordersCount: 50,
          orders: [
            {
              orderID: 1,
              orderStatus: 'delivered',
              orderDate: '2025-10-20T10:00:00.000Z',
              totalAmount: 1895.52,
              currency: 'mxn',
              customer: {
                userID: 2,
                name: 'Juan Pérez',
                email: 'juan@example.com',
              },
              itemsCount: 3,
              trackingNumber: 'DHL123456789',
              deliveryStatus: 'Entregado',
              paymentStatus: 'Pagado',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({
    status: 403,
    description: 'No tienes permisos de administrador',
  })
  async getAllOrders(
    @Query('status') status?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    return this.ordersService.getAllOrders(status, limit || 50, offset || 0);
  }

  @Put(':orderID/status')
  @Roles('admin')
  @ApiCookieAuth()
  @ApiOperation({
    summary: '[ADMIN] Actualizar estado de orden',
    description:
      'Actualiza el estado de una orden (pending, paid, processing, shipped, delivered, cancelled, refunded). Solo para administradores.',
  })
  @ApiParam({
    name: 'orderID',
    description: 'ID de la orden',
    example: 1,
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado actualizado exitosamente',
    schema: {
      example: {
        success: true,
        message: 'Estado de orden actualizado a: shipped',
        data: {
          orderID: 1,
          orderStatus: 'shipped',
          trackingNumber: 'DHL123456789',
          estimatedDeliveryDate: '2025-11-01T00:00:00.000Z',
          actualDeliveryDate: null,
          updatedAt: '2025-10-25T12:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Transición de estado inválida' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({
    status: 403,
    description: 'No tienes permisos de administrador',
  })
  @ApiResponse({ status: 404, description: 'Orden no encontrada' })
  async updateOrderStatus(
    @Param('orderID', ParseIntPipe) orderID: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(orderID, dto);
  }

  @Post('admin/:orderID/cancel')
  @Roles('admin')
  @ApiCookieAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[ADMIN] Cancelar orden (admin)',
    description:
      'Cancela cualquier orden como administrador. Restaura el stock automáticamente. Solo para administradores.',
  })
  @ApiParam({
    name: 'orderID',
    description: 'ID de la orden a cancelar',
    example: 1,
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Orden cancelada exitosamente',
    schema: {
      example: {
        success: true,
        message: 'Orden cancelada exitosamente. El stock ha sido restaurado.',
        data: {
          orderID: 1,
          orderStatus: 'cancelled',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Orden no se puede cancelar' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({
    status: 403,
    description: 'No tienes permisos de administrador',
  })
  @ApiResponse({ status: 404, description: 'Orden no encontrada' })
  async adminCancelOrder(
    @Req() req: Request,
    @Param('orderID', ParseIntPipe) orderID: number,
  ) {
    const userID = (req.user as any).userID;
    return this.ordersService.cancelOrder(userID, orderID, true);
  }
}
