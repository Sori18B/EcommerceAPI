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

export class UpdateAddressDto {
  // Tipo de dirección (opcional para actualización)
  @IsString()
  @IsOptional()
  @IsIn(['BILLING', 'SHIPPING', 'BOTH'])
  @ApiProperty({ 
    example: 'SHIPPING', 
    description: 'Tipo de dirección: BILLING, SHIPPING o BOTH',
    enum: ['BILLING', 'SHIPPING', 'BOTH'],
    required: false
  })
  addressType?: string;

  // Datos personales en la dirección (opcionales para actualización)
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  @ApiProperty({ 
    example: 'María', 
    description: 'Nombre para la dirección',
    required: false
  })
  firstName?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  @ApiProperty({ 
    example: 'González', 
    description: 'Apellido para la dirección',
    required: false
  })
  lastName?: string;

  // Dirección física (opcionales para actualización)
  @IsString()
  @IsOptional()
  @MinLength(5)
  @MaxLength(100)
  @ApiProperty({ 
    example: 'Avenida Reforma 456', 
    description: 'Dirección de la calle',
    required: false
  })
  street?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  @ApiProperty({ 
    example: 'Polanco', 
    description: 'Colonia o barrio (opcional)',
    required: false
  })
  neighborhood?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  @ApiProperty({ 
    example: 'Ciudad de México', 
    description: 'Ciudad',
    required: false
  })
  city?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  @ApiProperty({ 
    example: 'CDMX', 
    description: 'Estado o provincia',
    required: false
  })
  state?: string;

  @IsString()
  @IsOptional()
  @MinLength(5)
  @MaxLength(20)
  @ApiProperty({ 
    example: '54321', 
    description: 'Código postal',
    required: false
  })
  postalCode?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(2)
  @ApiProperty({ 
    example: 'MX', 
    description: 'Código del país (ISO 3166-1 alpha-2)',
    required: false
  })
  countryCode?: string;

  // Flags de uso (opcionales)
  @IsBoolean()
  @IsOptional()
  @ApiProperty({ 
    example: false, 
    description: 'Si es la dirección por defecto para facturación',
    required: false
  })
  isBillingDefault?: boolean;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ 
    example: true, 
    description: 'Si es la dirección por defecto para envíos',
    required: false
  })
  isShippingDefault?: boolean;
}
