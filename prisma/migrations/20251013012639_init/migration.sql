-- CreateEnum
CREATE TYPE "public"."AddressType" AS ENUM ('BILLING', 'SHIPPING', 'BOTH');

-- CreateEnum
CREATE TYPE "public"."PaymentMode" AS ENUM ('payment', 'subscription', 'setup');

-- CreateEnum
CREATE TYPE "public"."TaxBehavior" AS ENUM ('inclusive', 'exclusive', 'unspecified');

-- CreateTable
CREATE TABLE "public"."User" (
    "userID" SERIAL NOT NULL,
    "roleID" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phoneNumber" VARCHAR(15) NOT NULL,
    "imageURL" TEXT,
    "stripeCustomerID" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userID")
);

-- CreateTable
CREATE TABLE "public"."Address" (
    "addressID" SERIAL NOT NULL,
    "userID" INTEGER NOT NULL,
    "addressType" "public"."AddressType" NOT NULL DEFAULT 'BOTH',
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "street" VARCHAR(255) NOT NULL,
    "neighborhood" VARCHAR(100),
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "postalCode" VARCHAR(20) NOT NULL,
    "countryCode" VARCHAR(2) NOT NULL,
    "isBillingDefault" BOOLEAN NOT NULL DEFAULT false,
    "isShippingDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("addressID")
);

-- CreateTable
CREATE TABLE "public"."Role" (
    "roleID" SERIAL NOT NULL,
    "roleName" VARCHAR(50) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("roleID")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "productID" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "stripeProductId" VARCHAR(255),
    "taxCode" VARCHAR(50),
    "shippable" BOOLEAN DEFAULT true,
    "categoryID" INTEGER NOT NULL,
    "genderID" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("productID")
);

-- CreateTable
CREATE TABLE "public"."Category" (
    "categoryID" SERIAL NOT NULL,
    "categoryName" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("categoryID")
);

-- CreateTable
CREATE TABLE "public"."Gender" (
    "genderID" SERIAL NOT NULL,
    "genderName" VARCHAR(50) NOT NULL,

    CONSTRAINT "Gender_pkey" PRIMARY KEY ("genderID")
);

-- CreateTable
CREATE TABLE "public"."ProductImage" (
    "imageID" SERIAL NOT NULL,
    "productID" INTEGER NOT NULL,
    "imageURL" VARCHAR(2048) NOT NULL,
    "altText" VARCHAR(255),
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("imageID")
);

-- CreateTable
CREATE TABLE "public"."ProductVariant" (
    "productVariantID" SERIAL NOT NULL,
    "productID" INTEGER NOT NULL,
    "sizeID" INTEGER NOT NULL,
    "colorID" INTEGER NOT NULL,
    "sku" VARCHAR(100) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stripePriceId" VARCHAR(255),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'mxn',
    "mode" "public"."PaymentMode" DEFAULT 'payment',
    "taxBehavior" "public"."TaxBehavior" DEFAULT 'unspecified',
    "nickname" VARCHAR(255),

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("productVariantID")
);

-- CreateTable
CREATE TABLE "public"."Size" (
    "sizeID" SERIAL NOT NULL,
    "sizeLabel" VARCHAR(100) NOT NULL,
    "sizeOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Size_pkey" PRIMARY KEY ("sizeID")
);

-- CreateTable
CREATE TABLE "public"."Color" (
    "colorID" SERIAL NOT NULL,
    "colorName" VARCHAR(100) NOT NULL,
    "hexCode" VARCHAR(7),

    CONSTRAINT "Color_pkey" PRIMARY KEY ("colorID")
);

-- CreateTable
CREATE TABLE "public"."Favorite" (
    "favoriteID" SERIAL NOT NULL,
    "userID" INTEGER NOT NULL,
    "productID" INTEGER NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("favoriteID")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "public"."User"("phoneNumber");

-- CreateIndex
CREATE INDEX "Address_userID_idx" ON "public"."Address"("userID");

-- CreateIndex
CREATE UNIQUE INDEX "Role_roleName_key" ON "public"."Role"("roleName");

-- CreateIndex
CREATE UNIQUE INDEX "Product_stripeProductId_key" ON "public"."Product"("stripeProductId");

-- CreateIndex
CREATE INDEX "Product_categoryID_idx" ON "public"."Product"("categoryID");

-- CreateIndex
CREATE INDEX "Product_genderID_idx" ON "public"."Product"("genderID");

-- CreateIndex
CREATE INDEX "Product_isActive_idx" ON "public"."Product"("isActive");

-- CreateIndex
CREATE INDEX "ProductImage_productID_idx" ON "public"."ProductImage"("productID");

-- CreateIndex
CREATE UNIQUE INDEX "ProductImage_productID_displayOrder_key" ON "public"."ProductImage"("productID", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "public"."ProductVariant"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_stripePriceId_key" ON "public"."ProductVariant"("stripePriceId");

-- CreateIndex
CREATE INDEX "ProductVariant_productID_idx" ON "public"."ProductVariant"("productID");

-- CreateIndex
CREATE INDEX "ProductVariant_sizeID_idx" ON "public"."ProductVariant"("sizeID");

-- CreateIndex
CREATE INDEX "ProductVariant_colorID_idx" ON "public"."ProductVariant"("colorID");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_productID_sizeID_colorID_key" ON "public"."ProductVariant"("productID", "sizeID", "colorID");

-- CreateIndex
CREATE INDEX "Favorite_userID_idx" ON "public"."Favorite"("userID");

-- CreateIndex
CREATE INDEX "Favorite_productID_idx" ON "public"."Favorite"("productID");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userID_productID_key" ON "public"."Favorite"("userID", "productID");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_roleID_fkey" FOREIGN KEY ("roleID") REFERENCES "public"."Role"("roleID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Address" ADD CONSTRAINT "Address_userID_fkey" FOREIGN KEY ("userID") REFERENCES "public"."User"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_categoryID_fkey" FOREIGN KEY ("categoryID") REFERENCES "public"."Category"("categoryID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_genderID_fkey" FOREIGN KEY ("genderID") REFERENCES "public"."Gender"("genderID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductImage" ADD CONSTRAINT "ProductImage_productID_fkey" FOREIGN KEY ("productID") REFERENCES "public"."Product"("productID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductVariant" ADD CONSTRAINT "ProductVariant_productID_fkey" FOREIGN KEY ("productID") REFERENCES "public"."Product"("productID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductVariant" ADD CONSTRAINT "ProductVariant_sizeID_fkey" FOREIGN KEY ("sizeID") REFERENCES "public"."Size"("sizeID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductVariant" ADD CONSTRAINT "ProductVariant_colorID_fkey" FOREIGN KEY ("colorID") REFERENCES "public"."Color"("colorID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Favorite" ADD CONSTRAINT "Favorite_userID_fkey" FOREIGN KEY ("userID") REFERENCES "public"."User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Favorite" ADD CONSTRAINT "Favorite_productID_fkey" FOREIGN KEY ("productID") REFERENCES "public"."Product"("productID") ON DELETE CASCADE ON UPDATE CASCADE;
