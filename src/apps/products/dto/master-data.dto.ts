import { IsString, IsOptional, IsBoolean, Length, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @Length(2, 50)
  roleName: string;
}

export class CreateGenderDto {
  @ApiProperty({ example: 'Unisex' })
  @IsString()
  @Length(2, 50)
  genderName: string;
}

export class CreateCategoryDto {
  @ApiProperty({ example: 'Ropa' })
  @IsString()
  @Length(2, 100)
  categoryName: string;

  @ApiProperty({ example: 'Descripción', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateSizeDto {
  @ApiProperty({ example: 'M' })
  @IsString()
  @Length(1, 10)
  sizeLabel: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @Min(0)
  sizeOrder?: number;
}

export class CreateColorDto {
  @ApiProperty({ example: 'Negro' })
  @IsString()
  @Length(2, 50)
  colorName: string;

  @ApiProperty({ example: '#000000' })
  @IsString()
  @Length(4, 9)
  hexCode: string;
}
