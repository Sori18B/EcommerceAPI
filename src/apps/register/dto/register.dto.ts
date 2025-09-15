import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsInt,
  IsPhoneNumber,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @IsInt()
  @IsNotEmpty()
  @ApiProperty({ example: 1, description: 'ID del rol del usuario' })
  roleID: number;

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
  @ApiProperty({ example: 'Espinosa Prado', description: 'Apellido del usuario' })
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({ example: 'eduardo18@gmail.com', description: 'Email del usuario' })
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(100)
  @ApiProperty({ example: 'SecurePassword#123.', description: 'Contraseña del usuario' })
  password: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(15)
  @IsPhoneNumber()
  @ApiProperty({ 
    example: '1234567890', 
    description: 'Número de teléfono del usuario'
  })
  phoneNumber: string;
}
