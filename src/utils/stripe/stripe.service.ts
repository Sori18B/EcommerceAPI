import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { AddressDto } from 'src/apps/users/dto/address.dto';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    const stripeSecretKey = this.configService.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('No se encontró la apikey de stripe en .env');
    }
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-08-27.basil',
      typescript: true,
    });
  }

  // Crear cliente en Stripe con dirección completa
  async createCustomer(data: {
    name: string;
    email: string;
    phone?: string;
    address: AddressDto;
  }) {
    try {
      const customerData: Stripe.CustomerCreateParams = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: {
          line1: data.address.street,
          line2: data.address.neighborhood || undefined,
          city: data.address.city,
          state: data.address.state,
          postal_code: data.address.postalCode,
          country: data.address.countryCode,
        },
        metadata: {
          addressType: data.address.addressType || 'BOTH',
          isBillingDefault: String(data.address.isBillingDefault || true),
          isShippingDefault: String(data.address.isShippingDefault || true),
        },
      };

      return await this.stripe.customers.create(customerData);
    } catch (error) {
      throw new Error(`Error al crear cliente en Stripe: ${error.message}`);
    }
  }

  // Obtener cliente por ID
  async getCustomer(customerId: string) {
    try {
      return await this.stripe.customers.retrieve(customerId);
    } catch (error) {
      throw new Error(`Error al obtener cliente de Stripe: ${error.message}`);
    }
  }

  // Actualizar cliente
  async updateCustomer(
    customerId: string,
    data: Partial<Stripe.CustomerUpdateParams>,
  ) {
    try {
      return await this.stripe.customers.update(customerId, data);
    } catch (error) {
      throw new Error(
        `Error al actualizar cliente en Stripe: ${error.message}`,
      );
    }
  }

  // Eliminar cliente
  async deleteCustomer(customerId: string) {
    try {
      return await this.stripe.customers.del(customerId);
    } catch (error) {
      throw new Error(`Error al eliminar cliente de Stripe: ${error.message}`);
    }
  }

  //---------------------------------------------------------------------------------------------------- Productos y Precios

  //Crear producto en Stripe
  async createProduct(data: Stripe.ProductCreateParams) {
    try {
      return await this.stripe.products.create(data);
    } catch (error) {
      throw new Error(`Error al crear producto en Stripe: ${error.message}`);
    }
  }

  //Crear precio en Stripe
  async createPrice(data: Stripe.PriceCreateParams) {
    try {
      return await this.stripe.prices.create(data);
    } catch (error) {
      throw new Error(`Error al crear precio en Stripe: ${error.message}`);
    }
  }

  // Crear método de pago (PaymentMethod)
  async createPaymentMethod(
    customerId: string,
    paymentMethodData: Stripe.PaymentMethodCreateParams,
  ) {
    try {
      return await this.stripe.paymentMethods.create(paymentMethodData);
    } catch (error) {
      throw new Error(`Error al crear método de pago: ${error.message}`);
    }
  }

  // Crear intención de pago (PaymentIntent)
  async createPaymentIntent(data: Stripe.PaymentIntentCreateParams) {
    try {
      return await this.stripe.paymentIntents.create(data);
    } catch (error) {
      throw new Error(`Error al crear intención de pago: ${error.message}`);
    }
  }
}
