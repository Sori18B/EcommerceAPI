import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de la base de datos...\n');
  // 1. ROLES
  console.log('Creando Roles...');
  const adminRole = await prisma.role.upsert({
    where: { roleName: 'admin' },
    update: {},
    create: {
      roleName: 'admin',
    },
  });

  const clientRole = await prisma.role.upsert({
    where: { roleName: 'cliente' },
    update: {},
    create: {
      roleName: 'cliente',
    },
  });
  console.log('Roles creados: Admin, Cliente\n');

  // 2. DELIVERY STATUS
  console.log('Creando Estados de Entrega...');
  const deliveryStatuses = [
    {
      statusName: 'Pendiente',
      description: 'Orden recibida, pendiente de procesamiento',
    },
    {
      statusName: 'Procesando',
      description: 'Orden en proceso de preparación',
    },
    { statusName: 'Enviado', description: 'Paquete enviado al cliente' },
    { statusName: 'En Tránsito', description: 'Paquete en camino al destino' },
    { statusName: 'Entregado', description: 'Paquete entregado exitosamente' },
    { statusName: 'Cancelado', description: 'Orden cancelada' },
    {
      statusName: 'Devolución Iniciada',
      description: 'Cliente solicitó devolución',
    },
    { statusName: 'Devuelto', description: 'Producto devuelto completamente' },
  ];

  for (const status of deliveryStatuses) {
    await prisma.deliveryStatus.upsert({
      where: { statusName: status.statusName },
      update: {},
      create: status,
    });
  }
  console.log('Estados de entrega creados\n');

  // 3. PAYMENT STATUS
  console.log('Creando Estados de Pago...');
  const paymentStatuses = [
    { statusName: 'Pendiente', description: 'Pago pendiente de procesamiento' },
    {
      statusName: 'Procesando',
      description: 'Pago en proceso de verificación',
    },
    { statusName: 'Pagado', description: 'Pago completado exitosamente' },
    { statusName: 'Fallido', description: 'Pago rechazado o fallido' },
    { statusName: 'Reembolsado', description: 'Pago reembolsado al cliente' },
    { statusName: 'Cancelado', description: 'Pago cancelado' },
  ];

  for (const status of paymentStatuses) {
    await prisma.paymentStatus.upsert({
      where: { statusName: status.statusName },
      update: {},
      create: status,
    });
  }
  console.log('Estados de pago creados\n');

  // 4. CATEGORÍAS
  console.log('Creando Categorías...');
  const categories = [
    { categoryName: 'Camisetas', description: 'Camisetas casuales y formales' },
    {
      categoryName: 'Pantalones',
      description: 'Pantalones de mezclilla, chinos y formales',
    },
    {
      categoryName: 'Vestidos',
      description: 'Vestidos casuales, formales y de noche',
    },
    {
      categoryName: 'Zapatos',
      description: 'Calzado deportivo, casual y formal',
    },
    {
      categoryName: 'Accesorios',
      description: 'Gorras, cinturones, bolsas y más',
    },
    { categoryName: 'Sudaderas', description: 'Sudaderas con y sin capucha' },
    { categoryName: 'Faldas', description: 'Faldas casuales y formales' },
  ];

  const createdCategories: any[] = [];
  for (const category of categories) {
    const created = await prisma.category.upsert({
      where: { categoryName: category.categoryName },
      update: {},
      create: category,
    });
    createdCategories.push(created);
  }
  console.log('Categorías creadas\n');

  // 5. GÉNEROS
  console.log('Creando Géneros...');
  const genders = [
    { genderName: 'Hombre' },
    { genderName: 'Mujer' },
    { genderName: 'Unisex' },
  ];

  const createdGenders: any[] = [];
  for (const gender of genders) {
    const created = await prisma.gender.upsert({
      where: { genderName: gender.genderName },
      update: {},
      create: gender,
    });
    createdGenders.push(created);
  }
  console.log('Géneros creados\n');

  // 6. TALLAS
  console.log('Creando Tallas...');
  const sizes = [
    { sizeLabel: 'XS', sizeOrder: 1 },
    { sizeLabel: 'S', sizeOrder: 2 },
    { sizeLabel: 'M', sizeOrder: 3 },
    { sizeLabel: 'L', sizeOrder: 4 },
    { sizeLabel: 'XL', sizeOrder: 5 },
    { sizeLabel: 'XXL', sizeOrder: 6 },
  ];

  const createdSizes: any[] = [];
  for (const size of sizes) {
    const created = await prisma.size.upsert({
      where: { sizeLabel: size.sizeLabel },
      update: {},
      create: size,
    });
    createdSizes.push(created);
  }
  console.log('Tallas creadas\n');

  // 7. COLORES
  console.log('Creando Colores...');
  const colors = [
    { colorName: 'Negro', hexCode: '#000000' },
    { colorName: 'Blanco', hexCode: '#FFFFFF' },
    { colorName: 'Rojo', hexCode: '#FF0000' },
    { colorName: 'Azul', hexCode: '#0000FF' },
    { colorName: 'Verde', hexCode: '#00FF00' },
    { colorName: 'Amarillo', hexCode: '#FFFF00' },
    { colorName: 'Gris', hexCode: '#808080' },
    { colorName: 'Rosa', hexCode: '#FFC0CB' },
    { colorName: 'Beige', hexCode: '#F5F5DC' },
    { colorName: 'Azul Marino', hexCode: '#000080' },
  ];

  const createdColors: any[] = [];
  for (const color of colors) {
    const created = await prisma.color.upsert({
      where: { colorName: color.colorName },
      update: {},
      create: color,
    });
    createdColors.push(created);
  }
  console.log('Colores creados\n');

  // 8. USUARIOS DE PRUEBA
  console.log('Creando Usuarios de Prueba...');

  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@vistella.com' },
    update: {},
    create: {
      roleID: adminRole.roleID,
      name: 'Admin',
      lastName: 'Vistella',
      email: 'admin@vistella.com',
      password: hashedPassword,
      phoneNumber: '5551234567',
    },
  });

  const clientPassword = await bcrypt.hash('Cliente123!', 10);

  const clientUser = await prisma.user.upsert({
    where: { email: 'cliente@test.com' },
    update: {},
    create: {
      roleID: clientRole.roleID,
      name: 'Juan',
      lastName: 'Pérez',
      email: 'cliente@test.com',
      password: clientPassword,
      phoneNumber: '5559876543',
    },
  });

  console.log('Usuarios creados:');
  console.log('Admin: admin@vistella.com / Admin123!');
  console.log('Cliente: cliente@test.com / Cliente123!\n');

  // Crear dirección para el cliente de prueba
  await prisma.address.upsert({
    where: { addressID: 1 },
    update: {},
    create: {
      userID: clientUser.userID,
      addressType: 'BOTH',
      firstName: 'Juan',
      lastName: 'Pérez',
      street: 'Av. Reforma 123',
      neighborhood: 'Centro',
      city: 'Ciudad de México',
      state: 'CDMX',
      postalCode: '06000',
      countryCode: 'MX',
      isBillingDefault: true,
      isShippingDefault: true,
    },
  });

  // 9. PRODUCTOS CON VARIANTES E IMÁGENES
  console.log('Creando Productos...');

  const products = [
    {
      name: 'Camiseta Básica de Algodón',
      description:
        'Camiseta de algodón 100% premium, perfecta para uso diario. Corte clásico y cómodo.',
      basePrice: 299.0,
      categoryID: createdCategories.find((c) => c.categoryName === 'Camisetas')
        .categoryID,
      genderID: createdGenders.find((g) => g.genderName === 'Unisex').genderID,
      images: [
        {
          imageURL:
            'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab',
          altText: 'Camiseta blanca',
          displayOrder: 0,
          isMain: true,
        },
        {
          imageURL:
            'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a',
          altText: 'Camiseta negra',
          displayOrder: 1,
          isMain: false,
        },
      ],
      variants: [
        { sizeLabel: 'S', colorName: 'Blanco', stock: 50, price: 299.0 },
        { sizeLabel: 'M', colorName: 'Blanco', stock: 75, price: 299.0 },
        { sizeLabel: 'L', colorName: 'Blanco', stock: 60, price: 299.0 },
        { sizeLabel: 'S', colorName: 'Negro', stock: 40, price: 299.0 },
        { sizeLabel: 'M', colorName: 'Negro', stock: 80, price: 299.0 },
        { sizeLabel: 'L', colorName: 'Negro', stock: 55, price: 299.0 },
      ],
    },
    {
      name: 'Jeans Slim Fit Azul',
      description:
        'Pantalón de mezclilla con corte slim fit moderno. Cómodo y versátil para cualquier ocasión.',
      basePrice: 799.0,
      categoryID: createdCategories.find((c) => c.categoryName === 'Pantalones')
        .categoryID,
      genderID: createdGenders.find((g) => g.genderName === 'Hombre').genderID,
      images: [
        {
          imageURL: 'https://images.unsplash.com/photo-1542272604-787c3835535d',
          altText: 'Jeans azul',
          displayOrder: 0,
          isMain: true,
        },
        {
          imageURL:
            'https://images.unsplash.com/photo-1541099649105-f69ad21f3246',
          altText: 'Detalle jeans',
          displayOrder: 1,
          isMain: false,
        },
      ],
      variants: [
        { sizeLabel: 'M', colorName: 'Azul', stock: 30, price: 799.0 },
        { sizeLabel: 'L', colorName: 'Azul', stock: 35, price: 799.0 },
        { sizeLabel: 'XL', colorName: 'Azul', stock: 25, price: 799.0 },
        { sizeLabel: 'M', colorName: 'Azul Marino', stock: 20, price: 849.0 },
        { sizeLabel: 'L', colorName: 'Azul Marino', stock: 22, price: 849.0 },
      ],
    },
    {
      name: 'Vestido Floral de Verano',
      description:
        'Vestido ligero con estampado floral, ideal para días cálidos. Tela fresca y cómoda.',
      basePrice: 899.0,
      categoryID: createdCategories.find((c) => c.categoryName === 'Vestidos')
        .categoryID,
      genderID: createdGenders.find((g) => g.genderName === 'Mujer').genderID,
      images: [
        {
          imageURL:
            'https://images.unsplash.com/photo-1595777457583-95e059d581b8',
          altText: 'Vestido floral',
          displayOrder: 0,
          isMain: true,
        },
        {
          imageURL:
            'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1',
          altText: 'Vestido rosa',
          displayOrder: 1,
          isMain: false,
        },
      ],
      variants: [
        { sizeLabel: 'S', colorName: 'Rosa', stock: 25, price: 899.0 },
        { sizeLabel: 'M', colorName: 'Rosa', stock: 30, price: 899.0 },
        { sizeLabel: 'L', colorName: 'Rosa', stock: 20, price: 899.0 },
        { sizeLabel: 'S', colorName: 'Azul', stock: 18, price: 899.0 },
        { sizeLabel: 'M', colorName: 'Azul', stock: 22, price: 899.0 },
      ],
    },
    {
      name: 'Sudadera con Capucha',
      description:
        'Sudadera de algodón con capucha y bolsillo frontal. Perfecta para climas frescos.',
      basePrice: 599.0,
      categoryID: createdCategories.find((c) => c.categoryName === 'Sudaderas')
        .categoryID,
      genderID: createdGenders.find((g) => g.genderName === 'Unisex').genderID,
      images: [
        {
          imageURL: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7',
          altText: 'Sudadera gris',
          displayOrder: 0,
          isMain: true,
        },
        {
          imageURL:
            'https://images.unsplash.com/photo-1620799140188-3b2a7fd2eb53',
          altText: 'Sudadera negra',
          displayOrder: 1,
          isMain: false,
        },
      ],
      variants: [
        { sizeLabel: 'M', colorName: 'Gris', stock: 40, price: 599.0 },
        { sizeLabel: 'L', colorName: 'Gris', stock: 45, price: 599.0 },
        { sizeLabel: 'XL', colorName: 'Gris', stock: 30, price: 599.0 },
        { sizeLabel: 'M', colorName: 'Negro', stock: 50, price: 599.0 },
        { sizeLabel: 'L', colorName: 'Negro', stock: 55, price: 599.0 },
      ],
    },
    {
      name: 'Tenis Deportivos Running',
      description:
        'Tenis ligeros diseñados para correr. Suela con amortiguación y soporte superior.',
      basePrice: 1299.0,
      categoryID: createdCategories.find((c) => c.categoryName === 'Zapatos')
        .categoryID,
      genderID: createdGenders.find((g) => g.genderName === 'Unisex').genderID,
      images: [
        {
          imageURL: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
          altText: 'Tenis running',
          displayOrder: 0,
          isMain: true,
        },
        {
          imageURL:
            'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa',
          altText: 'Tenis detalle',
          displayOrder: 1,
          isMain: false,
        },
      ],
      variants: [
        { sizeLabel: 'M', colorName: 'Negro', stock: 20, price: 1299.0 },
        { sizeLabel: 'L', colorName: 'Negro', stock: 25, price: 1299.0 },
        { sizeLabel: 'M', colorName: 'Blanco', stock: 18, price: 1299.0 },
        { sizeLabel: 'L', colorName: 'Blanco', stock: 22, price: 1299.0 },
      ],
    },
    {
      name: 'Camisa Formal Manga Larga',
      description:
        'Camisa de vestir en algodón premium. Perfecta para eventos formales y oficina.',
      basePrice: 699.0,
      categoryID: createdCategories.find((c) => c.categoryName === 'Camisetas')
        .categoryID,
      genderID: createdGenders.find((g) => g.genderName === 'Hombre').genderID,
      images: [
        {
          imageURL:
            'https://images.unsplash.com/photo-1602810318660-d2c46b750f88',
          altText: 'Camisa blanca',
          displayOrder: 0,
          isMain: true,
        },
        {
          imageURL:
            'https://images.unsplash.com/photo-1596755094514-f87e34085b2c',
          altText: 'Camisa azul',
          displayOrder: 1,
          isMain: false,
        },
      ],
      variants: [
        { sizeLabel: 'M', colorName: 'Blanco', stock: 35, price: 699.0 },
        { sizeLabel: 'L', colorName: 'Blanco', stock: 40, price: 699.0 },
        { sizeLabel: 'XL', colorName: 'Blanco', stock: 30, price: 699.0 },
        { sizeLabel: 'M', colorName: 'Azul', stock: 25, price: 699.0 },
        { sizeLabel: 'L', colorName: 'Azul', stock: 28, price: 699.0 },
      ],
    },
    {
      name: 'Falda Midi Plisada',
      description:
        'Falda elegante con pliegues, perfecta para looks casuales y formales.',
      basePrice: 599.0,
      categoryID: createdCategories.find((c) => c.categoryName === 'Faldas')
        .categoryID,
      genderID: createdGenders.find((g) => g.genderName === 'Mujer').genderID,
      images: [
        {
          imageURL:
            'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa',
          altText: 'Falda negra',
          displayOrder: 0,
          isMain: true,
        },
        {
          imageURL:
            'https://images.unsplash.com/photo-1594633313593-bab3825d0caf',
          altText: 'Falda beige',
          displayOrder: 1,
          isMain: false,
        },
      ],
      variants: [
        { sizeLabel: 'S', colorName: 'Negro', stock: 20, price: 599.0 },
        { sizeLabel: 'M', colorName: 'Negro', stock: 25, price: 599.0 },
        { sizeLabel: 'L', colorName: 'Negro', stock: 18, price: 599.0 },
        { sizeLabel: 'S', colorName: 'Beige', stock: 15, price: 599.0 },
        { sizeLabel: 'M', colorName: 'Beige', stock: 20, price: 599.0 },
      ],
    },
    {
      name: 'Gorra Snapback Classic',
      description:
        'Gorra ajustable con diseño clásico. Material resistente y cómodo.',
      basePrice: 349.0,
      categoryID: createdCategories.find((c) => c.categoryName === 'Accesorios')
        .categoryID,
      genderID: createdGenders.find((g) => g.genderName === 'Unisex').genderID,
      images: [
        {
          imageURL:
            'https://images.unsplash.com/photo-1588850561407-ed78c282e89b',
          altText: 'Gorra negra',
          displayOrder: 0,
          isMain: true,
        },
        {
          imageURL:
            'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc',
          altText: 'Gorra blanca',
          displayOrder: 1,
          isMain: false,
        },
      ],
      variants: [
        { sizeLabel: 'M', colorName: 'Negro', stock: 60, price: 349.0 },
        { sizeLabel: 'M', colorName: 'Blanco', stock: 45, price: 349.0 },
        { sizeLabel: 'M', colorName: 'Gris', stock: 40, price: 349.0 },
      ],
    },
    {
      name: 'Pantalón Cargo Utilitario',
      description:
        'Pantalón cargo con múltiples bolsillos. Resistente y funcional para uso diario.',
      basePrice: 849.0,
      categoryID: createdCategories.find((c) => c.categoryName === 'Pantalones')
        .categoryID,
      genderID: createdGenders.find((g) => g.genderName === 'Hombre').genderID,
      images: [
        {
          imageURL:
            'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80',
          altText: 'Pantalón cargo',
          displayOrder: 0,
          isMain: true,
        },
        {
          imageURL:
            'https://images.unsplash.com/photo-1603252109303-2751441dd157',
          altText: 'Pantalón verde',
          displayOrder: 1,
          isMain: false,
        },
      ],
      variants: [
        { sizeLabel: 'M', colorName: 'Verde', stock: 25, price: 849.0 },
        { sizeLabel: 'L', colorName: 'Verde', stock: 30, price: 849.0 },
        { sizeLabel: 'XL', colorName: 'Verde', stock: 20, price: 849.0 },
        { sizeLabel: 'M', colorName: 'Beige', stock: 22, price: 849.0 },
        { sizeLabel: 'L', colorName: 'Beige', stock: 25, price: 849.0 },
      ],
    },
    {
      name: 'Blusa Elegante Satinada',
      description:
        'Blusa de satén con acabado elegante. Perfecta para ocasiones especiales.',
      basePrice: 749.0,
      categoryID: createdCategories.find((c) => c.categoryName === 'Camisetas')
        .categoryID,
      genderID: createdGenders.find((g) => g.genderName === 'Mujer').genderID,
      images: [
        {
          imageURL:
            'https://images.unsplash.com/photo-1618932260643-eee4a2f652a6',
          altText: 'Blusa satinada',
          displayOrder: 0,
          isMain: true,
        },
        {
          imageURL:
            'https://images.unsplash.com/photo-1564257577802-19ae39b93122',
          altText: 'Blusa rosa',
          displayOrder: 1,
          isMain: false,
        },
      ],
      variants: [
        { sizeLabel: 'S', colorName: 'Rosa', stock: 20, price: 749.0 },
        { sizeLabel: 'M', colorName: 'Rosa', stock: 25, price: 749.0 },
        { sizeLabel: 'L', colorName: 'Rosa', stock: 18, price: 749.0 },
        { sizeLabel: 'S', colorName: 'Negro', stock: 22, price: 749.0 },
        { sizeLabel: 'M', colorName: 'Negro', stock: 28, price: 749.0 },
      ],
    },
  ];

  let productCount = 0;
  for (const productData of products) {
    const { images, variants, ...productInfo } = productData;

    const product = await prisma.product.create({
      data: {
        ...productInfo,
        images: {
          create: images,
        },
      },
    });

    // Crear variantes para este producto
    for (const variant of variants) {
      const size = createdSizes.find((s) => s.sizeLabel === variant.sizeLabel);
      const color = createdColors.find(
        (c) => c.colorName === variant.colorName,
      );

      if (size && color) {
        await prisma.productVariant.create({
          data: {
            productID: product.productID,
            sizeID: size.sizeID,
            colorID: color.colorID,
            sku: `${product.name.substring(0, 3).toUpperCase()}-${size.sizeLabel}-${color.colorName.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
            price: variant.price,
            stock: variant.stock,
            isActive: true,
          },
        });
      }
    }

    productCount++;
    console.log(`   ✓ ${productCount}. ${product.name}`);
  }

  console.log(`\n${productCount} productos creados con variantes e imágenes\n`);

  // 10. CUPONES DE DESCUENTO
  console.log('Creando Cupones de Descuento...');

  const now = new Date();
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + 3); // 3 meses de validez

  const coupons = [
    {
      code: 'BIENVENIDO10',
      description: 'Descuento del 10% para nuevos clientes',
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: 500,
      maxUsageLimit: 100,
      maxUsagePerUser: 1,
      validFrom: now,
      validUntil: futureDate,
      isActive: true,
    },
    {
      code: 'ENVIOGRATIS',
      description: 'Envío gratis en compras mayores a $1000',
      discountType: 'free_shipping',
      discountValue: 0,
      minOrderAmount: 1000,
      maxUsageLimit: 50,
      maxUsagePerUser: 2,
      validFrom: now,
      validUntil: futureDate,
      isActive: true,
    },
    {
      code: 'VERANO2025',
      description: 'Descuento de $100 en compras de verano',
      discountType: 'fixed_amount',
      discountValue: 100,
      minOrderAmount: 800,
      maxUsageLimit: 200,
      maxUsagePerUser: 3,
      validFrom: now,
      validUntil: futureDate,
      isActive: true,
    },
  ];

  for (const coupon of coupons) {
    await prisma.discountCoupons.upsert({
      where: { code: coupon.code },
      update: {},
      create: coupon,
    });
  }

  console.log('Cupones creados: BIENVENIDO10, ENVIOGRATIS, VERANO2025\n');

  // RESUMEN FINAL
  console.log('SEED COMPLETADO EXITOSAMENTE');
  console.log('\n Resumen de datos creados:');
  console.log(`   2 Roles (Admin, Cliente)`);
  console.log(`   8 Estados de Entrega`);
  console.log(`   6 Estados de Pago`);
  console.log(`   7 Categorías`);
  console.log(`   3 Géneros`);
  console.log(`   6 Tallas`);
  console.log(`   10 Colores`);
  console.log(`   2 Usuarios de prueba`);
  console.log(`   10 Productos con variantes`);
  console.log(`   3 Cupones de descuento`);
  console.log('\n Credenciales de acceso:');
  console.log('   Admin: admin@vistella.com / Admin123!');
  console.log('   Cliente: cliente@test.com / Cliente123!');
  console.log('\n La base de datos está lista para usar!\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error durante el seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
