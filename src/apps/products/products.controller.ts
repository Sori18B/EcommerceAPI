import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/product.dto';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { Public } from 'src/middlewares/auth/public.decorator';
import { Roles } from 'src/middlewares/auth/roles.decorator';
import { ApiCookieAuth } from 'src/middlewares/auth/cookie-auth.decorator';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Roles('admin')
  @ApiCookieAuth()
  @Post('/create')
  @ApiOperation({
    summary: 'Crear producto completo con variantes e imágenes (Solo Admin)',
    description:
      'Endpoint exclusivo para administradores. Permite crear un producto con todas sus variantes, imágenes y configuración de Stripe.',
  })
  @ApiResponse({
    status: 201,
    description: 'Producto creado exitosamente',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Se requiere rol de administrador',
    schema: {
      example: {
        success: false,
        message: 'Se requiere uno de los siguientes roles: admin',
      },
    },
  })
  async createProduct(@Body() createProductDto: CreateProductDto) {
    return await this.productsService.createProduct(createProductDto);
  }

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Obtener todos los productos activos (Público)',
    description:
      'Endpoint público que retorna el catálogo completo de productos activos.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de productos obtenida exitosamente',
  })
  async getAllProducts() {
    return await this.productsService.getAllProducts();
  }

  @Public()
  @Get(':productID')
  @ApiOperation({
    summary: 'Obtener producto por ID con todos sus detalles (Público)',
    description:
      'Endpoint público que retorna la información completa de un producto incluyendo variantes, imágenes, categoría y género.',
  })
  @ApiParam({ name: 'productID', type: 'number', description: 'ID del producto' })
  @ApiResponse({
    status: 200,
    description: 'Producto obtenido exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Producto no encontrado',
  })
  async getProductById(@Param('productID', ParseIntPipe) productID: number) {
    return await this.productsService.getProductById(productID);
  }

  @Public()
  @Get('categories/all')
  @ApiOperation({
    summary: 'Obtener todas las categorías activas con contador de productos (Público)',
    description:
      'Endpoint público que retorna todas las categorías disponibles con el número de productos en cada una.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de categorías obtenida exitosamente',
  })
  async getAllCategories() {
    return await this.productsService.getAllCategories();
  }

  @Public()
  @Get('categories/:categoryID')
  @ApiOperation({
    summary: 'Obtener categoría específica con sus productos (Público)',
    description:
      'Endpoint público que retorna una categoría con todos sus productos activos.',
  })
  @ApiParam({ name: 'categoryID', type: 'number', description: 'ID de la categoría' })
  @ApiResponse({
    status: 200,
    description: 'Categoría con productos obtenida exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Categoría no encontrada',
  })
  async getCategoryWithProducts(
    @Param('categoryID', ParseIntPipe) categoryID: number,
  ) {
    return await this.productsService.getCategoryWithProducts(categoryID);
  }

  @Public()
  @Get('by-category/:categoryID')
  @ApiOperation({
    summary: 'Obtener productos filtrados por categoría (Público)',
    description:
      'Endpoint público que retorna todos los productos activos de una categoría específica.',
  })
  @ApiParam({ name: 'categoryID', type: 'number', description: 'ID de la categoría' })
  @ApiResponse({
    status: 200,
    description: 'Productos filtrados obtenidos exitosamente',
  })
  async getProductsByCategory(
    @Param('categoryID', ParseIntPipe) categoryID: number,
  ) {
    return await this.productsService.getProductsByCategory(categoryID);
  }

  @Public()
  @Get('by-gender/:genderID')
  @ApiOperation({
    summary: 'Obtener productos filtrados por género (Público)',
    description:
      'Endpoint público que retorna todos los productos activos de un género específico.',
  })
  @ApiParam({ name: 'genderID', type: 'number', description: 'ID del género' })
  @ApiResponse({
    status: 200,
    description: 'Productos filtrados obtenidos exitosamente',
  })
  async getProductsByGender(@Param('genderID', ParseIntPipe) genderID: number) {
    return await this.productsService.getProductsByGender(genderID);
  }

  @Public()
  @Get('genders/all')
  @ApiOperation({
    summary: 'Obtener todos los géneros con contador de productos (Público)',
    description:
      'Endpoint público que retorna todos los géneros disponibles con el número de productos en cada uno.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de géneros obtenida exitosamente',
  })
  async getAllGenders() {
    return await this.productsService.getAllGenders();
  }
}
