import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StripeService {
    private stripe: Stripe;

    constructor(
        private configService: ConfigService
    ) {
        const stripeSecretKey = this.configService.get('STRIPE_SECRET_KEY');
        if (!stripeSecretKey) {
            throw new Error('No se encontró la apikey de stripe en .env');
          }
        this.stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-08-27.basil'});
    } //Fin del constructor

    //Crear cliente en Stripe
    async createCustomer(data: { name?: string; email: string }) {
        return this.stripe.customers.create(data);
      }

}//Fin de la clase
