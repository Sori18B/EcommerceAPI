import { Module } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  controllers: [StripeController],
  providers: [StripeService],
  exports: [StripeService], //Exportar el servicio para que pueda ser usado en otros modulos
  imports: [ConfigModule], //Importar el modulo de config y el modulo de prisma
})
export class StripeModule {}
