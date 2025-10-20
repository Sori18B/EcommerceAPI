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
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('/create')
  @ApiOperation({ summary: 'Crear producto completo con variantes e imágenes' })
  async createProduct(@Body() createProductDto: CreateProductDto) {
    return await this.productsService.createProduct(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los productos activos' })
  async getAllProducts() {
    return await this.productsService.getAllProducts();
  }

  @Get(':productID')
  @ApiOperation({ summary: 'Obtener producto por ID con todos sus detalles' })
  @ApiParam({ name: 'productID', type: 'number' })
  async getProductById(@Param('productID', ParseIntPipe) productID: number) {
    return await this.productsService.getProductById(productID);
  }

  @Get('categories/all')
  @ApiOperation({
    summary: 'Obtener todas las categorías activas con contador de productos',
  })
  async getAllCategories() {
    return await this.productsService.getAllCategories();
  }

  @Get('categories/:categoryID')
  @ApiOperation({ summary: 'Obtener categoría específica con sus productos' })
  @ApiParam({ name: 'categoryID', type: 'number' })
  async getCategoryWithProducts(
    @Param('categoryID', ParseIntPipe) categoryID: number,
  ) {
    return await this.productsService.getCategoryWithProducts(categoryID);
  }

  @Get('by-category/:categoryID')
  @ApiOperation({ summary: 'Obtener productos filtrados por categoría' })
  @ApiParam({ name: 'categoryID', type: 'number' })
  async getProductsByCategory(
    @Param('categoryID', ParseIntPipe) categoryID: number,
  ) {
    return await this.productsService.getProductsByCategory(categoryID);
  }

  @Get('by-gender/:genderID')
  @ApiOperation({ summary: 'Obtener productos filtrados por género' })
  @ApiParam({ name: 'genderID', type: 'number' })
  async getProductsByGender(@Param('genderID', ParseIntPipe) genderID: number) {
    return await this.productsService.getProductsByGender(genderID);
  }

  @Get('genders/all')
  @ApiOperation({
    summary: 'Obtener todos los géneros con contador de productos',
  })
  async getAllGenders() {
    return await this.productsService.getAllGenders();
  }
}
