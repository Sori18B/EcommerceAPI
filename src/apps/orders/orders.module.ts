import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaModule } from 'src/config/prisma/prisma.module';
import { StripeModule } from 'src/utils/stripe/stripe.module';

@Module({
  imports: [PrismaModule, StripeModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
