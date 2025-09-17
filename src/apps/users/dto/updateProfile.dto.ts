import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  @ApiProperty({ 
    example: 'Juan Carlos', 
    description: 'Nombre del usuario',
    required: false
  })
  name?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  @ApiProperty({ 
    example: 'Pérez García', 
    description: 'Apellido del usuario',
    required: false
  })
  lastName?: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  @ApiProperty({ 
    example: 'https://example.com/profile-photo.jpg', 
    description: 'URL de la foto de perfil del usuario',
    required: false
  })
  imageURL?: string;
}
