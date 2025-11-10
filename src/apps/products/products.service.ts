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

          const currencyForStripe = (variant.currency || 'MXN').toLowerCase();

          const stripePrice = await this.stripe.createPrice({
            product: stripeProduct.id,
            currency: currencyForStripe,
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

  async getAllProducts() {
    return this.prisma.product.findMany({
      where: { isActive: true },
      include: {
        variants: {
          where: { isActive: true },
          include: {
            size: true,
            color: true,
          },
        },
        images: {
          orderBy: { displayOrder: 'asc' },
        },
        category: true,
        gender: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Obtener producto por ID con todos sus detalles
  async getProductById(productID: number) {
    const product = await this.prisma.product.findUnique({
      where: { productID },
      include: {
        variants: {
          include: {
            size: true,
            color: true,
          },
        },
        images: {
          orderBy: { displayOrder: 'asc' },
        },
        category: true,
        gender: true,
      },
    });

    if (!product) {
      throw new BadRequestException('Producto no encontrado');
    }

    return {
      success: true,
      product,
    };
  }

  // Obtener todas las categorías activas
  async getAllCategories() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      select: {
        categoryID: true,
        categoryName: true,
        description: true,
        isActive: true,
        _count: {
          select: { products: true },
        },
      },
      orderBy: { categoryName: 'asc' },
    });
  }

  // Obtener categoría específica con sus productos
  async getCategoryWithProducts(categoryID: number) {
    const category = await this.prisma.category.findUnique({
      where: { categoryID },
      include: {
        products: {
          where: { isActive: true },
          include: {
            variants: {
              where: { isActive: true },
              include: {
                size: true,
                color: true,
              },
            },
            images: {
              orderBy: { displayOrder: 'asc' },
            },
            gender: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!category) {
      throw new BadRequestException('Categoría no encontrada');
    }

    return {
      success: true,
      category,
      productsCount: category.products.length,
    };
  }

  // Obtener productos filtrados por categoría
  async getProductsByCategory(categoryID: number) {
    const products = await this.prisma.product.findMany({
      where: {
        categoryID,
        isActive: true,
      },
      include: {
        variants: {
          where: { isActive: true },
          include: {
            size: true,
            color: true,
          },
        },
        images: {
          orderBy: { displayOrder: 'asc' },
        },
        category: true,
        gender: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      categoryID,
      productsCount: products.length,
      products,
    };
  }

  // Obtener productos filtrados por género
  async getProductsByGender(genderID: number) {
    const products = await this.prisma.product.findMany({
      where: {
        genderID,
        isActive: true,
      },
      include: {
        variants: {
          where: { isActive: true },
          include: {
            size: true,
            color: true,
          },
        },
        images: {
          orderBy: { displayOrder: 'asc' },
        },
        category: true,
        gender: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      genderID,
      productsCount: products.length,
      products,
    };
  }

  // Obtener todos los géneros
  async getAllGenders() {
    return this.prisma.gender.findMany({
      select: {
        genderID: true,
        genderName: true,
        _count: {
          select: { products: true },
        },
      },
      orderBy: { genderName: 'asc' },
    });
  }
}
