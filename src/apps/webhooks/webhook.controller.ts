import {
  Controller,
  Post,
  Req,
  Res,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { WebhookService } from './webhook.service';
import { Public } from 'src/middlewares/auth/public.decorator';

@ApiTags('Webhooks')
@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private webhookService: WebhookService) {}

  @Post()
  @Public() // Los webhooks de Stripe NO deben tener autenticación JWT
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint() // No mostrar en Swagger (es solo para Stripe)
  @ApiOperation({
    summary: 'Webhook de Stripe',
    description:
      'Endpoint para recibir eventos de Stripe. SOLO debe ser llamado por Stripe. La firma del webhook se valida automáticamente.',
  })
  @ApiResponse({
    status: 200,
    description: 'Evento procesado correctamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Firma de webhook inválida o evento no reconocido',
  })
  async handleStripeWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('stripe-signature') signature: string,
  ) {
    try {
      // Validar que tengamos la firma
      if (!signature) {
        this.logger.error('❌ Webhook recibido sin firma de Stripe');
        throw new BadRequestException('No stripe-signature header found');
      }

      // El body debe ser raw (ya configurado en main.ts)
      const rawBody = req.body;

      if (!rawBody) {
        this.logger.error('❌ Webhook recibido sin body');
        throw new BadRequestException('No body found in request');
      }

      this.logger.log('📨 Webhook recibido de Stripe');
      this.logger.debug(`Signature: ${signature.substring(0, 20)}...`);

      // Procesar el evento (validación de firma incluida)
      const result = await this.webhookService.handleStripeEvent(
        rawBody,
        signature,
      );

      this.logger.log(`✅ Webhook procesado exitosamente: ${result.eventType}`);

      // IMPORTANTE: Siempre retornar 200 a Stripe
      return res.status(HttpStatus.OK).json({
        received: true,
        eventId: result.eventId,
        eventType: result.eventType,
      });
    } catch (error) {
      this.logger.error(
        `❌ Error procesando webhook: ${error.message}`,
        error.stack,
      );

      // Si es error de validación de firma, retornar 400
      if (
        error.message.includes('signature') ||
        error.message.includes('Webhook')
      ) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          error: 'Webhook signature validation failed',
        });
      }

      // Para otros errores, registrar pero retornar 200 a Stripe
      // (evita que Stripe reintente indefinidamente por errores de lógica)
      return res.status(HttpStatus.OK).json({
        received: true,
        error: 'Event received but processing failed',
      });
    }
  }
}
