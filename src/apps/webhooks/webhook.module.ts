import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { PrismaModule } from 'src/config/prisma/prisma.module';
import { StripeModule } from 'src/utils/stripe/stripe.module';

@Module({
  imports: [PrismaModule, StripeModule],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}
