import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { StripeService } from 'src/utils/stripe/stripe.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import Stripe from 'stripe';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private stripe: StripeService,
  ) {}

  //Crear orden desde carrito (sin pago inmediato)
  async createOrderFromCart(userID: number, dto: CreateOrderDto) {
    // 1. Validar que el carrito existe y tiene items
    const cart = await this.prisma.shoppingCart.findUnique({
      where: { userID },
      include: {
        items: {
          include: {
            productVariant: {
              include: {
                product: true,
                size: true,
                color: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException(
        'Tu carrito está vacío. Agrega productos antes de crear una orden',
      );
    }

    // 2. Validar direcciones
    const [shippingAddress, billingAddress] = await Promise.all([
      this.prisma.address.findUnique({
        where: { addressID: dto.shippingAddressID },
      }),
      this.prisma.address.findUnique({
        where: { addressID: dto.billingAddressID },
      }),
    ]);

    if (!shippingAddress || shippingAddress.userID !== userID) {
      throw new BadRequestException('Dirección de envío inválida');
    }

    if (!billingAddress || billingAddress.userID !== userID) {
      throw new BadRequestException('Dirección de facturación inválida');
    }

    // 3. Validar stock de todos los items
    for (const item of cart.items) {
      if (item.productVariant.stock < item.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para ${item.productVariant.product.name} (${item.productVariant.sku}). ` +
            `Disponible: ${item.productVariant.stock}, Solicitado: ${item.quantity}`,
        );
      }

      if (
        !item.productVariant.isActive ||
        !item.productVariant.product.isActive
      ) {
        throw new BadRequestException(
          `El producto ${item.productVariant.product.name} ya no está disponible`,
        );
      }
    }

    // 4. Calcular totales
    let subtotal = 0;
    const orderDetails = cart.items.map((item) => {
      const itemSubtotal = Number(item.productVariant.price) * item.quantity;
      subtotal += itemSubtotal;

      return {
        productVariantID: item.productVariantID,
        productName: item.productVariant.product.name,
        variantSKU: item.productVariant.sku,
        priceAtPurchase: item.productVariant.price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        discountAmount: 0, // TODO: Implementar cupones
        discountType: null,
        discountCode: null,
        unitPrice: item.productVariant.price,
        totalPrice: itemSubtotal,
      };
    });

    const taxAmount = subtotal * 0.16; // IVA 16%
    const shippingAmount = subtotal >= 500 ? 0 : 99; // Envío gratis > $500
    const totalAmount = subtotal + taxAmount + shippingAmount;

    // 5. Crear orden con transacción
    const order = await this.prisma.$transaction(async (prisma) => {
      // Crear la orden
      const newOrder = await prisma.orders.create({
        data: {
          userID,
          shippingAddressID: dto.shippingAddressID,
          billingAddressID: dto.billingAddressID,
          orderStatus: 'pending',
          subtotalAmount: subtotal,
          taxAmount: taxAmount,
          shippingAmount: shippingAmount,
          totalAmount: totalAmount,
          currency: 'mxn',
          paymentMethod: 'pending',
          customerNote: dto.customerNote,
          orderDetails: {
            create: orderDetails,
          },
        },
        include: {
          orderDetails: {
            include: {
              productVariant: {
                include: {
                  product: true,
                  size: true,
                  color: true,
                },
              },
            },
          },
          shippingAddress: true,
          billingAddress: true,
        },
      });

      // Reducir stock de cada producto
      for (const item of cart.items) {
        await prisma.productVariant.update({
          where: { productVariantID: item.productVariantID },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Vaciar el carrito
      await prisma.shoppingCartItem.deleteMany({
        where: { cartID: cart.cartID },
      });

      return newOrder;
    });

    return {
      success: true,
      message: 'Orden creada exitosamente',
      data: {
        orderID: order.orderID,
        orderStatus: order.orderStatus,
        totalAmount: Number(order.totalAmount),
        currency: order.currency,
        itemsCount: order.orderDetails.length,
        createdAt: order.createdAt,
        order: order,
      },
    };
  }

  // Crear sesión de Stripe Checkout desde carrito, Flujo: Carrito → Stripe Checkout → Webhook confirma pago → Orden pagada
  async createCheckoutSession(userID: number, dto: CheckoutDto) {
    // 1. Validar carrito
    const cart = await this.prisma.shoppingCart.findUnique({
      where: { userID },
      include: {
        items: {
          include: {
            productVariant: {
              include: {
                product: true,
                size: true,
                color: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Tu carrito está vacío');
    }

    // 2. Validar direcciones
    const [shippingAddress, billingAddress] = await Promise.all([
      this.prisma.address.findUnique({
        where: { addressID: dto.shippingAddressID },
      }),
      this.prisma.address.findUnique({
        where: { addressID: dto.billingAddressID },
      }),
    ]);

    if (!shippingAddress || shippingAddress.userID !== userID) {
      throw new BadRequestException('Dirección de envío inválida');
    }

    if (!billingAddress || billingAddress.userID !== userID) {
      throw new BadRequestException('Dirección de facturación inválida');
    }

    // 3. Validar stock
    for (const item of cart.items) {
      if (item.productVariant.stock < item.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para ${item.productVariant.product.name}`,
        );
      }
    }

    // 4. Obtener o crear Stripe Customer
    const user = await this.prisma.user.findUnique({
      where: { userID },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    let stripeCustomerID = user.stripeCustomerID;

    if (!stripeCustomerID) {
      const customer = await this.stripe.createSimpleCustomer({
        email: user.email,
        name: `${user.name} ${user.lastName}`,
        phone: user.phoneNumber,
        metadata: {
          userID: userID.toString(),
        },
      });

      stripeCustomerID = customer.id;

      await this.prisma.user.update({
        where: { userID },
        data: { stripeCustomerID: customer.id },
      });
    }

    // 5. Crear line items para Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      cart.items.map((item) => {
        // Si tiene stripePriceId, usarlo directamente
        if (item.productVariant.stripePriceId) {
          return {
            price: item.productVariant.stripePriceId,
            quantity: item.quantity,
          };
        }

        // Si no, crear price_data dinámicamente
        return {
          price_data: {
            currency: item.productVariant.currency || 'mxn',
            unit_amount: Math.round(Number(item.productVariant.price) * 100),
            product_data: {
              name: item.productVariant.product.name,
              description: `Talla: ${item.productVariant.size.sizeLabel}, Color: ${item.productVariant.color.colorName}`,
              metadata: {
                productVariantID: item.productVariantID.toString(),
                sku: item.productVariant.sku,
              },
            },
          },
          quantity: item.quantity,
        };
      });

    // 6. Agregar envío como line item si aplica
    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.productVariant.price) * item.quantity,
      0,
    );

    if (subtotal < 500) {
      lineItems.push({
        price_data: {
          currency: 'mxn',
          unit_amount: 9900, // $99 MXN
          product_data: {
            name: 'Envío estándar',
            description: 'Envío gratis en compras mayores a $500',
          },
        },
        quantity: 1,
      });
    }

    // 7. Crear sesión de Stripe Checkout
    const session = await this.stripe.createCheckoutSession({
      customer: stripeCustomerID,
      mode: 'payment',
      line_items: lineItems,
      success_url:
        dto.successUrl ||
        `${process.env.FRONTEND_URL}/orders/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: dto.cancelUrl || `${process.env.FRONTEND_URL}/cart`,
      metadata: {
        userID: userID.toString(),
        shippingAddressID: dto.shippingAddressID.toString(),
        billingAddressID: dto.billingAddressID.toString(),
        customerNote: dto.customerNote || '',
        cartID: cart.cartID.toString(),
      },
      shipping_address_collection: {
        allowed_countries: ['MX', 'US', 'CA'],
      },
      billing_address_collection: 'required',
      phone_number_collection: {
        enabled: true,
      },
      automatic_tax: {
        enabled: true,
      },
    });

    return {
      success: true,
      message: 'Sesión de checkout creada exitosamente',
      data: {
        sessionId: session.id,
        sessionUrl: session.url,
        expiresAt: new Date(session.expires_at * 1000).toISOString(),
      },
    };
  }

  // Crear Payment Intent para React Native SDK (@stripe/stripe-react-native)
  async createPaymentIntentForMobile(
    userID: number,
    dto: CreatePaymentIntentDto,
  ) {
    // 1. Validar carrito
    const cart = await this.prisma.shoppingCart.findUnique({
      where: { userID },
      include: {
        items: {
          include: {
            productVariant: {
              include: {
                product: true,
                size: true,
                color: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Tu carrito está vacío');
    }

    // 2. Validar direcciones
    const [shippingAddress, billingAddress] = await Promise.all([
      this.prisma.address.findUnique({
        where: { addressID: dto.shippingAddressID },
      }),
      this.prisma.address.findUnique({
        where: { addressID: dto.billingAddressID },
      }),
    ]);

    if (!shippingAddress || shippingAddress.userID !== userID) {
      throw new BadRequestException('Dirección de envío inválida');
    }

    if (!billingAddress || billingAddress.userID !== userID) {
      throw new BadRequestException('Dirección de facturación inválida');
    }

    // 3. Validar stock
    for (const item of cart.items) {
      if (item.productVariant.stock < item.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para ${item.productVariant.product.name}`,
        );
      }
    }

    // 4. Calcular totales
    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.productVariant.price) * item.quantity,
      0,
    );

    const taxAmount = subtotal * 0.16; // IVA 16%
    const shippingAmount = subtotal >= 500 ? 0 : 99; // Envío gratis > $500
    const totalAmount = subtotal + taxAmount + shippingAmount;

    // 5. Obtener o crear Stripe Customer
    const user = await this.prisma.user.findUnique({
      where: { userID },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    let stripeCustomerID = user.stripeCustomerID;

    if (!stripeCustomerID) {
      const customer = await this.stripe.createSimpleCustomer({
        email: user.email,
        name: `${user.name} ${user.lastName}`,
        phone: user.phoneNumber,
        metadata: {
          userID: userID.toString(),
        },
      });

      stripeCustomerID = customer.id;

      await this.prisma.user.update({
        where: { userID },
        data: { stripeCustomerID: customer.id },
      });
    }

    // 6. Crear Payment Intent
    const paymentIntent = await this.stripe.createPaymentIntent({
      amount: Math.round(totalAmount * 100), // Convertir a centavos
      currency: 'mxn',
      customer: stripeCustomerID,
      metadata: {
        userID: userID.toString(),
        shippingAddressID: dto.shippingAddressID.toString(),
        billingAddressID: dto.billingAddressID.toString(),
        customerNote: dto.customerNote || '',
        cartID: cart.cartID.toString(),
        subtotal: subtotal.toString(),
        tax: taxAmount.toString(),
        shipping: shippingAmount.toString(),
      },
      description: `Orden de ${cart.items.length} items - Usuario ${user.email}`,
      receipt_email: user.email,
      shipping: {
        name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
        phone: user.phoneNumber,
        address: {
          line1: shippingAddress.street,
          line2: shippingAddress.neighborhood || undefined,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.postalCode,
          country: shippingAddress.countryCode,
        },
      },
      // Configuración para React Native
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      success: true,
      message: 'Payment Intent creado exitosamente',
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        cartSummary: {
          itemsCount: cart.items.length,
          totalQuantity: cart.items.reduce(
            (sum, item) => sum + item.quantity,
            0,
          ),
          subtotal: Number(subtotal.toFixed(2)),
          tax: Number(taxAmount.toFixed(2)),
          shipping: Number(shippingAmount.toFixed(2)),
          total: Number(totalAmount.toFixed(2)),
        },
      },
    };
  }

  //Obtener historial de órdenes del usuario
  async getUserOrders(userID: number) {
    const orders = await this.prisma.orders.findMany({
      where: { userID },
      include: {
        orderDetails: {
          include: {
            productVariant: {
              include: {
                product: {
                  include: {
                    images: {
                      where: { isMain: true },
                      take: 1,
                    },
                  },
                },
                size: true,
                color: true,
              },
            },
          },
        },
        shippingAddress: true,
        deliveryStatus: true,
        paymentStatus: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: {
        ordersCount: orders.length,
        orders: orders.map((order) => ({
          orderID: order.orderID,
          orderStatus: order.orderStatus,
          orderDate: order.orderDate,
          totalAmount: Number(order.totalAmount),
          currency: order.currency,
          itemsCount: order.orderDetails.length,
          totalQuantity: order.orderDetails.reduce(
            (sum, detail) => sum + detail.quantity,
            0,
          ),
          trackingNumber: order.trackingNumber,
          estimatedDeliveryDate: order.estimatedDeliveryDate,
          deliveryStatus: order.deliveryStatus?.statusName,
          paymentStatus: order.paymentStatus?.statusName,
          items: order.orderDetails.map((detail) => ({
            productName: detail.productName,
            variantSKU: detail.variantSKU,
            size: detail.productVariant.size.sizeLabel,
            color: detail.productVariant.color.colorName,
            quantity: detail.quantity,
            priceAtPurchase: Number(detail.priceAtPurchase),
            totalPrice: Number(detail.totalPrice),
            mainImage: detail.productVariant.product.images[0]?.imageURL,
          })),
          shippingAddress: {
            street: order.shippingAddress.street,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            postalCode: order.shippingAddress.postalCode,
            countryCode: order.shippingAddress.countryCode,
          },
        })),
      },
    };
  }

  async getOrderById(userID: number, orderID: number) {
    const order = await this.prisma.orders.findUnique({
      where: { orderID },
      include: {
        orderDetails: {
          include: {
            productVariant: {
              include: {
                product: {
                  include: {
                    images: {
                      where: { isMain: true },
                      take: 1,
                    },
                  },
                },
                size: true,
                color: true,
              },
            },
          },
        },
        shippingAddress: true,
        billingAddress: true,
        deliveryStatus: true,
        paymentStatus: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Orden con ID ${orderID} no encontrada`);
    }

    if (order.userID !== userID) {
      throw new ForbiddenException('No tienes permiso para ver esta orden');
    }

    return {
      success: true,
      data: {
        orderID: order.orderID,
        orderStatus: order.orderStatus,
        orderDate: order.orderDate,
        subtotalAmount: Number(order.subtotalAmount),
        taxAmount: Number(order.taxAmount),
        shippingAmount: Number(order.shippingAmount),
        totalAmount: Number(order.totalAmount),
        currency: order.currency,
        paymentMethod: order.paymentMethod,
        paidAt: order.paidAt,
        trackingNumber: order.trackingNumber,
        estimatedDeliveryDate: order.estimatedDeliveryDate,
        actualDeliveryDate: order.actualDeliveryDate,
        customerNote: order.customerNote,
        adminNote: order.adminNote,
        deliveryStatus: order.deliveryStatus?.statusName,
        paymentStatus: order.paymentStatus?.statusName,
        items: order.orderDetails.map((detail) => ({
          orderDetailID: detail.orderDetailID,
          productName: detail.productName,
          variantSKU: detail.variantSKU,
          size: detail.productVariant.size.sizeLabel,
          color: detail.productVariant.color.colorName,
          colorHex: detail.productVariant.color.hexCode,
          quantity: detail.quantity,
          priceAtPurchase: Number(detail.priceAtPurchase),
          subtotal: Number(detail.subtotal),
          discountAmount: Number(detail.discountAmount),
          totalPrice: Number(detail.totalPrice),
          mainImage: detail.productVariant.product.images[0]?.imageURL,
        })),
        shippingAddress: {
          firstName: order.shippingAddress.firstName,
          lastName: order.shippingAddress.lastName,
          street: order.shippingAddress.street,
          neighborhood: order.shippingAddress.neighborhood,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          postalCode: order.shippingAddress.postalCode,
          countryCode: order.shippingAddress.countryCode,
        },
        billingAddress: {
          firstName: order.billingAddress.firstName,
          lastName: order.billingAddress.lastName,
          street: order.billingAddress.street,
          neighborhood: order.billingAddress.neighborhood,
          city: order.billingAddress.city,
          state: order.billingAddress.state,
          postalCode: order.billingAddress.postalCode,
          countryCode: order.billingAddress.countryCode,
        },
      },
    };
  }

  //Actualizar estado de orden (ADMIN)

  async updateOrderStatus(orderID: number, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.orders.findUnique({
      where: { orderID },
    });

    if (!order) {
      throw new NotFoundException(`Orden con ID ${orderID} no encontrada`);
    }

    // Validaciones de transiciones de estado
    if (order.orderStatus === 'cancelled' && dto.orderStatus !== 'cancelled') {
      throw new BadRequestException(
        'No se puede cambiar el estado de una orden cancelada',
      );
    }

    if (order.orderStatus === 'refunded' && dto.orderStatus !== 'refunded') {
      throw new BadRequestException(
        'No se puede cambiar el estado de una orden reembolsada',
      );
    }

    const updateData: any = {
      orderStatus: dto.orderStatus,
      updatedAt: new Date(),
    };

    if (dto.adminNote) {
      updateData.adminNote = dto.adminNote;
    }

    if (dto.trackingNumber) {
      updateData.trackingNumber = dto.trackingNumber;
    }

    if (dto.estimatedDeliveryDate) {
      updateData.estimatedDeliveryDate = new Date(dto.estimatedDeliveryDate);
    }

    if (dto.actualDeliveryDate) {
      updateData.actualDeliveryDate = new Date(dto.actualDeliveryDate);
    }

    // Si se marca como delivered, guardar fecha de entrega
    if (dto.orderStatus === 'delivered' && !dto.actualDeliveryDate) {
      updateData.actualDeliveryDate = new Date();
    }

    const updatedOrder = await this.prisma.orders.update({
      where: { orderID },
      data: updateData,
      include: {
        orderDetails: true,
        shippingAddress: true,
      },
    });

    return {
      success: true,
      message: `Estado de orden actualizado a: ${dto.orderStatus}`,
      data: {
        orderID: updatedOrder.orderID,
        orderStatus: updatedOrder.orderStatus,
        trackingNumber: updatedOrder.trackingNumber,
        estimatedDeliveryDate: updatedOrder.estimatedDeliveryDate,
        actualDeliveryDate: updatedOrder.actualDeliveryDate,
        updatedAt: updatedOrder.updatedAt,
      },
    };
  }

  //Cancelar orden (Usuario o Admin)
  async cancelOrder(userID: number, orderID: number, isAdmin: boolean = false) {
    const order = await this.prisma.orders.findUnique({
      where: { orderID },
      include: {
        orderDetails: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Orden con ID ${orderID} no encontrada`);
    }

    // Validar permisos
    if (!isAdmin && order.userID !== userID) {
      throw new ForbiddenException(
        'No tienes permiso para cancelar esta orden',
      );
    }

    // Validar que se pueda cancelar
    if (order.orderStatus === 'cancelled') {
      throw new BadRequestException('Esta orden ya está cancelada');
    }

    if (order.orderStatus === 'delivered') {
      throw new BadRequestException(
        'No se puede cancelar una orden ya entregada. Solicita un reembolso.',
      );
    }

    if (order.orderStatus === 'shipped') {
      throw new BadRequestException(
        'No se puede cancelar una orden ya enviada. Contacta a soporte.',
      );
    }

    // Cancelar orden y restaurar stock
    await this.prisma.$transaction(async (prisma) => {
      await prisma.orders.update({
        where: { orderID },
        data: {
          orderStatus: 'cancelled',
          updatedAt: new Date(),
        },
      });

      // Restaurar stock
      for (const detail of order.orderDetails) {
        await prisma.productVariant.update({
          where: { productVariantID: detail.productVariantID },
          data: {
            stock: {
              increment: detail.quantity,
            },
          },
        });
      }
    });

    return {
      success: true,
      message: 'Orden cancelada exitosamente. El stock ha sido restaurado.',
      data: {
        orderID: order.orderID,
        orderStatus: 'cancelled',
      },
    };
  }

  // Obtener todas las órdenes (ADMIN)
  async getAllOrders(status?: string, limit: number = 50, offset: number = 0) {
    const where: any = {};

    if (status) {
      where.orderStatus = status;
    }

    const [orders, totalCount] = await Promise.all([
      this.prisma.orders.findMany({
        where,
        include: {
          user: {
            select: {
              userID: true,
              name: true,
              lastName: true,
              email: true,
            },
          },
          orderDetails: {
            include: {
              productVariant: {
                include: {
                  product: {
                    include: {
                      images: {
                        where: { isMain: true },
                        take: 1,
                      },
                    },
                  },
                },
              },
            },
          },
          deliveryStatus: true,
          paymentStatus: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.orders.count({ where }),
    ]);

    return {
      success: true,
      data: {
        totalCount,
        currentPage: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(totalCount / limit),
        ordersCount: orders.length,
        orders: orders.map((order) => ({
          orderID: order.orderID,
          orderStatus: order.orderStatus,
          orderDate: order.orderDate,
          totalAmount: Number(order.totalAmount),
          currency: order.currency,
          customer: {
            userID: order.user.userID,
            name: `${order.user.name} ${order.user.lastName}`,
            email: order.user.email,
          },
          itemsCount: order.orderDetails.length,
          trackingNumber: order.trackingNumber,
          deliveryStatus: order.deliveryStatus?.statusName,
          paymentStatus: order.paymentStatus?.statusName,
        })),
      },
    };
  }
}
