import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsOptional,
  MinLength,
  MaxLength,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddressesDto {
  @IsInt()
  @IsNotEmpty()
  @ApiProperty({ example: 1, description: 'ID del usuario propietario de la dirección' })
  userID: number;

  @IsString()
  @IsNotEmpty()
  @IsIn(['shipping', 'billing'])
  @MaxLength(50)
  @ApiProperty({ 
    example: 'shipping', 
    description: 'Tipo de dirección (shipping o billing)',
    enum: ['shipping', 'billing']
  })
  addressType: string;

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

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(100)
  @ApiProperty({ example: 'Calle Principal 123', description: 'Dirección de la calle' })
  street: string;

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
  @MinLength(2)
  @MaxLength(50)
  @ApiProperty({ 
    example: 'Centro', 
    description: 'Colonia o barrio'
  })
  neighborhood: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(20)
  @ApiProperty({ example: '12345', description: 'Código postal' })
  postalCode: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(3)
  @ApiProperty({ example: 'MX', description: 'Código del país (ISO 3166-1 alpha-2)' })
  countryCode: string;
}