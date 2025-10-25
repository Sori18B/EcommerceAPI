import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './apps/users/users.module';
import { LoginModule } from './apps/login/login.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './middlewares/auth/auth.module';
import { ProductsModule } from './apps/products/products.module';
import { FavoritesModule } from './apps/favorites/favorites.module';
import { CartModule } from './apps/cart/cart.module';
import { OrdersModule } from './apps/orders/orders.module';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './middlewares/auth/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    LoginModule,
    AuthModule,
    ProductsModule,
    FavoritesModule,
    CartModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
