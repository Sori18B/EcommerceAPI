import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUrl,
  IsPhoneNumber,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AddressDto } from './address.dto';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

export class RegisterDto {
  //@IsInt()
  //@IsNotEmpty()
  //@ApiProperty({ example: 1, description: 'ID del rol del usuario' })
  //roleID: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  @ApiProperty({ example: 'Luis Alberto', description: 'Nombre del usuario' })
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  @ApiProperty({
    example: 'Espinosa Prado',
    description: 'Apellido del usuario',
  })
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    example: 'eduardo18@gmail.com',
    description: 'Email del usuario',
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(100)
  @ApiProperty({
    example: 'SecurePassword#123.',
    description: 'Contraseña del usuario',
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(15)
  @IsPhoneNumber()
  @ApiProperty({
    example: '+522212847943',
    description: 'Número de teléfono del usuario',
  })
  phoneNumber: string;

  @IsUrl()
  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'https://example.com/image.jpg',
    description: 'Foto de perfil del usuario',
  })
  imageURL: string;

  @ApiProperty({ type: () => AddressDto, description: 'Dirección del cliente' })
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;
}
