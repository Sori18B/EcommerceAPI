import { Module } from '@nestjs/common';
import { RegisterController } from './register.controller';
import { RegisterService } from './register.service';
import { PrismaModule } from 'src/config/prisma/prisma.module';
import { StripeModule } from 'src/utils/stripe/stripe.module';

@Module({
  imports: [PrismaModule, StripeModule],
  controllers: [RegisterController],
  providers: [RegisterService],
})
export class RegisterModule {}
