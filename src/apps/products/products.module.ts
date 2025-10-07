import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { StripeModule } from 'src/utils/stripe/stripe.module';
import { PrismaModule } from 'src/config/prisma/prisma.module';

@Module({
  imports: [StripeModule, PrismaModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
