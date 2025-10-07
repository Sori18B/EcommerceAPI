import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
  Length,
  IsUrl,
  Matches,
  ArrayMinSize,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum PaymentMode {
  PAYMENT = 'payment',
  SUBSCRIPTION = 'subscription',
  SETUP = 'setup',
}

export enum TaxBehavior {
  INCLUSIVE = 'inclusive',
  EXCLUSIVE = 'exclusive',
  UNSPECIFIED = 'unspecified',
}

export class ProductDto {
  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Playera básica de algodón',
  })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({
    description: 'Descripción del producto',
    example: 'Playera cómoda 100% algodón, perfecta para uso diario',
  })
  @IsString()
  @Length(10, 500)
  description: string;

  @ApiProperty({ description: 'Precio base del producto', example: 249.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  basePrice: number;

  @ApiProperty({
    description: 'Indica si el producto está activo',
    example: true,
  })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({
    description: 'ID de la categoría a la que pertenece',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  categoryID: number;

  @ApiProperty({
    description: 'ID del género asociado al producto',
    example: 2,
  })
  @IsNumber()
  @IsPositive()
  genderID: number;

  @ApiProperty({
    description: 'Código fiscal del producto (Stripe)',
    example: 'txcd_99999999',
    required: false,
  })
  @IsOptional()
  @IsString()
  taxCode?: string;

  @ApiProperty({
    description: 'Indica si el producto es enviable',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  shippable?: boolean;
}

export class ProductVariantDto {
  @ApiProperty({ description: 'ID de la talla', example: 1 })
  @IsNumber()
  @IsPositive()
  sizeID: number;

  @ApiProperty({ description: 'ID del color', example: 3 })
  @IsNumber()
  @IsPositive()
  colorID: number;

  @ApiProperty({
    description: 'SKU del producto (Stock Keeping Unit)',
    example: 'TSHIRT-BLK-M',
  })
  @IsString()
  @Length(3, 50)
  sku: string;

  @ApiProperty({
    description: 'Precio específico de la variante',
    example: 259.99,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @ApiProperty({
    description: 'Cantidad disponible en inventario',
    example: 50,
  })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiProperty({
    description: 'Indica si la variante está activa',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Moneda de la variante (ISO 4217)',
    example: 'MXN',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/, {
    message: 'La moneda debe ser un código ISO 4217 válido (ej: MXN, USD)',
  })
  currency?: string;

  @ApiProperty({
    description: 'Modo de pago asociado (Stripe)',
    enum: PaymentMode,
    required: false,
  })
  @IsOptional()
  @IsEnum(PaymentMode)
  mode?: PaymentMode;

  @ApiProperty({
    description: 'Comportamiento fiscal del producto',
    enum: TaxBehavior,
    required: false,
  })
  @IsOptional()
  @IsEnum(TaxBehavior)
  taxBehavior?: TaxBehavior;

  @ApiProperty({
    description: 'Nombre alternativo o alias en Stripe',
    example: 'T-shirt Medium Black',
    required: false,
  })
  @IsOptional()
  @IsString()
  nickname?: string;
}

export class ProductImageDto {
  @ApiProperty({
    description: 'URL de la imagen del producto',
    example: 'https://cdn.tienda.com/products/tshirt1.png',
  })
  @IsString()
  @IsUrl({}, { message: 'La URL de la imagen debe ser válida' })
  imageUrl: string;

  @ApiProperty({
    description: 'Texto alternativo de la imagen',
    example: 'Playera negra talla M',
    required: false,
  })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiProperty({
    description: 'Orden de visualización de la imagen',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  displayOrder?: number;

  @ApiProperty({
    description: 'Indica si es la imagen principal',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isMain?: boolean;
}

export class CategoriesDto {
  @ApiProperty({
    description: 'Nombre de la categoría',
    example: 'Ropa deportiva',
  })
  @IsString()
  @Length(2, 100)
  categoryName: string;

  @ApiProperty({
    description: 'Descripción de la categoría',
    example: 'Productos relacionados con deporte',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Indica si la categoría está activa',
    example: true,
  })
  @IsBoolean()
  isActive: boolean;
}

export class GendersDto {
  @ApiProperty({
    description: 'Nombre del género (e.g., Hombre, Mujer, Unisex)',
    example: 'Unisex',
  })
  @IsString()
  @Length(2, 50)
  genderName: string;
}

export class SizesDto {
  @ApiProperty({ description: 'Etiqueta de la talla', example: 'M' })
  @IsString()
  @Length(1, 10)
  sizeLabel: string;

  @ApiProperty({ description: 'Orden de la talla en la lista', example: 2 })
  @IsNumber()
  @Min(0)
  sizeOrder: number;
}

export class ColorsDto {
  @ApiProperty({ description: 'Nombre del color', example: 'Negro' })
  @IsString()
  @Length(2, 50)
  colorName: string;

  @ApiProperty({
    description: 'Código hexadecimal del color',
    example: '#000000',
  })
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'El código hexadecimal debe tener formato #RRGGBB',
  })
  hexCode: string;
}

export class CreateProductDto extends ProductDto {
  @ApiProperty({
    type: [ProductVariantDto],
    description: 'Lista de variantes del producto (mínimo 1)',
    example: [
      {
        sizeID: 1,
        colorID: 3,
        sku: 'TSHIRT-BLK-M',
        price: 259.99,
        stock: 50,
      },
    ],
  })
  @IsArray()
  @ArrayMinSize(1, {
    message: 'Debe incluir al menos una variante del producto',
  })
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants: ProductVariantDto[];

  @ApiProperty({
    type: [ProductImageDto],
    description: 'Lista de imágenes del producto',
    example: [
      {
        imageUrl: 'https://cdn.tienda.com/products/tshirt1.png',
        altText: 'Playera negra talla M',
        displayOrder: 0,
        isMain: true,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images: ProductImageDto[];
}
