import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { StripeService } from 'src/utils/stripe/stripe.service';
import Stripe from 'stripe';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private readonly stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
    private configService: ConfigService,
  ) {
    // Inicializar Stripe directamente para acceso a webhooks
    const stripeSecretKey = this.configService.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error(
        'STRIPE_SECRET_KEY no encontrada en variables de entorno',
      );
    }
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-08-27.basil',
      typescript: true,
    });
  }

  /**
   * Procesar evento de Stripe con validación de firma
   */
  async handleStripeEvent(rawBody: Buffer, signature: string) {
    const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      throw new Error(
        'STRIPE_WEBHOOK_SECRET no configurado. Necesario para validar webhooks.',
      );
    }

    let event: Stripe.Event;

    try {
      // Validar firma del webhook (SEGURIDAD CRÍTICA)
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err) {
      this.logger.error(`❌ Error de validación de firma: ${err.message}`);
      throw new BadRequestException(
        `Webhook signature verification failed: ${err.message}`,
      );
    }

    this.logger.log(`📨 Evento recibido: ${event.type} (ID: ${event.id})`);

    // Verificar si ya procesamos este evento (idempotencia)
    const existingLog = await this.prisma.stripeWebhookLog.findUnique({
      where: { eventID: event.id },
    });

    if (existingLog?.processed) {
      this.logger.warn(
        `⚠️ Evento ${event.id} ya fue procesado anteriormente. Ignorando.`,
      );
      return {
        eventId: event.id,
        eventType: event.type,
        alreadyProcessed: true,
      };
    }

    // Registrar evento en BD
    const logEntry = await this.createWebhookLog(event);

    try {
      // Procesar según tipo de evento
      await this.processEvent(event);

      // Marcar como procesado exitosamente
      await this.prisma.stripeWebhookLog.update({
        where: { webhookID: logEntry.webhookID },
        data: {
          processed: true,
          processedAt: new Date(),
          status: 'success',
        },
      });

      this.logger.log(`✅ Evento ${event.type} procesado exitosamente`);

      return {
        eventId: event.id,
        eventType: event.type,
        processed: true,
      };
    } catch (error) {
      // Registrar error pero no lanzar excepción
      this.logger.error(
        `❌ Error procesando evento ${event.type}: ${error.message}`,
        error.stack,
      );

      await this.prisma.stripeWebhookLog.update({
        where: { webhookID: logEntry.webhookID },
        data: {
          status: 'failed',
          errorMessage: error.message,
          retryCount: { increment: 1 },
        },
      });

      // No lanzar error para evitar reintentos infinitos
      return {
        eventId: event.id,
        eventType: event.type,
        processed: false,
        error: error.message,
      };
    }
  }

  /**
   * Enrutar evento al handler correspondiente
   */
  private async processEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event);
        break;

      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event);
        break;

      default:
        this.logger.warn(`⚠️ Evento no manejado: ${event.type}`);
    }
  }

  /**
   * EVENTO CRÍTICO: checkout.session.completed
   * Se dispara cuando el usuario completa el pago en Stripe Checkout
   * AQUÍ SE CREA LA ORDEN AUTOMÁTICAMENTE
   */
  private async handleCheckoutSessionCompleted(event: Stripe.Event) {
    const session = event.data.object as Stripe.Checkout.Session;

    this.logger.log(`🛒 Procesando checkout completado: ${session.id}`);

    // Extraer metadata guardada al crear la sesión
    const metadata = session.metadata;
    if (!metadata) {
      throw new Error('Metadata no encontrada en sesión de checkout');
    }

    const userID = parseInt(metadata.userID);
    const shippingAddressID = parseInt(metadata.shippingAddressID);
    const billingAddressID = parseInt(metadata.billingAddressID);
    const cartID = parseInt(metadata.cartID);
    const customerNote = metadata.customerNote || null;

    if (!userID || !shippingAddressID || !billingAddressID || !cartID) {
      throw new Error('Metadata incompleta en sesión de checkout');
    }

    // Verificar si ya existe una orden con este sessionID (idempotencia)
    const existingOrder = await this.prisma.orders.findFirst({
      where: { stripeSessionID: session.id },
    });

    if (existingOrder) {
      this.logger.warn(
        `⚠️ Orden ${existingOrder.orderID} ya existe para sesión ${session.id}`,
      );
      return;
    }

    // Obtener el carrito con items
    const cart = await this.prisma.shoppingCart.findUnique({
      where: { cartID },
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
      throw new Error(`Carrito ${cartID} vacío o no encontrado`);
    }

    // Validar que el carrito pertenece al usuario
    if (cart.userID !== userID) {
      throw new Error(`Carrito ${cartID} no pertenece al usuario ${userID}`);
    }

    // Calcular totales
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
        discountAmount: 0,
        discountType: null,
        discountCode: null,
        unitPrice: item.productVariant.price,
        totalPrice: itemSubtotal,
      };
    });

    const taxAmount = subtotal * 0.16; // IVA 16%
    const shippingAmount = subtotal >= 500 ? 0 : 99; // Envío gratis > $500
    const totalAmount = subtotal + taxAmount + shippingAmount;

    // Crear orden en transacción atómica
    const order = await this.prisma.$transaction(async (prisma) => {
      // Crear la orden
      const newOrder = await prisma.orders.create({
        data: {
          userID,
          shippingAddressID,
          billingAddressID,
          orderStatus: 'paid', // Ya está pagada
          subtotalAmount: subtotal,
          taxAmount: taxAmount,
          shippingAmount: shippingAmount,
          totalAmount: totalAmount,
          currency: session.currency || 'mxn',
          paymentMethod: 'card',
          stripeSessionID: session.id,
          stripePaymentIntentID: session.payment_intent as string,
          paidAt: new Date(),
          customerNote: customerNote,
          orderDetails: {
            create: orderDetails,
          },
        },
        include: {
          orderDetails: true,
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

    this.logger.log(
      `✅ Orden #${order.orderID} creada exitosamente desde webhook`,
    );
    this.logger.log(
      `   - Total: $${totalAmount.toFixed(2)} ${order.currency.toUpperCase()}`,
    );
    this.logger.log(`   - Items: ${order.orderDetails.length}`);
    this.logger.log(`   - Payment Intent: ${session.payment_intent}`);

    return order;
  }

  /**
   * EVENTO: payment_intent.succeeded
   * Confirma que el pago fue exitoso
   * IMPORTANTE: Para Payment Intents creados desde móvil, AQUÍ SE CREA LA ORDEN
   */
  private async handlePaymentIntentSucceeded(event: Stripe.Event) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    this.logger.log(`💳 Pago confirmado: ${paymentIntent.id}`);

    // Buscar si ya existe orden con este payment intent
    const existingOrder = await this.prisma.orders.findFirst({
      where: { stripePaymentIntentID: paymentIntent.id },
    });

    if (existingOrder) {
      // Si ya existe, solo actualizar paidAt si no está establecido
      if (!existingOrder.paidAt) {
        await this.prisma.orders.update({
          where: { orderID: existingOrder.orderID },
          data: {
            paidAt: new Date(),
            orderStatus: 'paid',
          },
        });

        this.logger.log(
          `✅ Orden #${existingOrder.orderID} marcada como pagada`,
        );
      } else {
        this.logger.log(
          `⚠️ Orden #${existingOrder.orderID} ya estaba marcada como pagada`,
        );
      }
      return;
    }

    // Si NO existe orden, crearla desde el Payment Intent
    // (Esto ocurre cuando se usa Payment Intent directo desde React Native)
    const metadata = paymentIntent.metadata;

    if (!metadata || !metadata.userID || !metadata.cartID) {
      this.logger.warn(
        `⚠️ Payment Intent ${paymentIntent.id} sin metadata suficiente para crear orden`,
      );
      return;
    }

    const userID = parseInt(metadata.userID);
    const shippingAddressID = parseInt(metadata.shippingAddressID);
    const billingAddressID = parseInt(metadata.billingAddressID);
    const cartID = parseInt(metadata.cartID);
    const customerNote = metadata.customerNote || null;

    // Obtener el carrito con items
    const cart = await this.prisma.shoppingCart.findUnique({
      where: { cartID },
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
      this.logger.error(`❌ Carrito ${cartID} vacío o no encontrado`);
      throw new Error(`Carrito ${cartID} vacío o no encontrado`);
    }

    // Validar que el carrito pertenece al usuario
    if (cart.userID !== userID) {
      this.logger.error(
        `❌ Carrito ${cartID} no pertenece al usuario ${userID}`,
      );
      throw new Error(`Carrito ${cartID} no pertenece al usuario ${userID}`);
    }

    // Calcular totales (obtenerlos de metadata si están disponibles)
    const subtotal = metadata.subtotal
      ? parseFloat(metadata.subtotal)
      : cart.items.reduce(
          (sum, item) =>
            sum + Number(item.productVariant.price) * item.quantity,
          0,
        );

    const taxAmount = metadata.tax ? parseFloat(metadata.tax) : subtotal * 0.16;

    const shippingAmount = metadata.shipping
      ? parseFloat(metadata.shipping)
      : subtotal >= 500
        ? 0
        : 99;

    const totalAmount = subtotal + taxAmount + shippingAmount;

    // Preparar detalles de la orden
    const orderDetails = cart.items.map((item) => {
      const itemSubtotal = Number(item.productVariant.price) * item.quantity;

      return {
        productVariantID: item.productVariantID,
        productName: item.productVariant.product.name,
        variantSKU: item.productVariant.sku,
        priceAtPurchase: item.productVariant.price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        discountAmount: 0,
        discountType: null,
        discountCode: null,
        unitPrice: item.productVariant.price,
        totalPrice: itemSubtotal,
      };
    });

    // Crear orden en transacción atómica
    const order = await this.prisma.$transaction(async (prisma) => {
      // Crear la orden
      const newOrder = await prisma.orders.create({
        data: {
          userID,
          shippingAddressID,
          billingAddressID,
          orderStatus: 'paid', // Ya está pagada
          subtotalAmount: subtotal,
          taxAmount: taxAmount,
          shippingAmount: shippingAmount,
          totalAmount: totalAmount,
          currency: paymentIntent.currency || 'mxn',
          paymentMethod: 'card',
          stripePaymentIntentID: paymentIntent.id,
          paidAt: new Date(),
          customerNote: customerNote,
          orderDetails: {
            create: orderDetails,
          },
        },
        include: {
          orderDetails: true,
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

    this.logger.log(
      `✅ Orden #${order.orderID} creada desde Payment Intent (React Native)`,
    );
    this.logger.log(
      `   - Total: $${totalAmount.toFixed(2)} ${order.currency.toUpperCase()}`,
    );
    this.logger.log(`   - Items: ${order.orderDetails.length}`);
    this.logger.log(`   - Payment Intent: ${paymentIntent.id}`);

    return order;
  }

  /**
   * EVENTO: payment_intent.payment_failed
   * Se dispara cuando el pago falla
   */
  private async handlePaymentIntentFailed(event: Stripe.Event) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    this.logger.error(`❌ Pago fallido: ${paymentIntent.id}`);

    // Buscar orden por payment intent ID
    const order = await this.prisma.orders.findFirst({
      where: { stripePaymentIntentID: paymentIntent.id },
    });

    if (order) {
      // Actualizar estado a cancelada
      await this.prisma.orders.update({
        where: { orderID: order.orderID },
        data: {
          orderStatus: 'cancelled',
          adminNote: `Pago fallido: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`,
        },
      });

      this.logger.log(`⚠️ Orden #${order.orderID} cancelada por fallo de pago`);
    }
  }

  /**
   * Registrar evento en base de datos para trazabilidad
   */
  private async createWebhookLog(event: Stripe.Event) {
    return this.prisma.stripeWebhookLog.create({
      data: {
        eventID: event.id,
        eventType: event.type,
        status: 'pending',
        processed: false,
        payload: event as any,
        receivedAt: new Date(event.created * 1000),
      },
    });
  }
}
