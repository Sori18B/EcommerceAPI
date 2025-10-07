import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { StripeService } from 'src/utils/stripe/stripe.service';
import {
  CreateProductDto,
  ProductVariantDto,
  ProductImageDto,
} from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private stripe: StripeService,
  ) {}

  // juntas xd
  async createProduct(data: CreateProductDto) {
    try {
      // 1. Crear en Stripe y BD en un solo paso
      const result = await this.createProductsStripe(data);

      return {
        success: true,
        product: result.product,
        stripeProductId: result.stripeProductId,
        message: 'Producto creado exitosamente en Stripe y Base de Datos',
        metadata: {
          variantsCount: (result.product as any).variants?.length ?? 0,
          imagesCount: (result.product as any).images?.length ?? 0,
          createdAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Error creando producto completo:', error.message);

      throw new BadRequestException(
        `Error al crear producto: ${error.message}`,
      );
    }
  }

  // Crear producto en Stripe y luego en BD
  async createProductsStripe(data: CreateProductDto) {
    try {
      // 1. Validar datos básicos
      if (
        typeof data.basePrice !== 'number' ||
        Number.isNaN(data.basePrice) ||
        data.basePrice < 0
      ) {
        throw new BadRequestException(
          'basePrice debe ser un número válido mayor o igual a 0',
        );
      }

      if (!data.variants || data.variants.length === 0) {
        throw new BadRequestException(
          'Se requiere al menos una variante del producto',
        );
      }

      // 2. Crear producto en Stripe
      const stripeProduct = await this.stripe.createProduct({
        name: data.name,
        description: data.description,
        active: data.isActive ?? true,
        images: data.images?.map((img) => img.imageUrl) || [],
        shippable: data.shippable ?? true,
        tax_code: data.taxCode,
        metadata: {
          categoryID: data.categoryID.toString(),
          genderID: data.genderID.toString(),
          basePrice: data.basePrice.toString(),
        },
      });

      // 3. Crear precios en Stripe para cada variante
      const variantsWithStripeIds = await Promise.all(
        data.variants.map(async (variant) => {
          if (
            typeof variant.price !== 'number' ||
            Number.isNaN(variant.price) ||
            variant.price < 0
          ) {
            throw new BadRequestException(
              `Precio inválido para variante ${variant.sku}`,
            );
          }

          const stripePrice = await this.stripe.createPrice({
            product: stripeProduct.id,
            currency: variant.currency || 'mxn',
            unit_amount: Math.round(variant.price * 100),
            nickname:
              variant.nickname ||
              `${variant.sku} - Size ${variant.sizeID} Color ${variant.colorID}`,
            tax_behavior: variant.taxBehavior || 'unspecified',
            metadata: {
              sku: variant.sku,
              sizeID: variant.sizeID.toString(),
              colorID: variant.colorID.toString(),
            },
          });

          return {
            ...variant,
            stripePriceId: stripePrice.id,
          };
        }),
      );

      // 4. Guardar en BD con IDs de Stripe
      const product = await this.prisma.product.create({
        data: {
          name: data.name,
          description: data.description,
          basePrice: data.basePrice,
          isActive: data.isActive ?? true,
          categoryID: data.categoryID,
          genderID: data.genderID,
          ...(stripeProduct.id && { stripeProductId: stripeProduct.id }),
          ...(data.taxCode && { taxCode: data.taxCode }),
          ...(data.shippable !== undefined && { shippable: data.shippable }),
          variants: {
            create: variantsWithStripeIds.map((variant) => ({
              sizeID: variant.sizeID,
              colorID: variant.colorID,
              sku: variant.sku,
              price: variant.price,
              stock: variant.stock ?? 0,
              isActive: variant.isActive ?? true,
              ...(variant.stripePriceId && {
                stripePriceId: variant.stripePriceId,
              }),
              currency: variant.currency || 'mxn',
              ...(variant.mode && { mode: variant.mode }),
              ...(variant.taxBehavior && { taxBehavior: variant.taxBehavior }),
              ...(variant.nickname && { nickname: variant.nickname }),
            })),
          },
          images: {
            create: (data.images || []).map((img) => ({
              imageURL: img.imageUrl,
              altText: img.altText,
              displayOrder: img.displayOrder ?? 0,
              isMain: img.isMain ?? false,
            })),
          },
        },
        include: {
          variants: true,
          images: true,
        },
      } as any);

      return {
        success: true,
        product,
        stripeProductId: stripeProduct.id,
        message: 'Producto creado exitosamente en Stripe y BD',
      };
    } catch (error) {
      throw new BadRequestException(
        `Error al crear producto: ${error.message}`,
      );
    }
  }

  // Crear producto solo en BD (sin Stripe)
  async createProductsDB(data: CreateProductDto) {
    const {
      name,
      description,
      isActive,
      categoryID,
      genderID,
      basePrice,
      variants = [],
      images = [],
    } = data;

    if (
      typeof basePrice !== 'number' ||
      Number.isNaN(basePrice) ||
      basePrice < 0
    ) {
      throw new BadRequestException(
        'basePrice debe ser un número válido mayor o igual a 0',
      );
    }

    const product = await this.prisma.product.create({
      data: {
        name,
        description,
        basePrice: basePrice,
        isActive,
        categoryID,
        genderID,
        variants: {
          create: variants.map((variant: ProductVariantDto) => ({
            sizeID: variant.sizeID,
            colorID: variant.colorID,
            sku: variant.sku,
            price: variant.price,
            stock: variant.stock ?? 0,
            isActive: variant.isActive ?? true,
          })),
        },
        images: {
          create: images.map((img: ProductImageDto) => ({
            imageURL: img.imageUrl,
            altText: img.altText,
            displayOrder: img.displayOrder ?? 0,
            isMain: img.isMain ?? false,
          })),
        },
      },
      include: {
        variants: true,
        images: true,
      },
    });

    return product;
  }
}
