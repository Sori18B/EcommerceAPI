import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  //Obtener o crear carrito del usuario
  private async getOrCreateCart(userID: number) {
    let cart = await this.prisma.shoppingCart.findUnique({
      where: { userID },
    });

    if (!cart) {
      cart = await this.prisma.shoppingCart.create({
        data: { userID },
      });
    }

    return cart;
  }

  //Agregar producto al carrito, si ya existe incrementa
  async addToCart(userID: number, dto: AddToCartDto) {
    // Validar que la variante existe y está activa
    const variant = await this.prisma.productVariant.findUnique({
      where: { productVariantID: dto.productVariantID },
      include: {
        product: {
          include: {
            images: {
              where: { isMain: true },
              take: 1,
            },
            category: true,
            gender: true,
          },
        },
        size: true,
        color: true,
      },
    });

    if (!variant) {
      throw new NotFoundException(
        `Variante de producto con ID ${dto.productVariantID} no encontrada`,
      );
    }

    if (!variant.isActive) {
      throw new BadRequestException(
        'Esta variante de producto no está disponible',
      );
    }

    if (!variant.product.isActive) {
      throw new BadRequestException('Este producto no está disponible');
    }

    // Validar stock disponible
    if (variant.stock < dto.quantity) {
      throw new BadRequestException(
        `Stock insuficiente. Solo hay ${variant.stock} unidades disponibles`,
      );
    }

    // Obtener o crear carrito
    const cart = await this.getOrCreateCart(userID);

    // Verificar si el item ya existe en el carrito
    const existingItem = await this.prisma.shoppingCartItem.findUnique({
      where: {
        cartID_productVariantID: {
          cartID: cart.cartID,
          productVariantID: dto.productVariantID,
        },
      },
    });

    let cartItem;

    if (existingItem) {
      // Si existe, incrementar cantidad
      const newQuantity = existingItem.quantity + dto.quantity;

      // Validar que no exceda el stock
      if (newQuantity > variant.stock) {
        throw new BadRequestException(
          `No se puede agregar. Ya tienes ${existingItem.quantity} unidades y solo hay ${variant.stock} disponibles`,
        );
      }

      cartItem = await this.prisma.shoppingCartItem.update({
        where: { cartItemID: existingItem.cartItemID },
        data: { quantity: newQuantity },
        include: {
          productVariant: {
            include: {
              product: {
                include: {
                  images: { where: { isMain: true }, take: 1 },
                  category: true,
                  gender: true,
                },
              },
              size: true,
              color: true,
            },
          },
        },
      });
    } else {
      // Si no existe, crear nuevo item
      cartItem = await this.prisma.shoppingCartItem.create({
        data: {
          cartID: cart.cartID,
          productVariantID: dto.productVariantID,
          quantity: dto.quantity,
        },
        include: {
          productVariant: {
            include: {
              product: {
                include: {
                  images: { where: { isMain: true }, take: 1 },
                  category: true,
                  gender: true,
                },
              },
              size: true,
              color: true,
            },
          },
        },
      });
    }

    const subtotal = Number(cartItem.productVariant.price) * cartItem.quantity;

    return {
      success: true,
      message: existingItem
        ? 'Cantidad actualizada en el carrito'
        : 'Producto agregado al carrito exitosamente',
      data: {
        cartItemID: cartItem.cartItemID,
        quantity: cartItem.quantity,
        addedAt: cartItem.addedAt,
        productVariant: {
          productVariantID: cartItem.productVariant.productVariantID,
          sku: cartItem.productVariant.sku,
          price: cartItem.productVariant.price,
          stock: cartItem.productVariant.stock,
          size: cartItem.productVariant.size.sizeLabel,
          color: {
            name: cartItem.productVariant.color.colorName,
            hexCode: cartItem.productVariant.color.hexCode,
          },
          product: {
            productID: cartItem.productVariant.product.productID,
            name: cartItem.productVariant.product.name,
            mainImage:
              cartItem.productVariant.product.images[0]?.imageURL || null,
            category: cartItem.productVariant.product.category.categoryName,
            gender: cartItem.productVariant.product.gender.genderName,
          },
        },
        subtotal,
      },
    };
  }

  //Obtener carrito del usuario con todos sus items
  async getCart(userID: number) {
    const cart = await this.prisma.shoppingCart.findUnique({
      where: { userID },
      include: {
        items: {
          include: {
            productVariant: {
              include: {
                product: {
                  include: {
                    images: { where: { isMain: true }, take: 1 },
                    category: true,
                    gender: true,
                  },
                },
                size: true,
                color: true,
              },
            },
          },
          orderBy: {
            addedAt: 'desc', // Más recientes primero
          },
        },
      },
    });

    if (!cart) {
      // Si no tiene carrito, retornar carrito vacío
      return {
        success: true,
        data: {
          cartID: null,
          items: [],
          summary: {
            totalItems: 0,
            totalQuantity: 0,
            subtotal: 0,
            estimatedTotal: 0,
          },
        },
      };
    }

    // Filtrar items de productos/variantes inactivos
    const activeItems = cart.items.filter(
      (item) =>
        item.productVariant.isActive && item.productVariant.product.isActive,
    );

    // Calcular totales
    let totalQuantity = 0;
    let subtotal = 0;

    const itemsData = activeItems.map((item) => {
      const itemSubtotal = Number(item.productVariant.price) * item.quantity;
      totalQuantity += item.quantity;
      subtotal += itemSubtotal;

      return {
        cartItemID: item.cartItemID,
        quantity: item.quantity,
        addedAt: item.addedAt,
        productVariant: {
          productVariantID: item.productVariant.productVariantID,
          sku: item.productVariant.sku,
          price: item.productVariant.price,
          stock: item.productVariant.stock,
          size: item.productVariant.size.sizeLabel,
          color: {
            name: item.productVariant.color.colorName,
            hexCode: item.productVariant.color.hexCode,
          },
          product: {
            productID: item.productVariant.product.productID,
            name: item.productVariant.product.name,
            mainImage: item.productVariant.product.images[0]?.imageURL || null,
            category: item.productVariant.product.category.categoryName,
            gender: item.productVariant.product.gender.genderName,
          },
        },
        subtotal: itemSubtotal,
      };
    });

    return {
      success: true,
      data: {
        cartID: cart.cartID,
        items: itemsData,
        summary: {
          totalItems: activeItems.length,
          totalQuantity,
          subtotal: Number(subtotal.toFixed(2)),
          estimatedTotal: Number(subtotal.toFixed(2)), // Sin impuestos/envío por ahora
        },
      },
    };
  }

  //Actualizar cantidad de un item en el carrito
  async updateCartItem(
    userID: number,
    cartItemID: number,
    dto: UpdateCartItemDto,
  ) {
    // Obtener carrito del usuario
    const cart = await this.prisma.shoppingCart.findUnique({
      where: { userID },
    });

    if (!cart) {
      throw new NotFoundException('No tienes un carrito activo');
    }

    // Verificar que el item existe y pertenece al carrito del usuario
    const cartItem = await this.prisma.shoppingCartItem.findUnique({
      where: { cartItemID },
      include: {
        productVariant: {
          include: {
            product: {
              include: {
                images: { where: { isMain: true }, take: 1 },
                category: true,
                gender: true,
              },
            },
            size: true,
            color: true,
          },
        },
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Item no encontrado en el carrito');
    }

    if (cartItem.cartID !== cart.cartID) {
      throw new BadRequestException('Este item no pertenece a tu carrito');
    }

    // Validar stock disponible
    if (dto.quantity > cartItem.productVariant.stock) {
      throw new BadRequestException(
        `Stock insuficiente. Solo hay ${cartItem.productVariant.stock} unidades disponibles`,
      );
    }

    // Actualizar cantidad
    const updatedItem = await this.prisma.shoppingCartItem.update({
      where: { cartItemID },
      data: { quantity: dto.quantity },
      include: {
        productVariant: {
          include: {
            product: {
              include: {
                images: { where: { isMain: true }, take: 1 },
                category: true,
                gender: true,
              },
            },
            size: true,
            color: true,
          },
        },
      },
    });

    const subtotal =
      Number(updatedItem.productVariant.price) * updatedItem.quantity;

    return {
      success: true,
      message: 'Cantidad actualizada exitosamente',
      data: {
        cartItemID: updatedItem.cartItemID,
        quantity: updatedItem.quantity,
        productVariant: {
          productVariantID: updatedItem.productVariant.productVariantID,
          sku: updatedItem.productVariant.sku,
          price: updatedItem.productVariant.price,
          stock: updatedItem.productVariant.stock,
          size: updatedItem.productVariant.size.sizeLabel,
          color: {
            name: updatedItem.productVariant.color.colorName,
            hexCode: updatedItem.productVariant.color.hexCode,
          },
          product: {
            productID: updatedItem.productVariant.product.productID,
            name: updatedItem.productVariant.product.name,
            mainImage:
              updatedItem.productVariant.product.images[0]?.imageURL || null,
            category: updatedItem.productVariant.product.category.categoryName,
            gender: updatedItem.productVariant.product.gender.genderName,
          },
        },
        subtotal,
      },
    };
  }

  //Eliminar un item del carrito

  async removeCartItem(userID: number, cartItemID: number) {
    // Obtener carrito del usuario
    const cart = await this.prisma.shoppingCart.findUnique({
      where: { userID },
    });

    if (!cart) {
      throw new NotFoundException('No tienes un carrito activo');
    }

    // Verificar que el item existe y pertenece al carrito del usuario
    const cartItem = await this.prisma.shoppingCartItem.findUnique({
      where: { cartItemID },
    });

    if (!cartItem) {
      throw new NotFoundException('Item no encontrado en el carrito');
    }

    if (cartItem.cartID !== cart.cartID) {
      throw new BadRequestException('Este item no pertenece a tu carrito');
    }

    // Eliminar item
    await this.prisma.shoppingCartItem.delete({
      where: { cartItemID },
    });

    return {
      success: true,
      message: 'Producto eliminado del carrito exitosamente',
    };
  }

  //Vaciar todo el carrito

  async clearCart(userID: number) {
    const cart = await this.prisma.shoppingCart.findUnique({
      where: { userID },
    });

    if (!cart) {
      throw new NotFoundException('No tienes un carrito activo');
    }

    // Eliminar todos los items
    await this.prisma.shoppingCartItem.deleteMany({
      where: { cartID: cart.cartID },
    });

    return {
      success: true,
      message: 'Carrito vaciado exitosamente',
    };
  }

  //Obtener resumen del carrito (solo totales)

  async getCartSummary(userID: number) {
    const cart = await this.prisma.shoppingCart.findUnique({
      where: { userID },
      include: {
        items: {
          include: {
            productVariant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      return {
        success: true,
        data: {
          totalItems: 0,
          totalQuantity: 0,
          subtotal: 0,
          estimatedTotal: 0,
        },
      };
    }

    // Filtrar items activos
    const activeItems = cart.items.filter(
      (item) =>
        item.productVariant.isActive && item.productVariant.product.isActive,
    );

    let totalQuantity = 0;
    let subtotal = 0;

    activeItems.forEach((item) => {
      totalQuantity += item.quantity;
      subtotal += Number(item.productVariant.price) * item.quantity;
    });

    return {
      success: true,
      data: {
        totalItems: activeItems.length,
        totalQuantity,
        subtotal: Number(subtotal.toFixed(2)),
        estimatedTotal: Number(subtotal.toFixed(2)),
      },
    };
  }
}
