import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';

//DTO para actualizar la cantidad de un item en el carrito
export class UpdateCartItemDto {
  @ApiProperty({
    example: 3,
    description: 'Nueva cantidad del producto en el carrito',
    type: Number,
    minimum: 1,
  })
  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @IsPositive({ message: 'La cantidad debe ser un número positivo' })
  @Min(1, { message: 'La cantidad mínima es 1' })
  @IsNotEmpty({ message: 'La cantidad es requerida' })
  @Type(() => Number)
  quantity: number;
}
