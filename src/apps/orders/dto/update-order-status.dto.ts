import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsOptional,
  MaxLength,
  IsDateString,
} from 'class-validator';

export enum OrderStatusEnum {
  PENDING = 'pending',
  PAID = 'paid',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'Nuevo estado de la orden',
    enum: OrderStatusEnum,
    example: OrderStatusEnum.SHIPPED,
  })
  @IsEnum(OrderStatusEnum, {
    message: `El estado debe ser uno de: ${Object.values(OrderStatusEnum).join(', ')}`,
  })
  orderStatus: OrderStatusEnum;

  @ApiPropertyOptional({
    description: 'Nota administrativa sobre el cambio de estado',
    example: 'Orden enviada con DHL',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'adminNote debe ser un texto' })
  @MaxLength(500, {
    message: 'La nota administrativa no puede exceder 500 caracteres',
  })
  adminNote?: string;

  @ApiPropertyOptional({
    description: 'Número de seguimiento (para órdenes enviadas)',
    example: 'DHL123456789',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'trackingNumber debe ser un texto' })
  @MaxLength(100, {
    message: 'El número de seguimiento no puede exceder 100 caracteres',
  })
  trackingNumber?: string;

  @ApiPropertyOptional({
    description: 'Fecha estimada de entrega (ISO 8601)',
    example: '2025-11-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'estimatedDeliveryDate debe ser una fecha válida' })
  estimatedDeliveryDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha real de entrega (ISO 8601)',
    example: '2025-11-01T14:30:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'actualDeliveryDate debe ser una fecha válida' })
  actualDeliveryDate?: string;
}
