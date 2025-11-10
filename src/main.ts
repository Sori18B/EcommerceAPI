import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import * as bodyParser from 'body-parser'; //webhook
import cookieParser from 'cookie-parser'; // cookies (el httpOnly)
import { PrismaClientExceptionFilter } from './exception.filter';
import { JwtAuthGuard } from './middlewares/auth/jwt-auth.guard';
import { Reflector } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar cookie-parser ANTES de otros middlewares
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configurar guards globales de autenticación
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // Solo para la ruta del webhook dejamos raw
  app.use('/webhook', bodyParser.raw({ type: 'application/json' }));

  const config = new DocumentBuilder()
    .setTitle('API - Ecommerce (Vistella)')
    .setDescription(
      'API que incluye las funcionalidades para el ecommerce de Vistella. La autenticación se maneja mediante cookies HTTP-only.',
    )
    .setVersion('1.0')
    .addBearerAuth() // Para compatibilidad con herramientas que usen Bearer Token
    .addSecurity('cookieAuth', {
      type: 'http',
      scheme: 'cookie',
      description:
        'Autenticación mediante cookie HTTP-only. El token JWT se envía automáticamente en las cookies cuando el usuario está logueado.',
    })
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  app.useGlobalFilters(new PrismaClientExceptionFilter());

  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
