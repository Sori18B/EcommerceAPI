import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';

//El userID se obtiene automáticamente del token JWT
export class AddToCartDto {
  @ApiProperty({
    example: 1,
    description:
      'ID de la variante del producto (con talla y color específicos)',
    type: Number,
    minimum: 1,
  })
  @IsNumber({}, { message: 'El productVariantID debe ser un número' })
  @IsPositive({ message: 'El productVariantID debe ser un número positivo' })
  @IsNotEmpty({ message: 'El productVariantID es requerido' })
  @Type(() => Number)
  productVariantID: number;

  @ApiProperty({
    example: 2,
    description: 'Cantidad de unidades a agregar al carrito',
    type: Number,
    minimum: 1,
    default: 1,
  })
  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @IsPositive({ message: 'La cantidad debe ser un número positivo' })
  @Min(1, { message: 'La cantidad mínima es 1' })
  @Type(() => Number)
  quantity: number;
}
