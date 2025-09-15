import {
  IsNotEmpty,
  IsString,
  IsInt,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RolesDto {
  @IsInt()
  @IsNotEmpty()
  @ApiProperty({ example: 1, description: 'ID único del rol' })
  roleID: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  @ApiProperty({ example: 'Admin', description: 'Nombre del rol' })
  roleName: string;
}