import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentIntentDto {
  @ApiProperty({
    description: 'ID de la dirección de envío',
    example: 1,
  })
  @IsInt()
  @Min(1)
  shippingAddressID: number;

  @ApiProperty({
    description: 'ID de la dirección de facturación',
    example: 1,
  })
  @IsInt()
  @Min(1)
  billingAddressID: number;

  @ApiProperty({
    description: 'Nota del cliente (opcional)',
    example: 'Dejar en portería',
    required: false,
  })
  @IsOptional()
  @IsString()
  customerNote?: string;
}
