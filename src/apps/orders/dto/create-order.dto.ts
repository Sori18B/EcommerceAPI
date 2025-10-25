import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsPositive,
  IsString,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({
    description: 'ID de la dirección de envío',
    example: 1,
  })
  @IsInt({ message: 'shippingAddressID debe ser un número entero' })
  @IsPositive({ message: 'shippingAddressID debe ser un número positivo' })
  shippingAddressID: number;

  @ApiProperty({
    description: 'ID de la dirección de facturación',
    example: 1,
  })
  @IsInt({ message: 'billingAddressID debe ser un número entero' })
  @IsPositive({ message: 'billingAddressID debe ser un número positivo' })
  billingAddressID: number;

  @ApiPropertyOptional({
    description: 'Nota del cliente para la orden (opcional)',
    example: 'Por favor entreguen por la tarde',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'customerNote debe ser un texto' })
  @MaxLength(500, {
    message: 'La nota del cliente no puede exceder 500 caracteres',
  })
  customerNote?: string;

  @ApiPropertyOptional({
    description: 'Código de cupón de descuento (opcional)',
    example: 'VERANO2025',
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: 'couponCode debe ser un texto' })
  @MaxLength(50, { message: 'El código de cupón no puede exceder 50 caracteres' })
  couponCode?: string;
}
