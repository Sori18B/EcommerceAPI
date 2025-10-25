import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class AddFavoriteDto {
  @ApiProperty({
    example: 1,
    description: 'ID del producto a agregar a favoritos',
    type: Number,
    minimum: 1,
  })
  @IsNumber({}, { message: 'El productID debe ser un número' })
  @IsPositive({ message: 'El productID debe ser un número positivo' })
  @IsNotEmpty({ message: 'El productID es requerido' })
  @Type(() => Number)
  productID: number;
}
