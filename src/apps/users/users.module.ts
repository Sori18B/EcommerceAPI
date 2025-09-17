import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from 'src/config/prisma/prisma.module';
import { StripeModule } from 'src/utils/stripe/stripe.module';

@Module({
  imports: [PrismaModule, StripeModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
