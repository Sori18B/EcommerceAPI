import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  MinLength,
  MaxLength,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddressDto {

  // Tipo de dirección (opcional, por defecto será BOTH en el registro)
  @IsString()
  @IsOptional()
  @IsIn(['BILLING', 'SHIPPING', 'BOTH'])
  @ApiProperty({ 
    example: 'BOTH', 
    description: 'Tipo de dirección: BILLING, SHIPPING o BOTH',
    enum: ['BILLING', 'SHIPPING', 'BOTH'],
    required: false
  })
  addressType?: string;

  // Datos personales en la dirección
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  @ApiProperty({ 
    example: 'Juan', 
    description: 'Nombre para la dirección'
  })
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  @ApiProperty({ 
    example: 'Pérez', 
    description: 'Apellido para la dirección'
  })
  lastName: string;

  // Dirección física (REQUERIDOS por Stripe)
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(100)
  @ApiProperty({ example: 'Calle Principal 123', description: 'Dirección de la calle' })
  street: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  @ApiProperty({ 
    example: 'Centro', 
    description: 'Colonia o barrio (opcional)',
    required: false
  })
  neighborhood?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  @ApiProperty({ example: 'Ciudad de México', description: 'Ciudad' })
  city: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  @ApiProperty({ example: 'CDMX', description: 'Estado o provincia' })
  state: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(20)
  @ApiProperty({ example: '12345', description: 'Código postal' })
  postalCode: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(2)
  @ApiProperty({ example: 'MX', description: 'Código del país (ISO 3166-1 alpha-2)' })
  countryCode: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ 
    example: true, 
    description: 'Si es la dirección por defecto para facturación (se establece automáticamente en registro)',
    required: false
  })
  isBillingDefault?: boolean;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ 
    example: true, 
    description: 'Si es la dirección por defecto para envíos (se establece automáticamente en registro)',
    required: false
  })
  isShippingDefault?: boolean;
}
