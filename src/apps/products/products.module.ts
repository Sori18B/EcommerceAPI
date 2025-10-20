import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { MasterDataController } from './master-data.controller';
import { MasterDataService } from './master-data.service';
import { StripeModule } from 'src/utils/stripe/stripe.module';
import { PrismaModule } from 'src/config/prisma/prisma.module';

@Module({
  imports: [StripeModule, PrismaModule],
  controllers: [ProductsController, MasterDataController],
  providers: [ProductsService, MasterDataService],
})
export class ProductsModule {}
