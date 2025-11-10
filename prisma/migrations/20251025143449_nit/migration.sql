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

-- CreateTable
CREATE TABLE "public"."ShoppingCart" (
    "cartID" SERIAL NOT NULL,
    "userID" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingCart_pkey" PRIMARY KEY ("cartID")
);

-- CreateTable
CREATE TABLE "public"."ShoppingCartItem" (
    "cartItemID" SERIAL NOT NULL,
    "cartID" INTEGER NOT NULL,
    "productVariantID" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShoppingCartItem_pkey" PRIMARY KEY ("cartItemID")
);

-- CreateTable
CREATE TABLE "public"."Orders" (
    "orderID" SERIAL NOT NULL,
    "userID" INTEGER NOT NULL,
    "shippingAddressID" INTEGER NOT NULL,
    "billingAddressID" INTEGER NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estimatedDeliveryDate" TIMESTAMP(3),
    "actualDeliveryDate" TIMESTAMP(3),
    "orderStatus" VARCHAR(50) NOT NULL,
    "deliveryStatusID" INTEGER,
    "subtotalAmount" DECIMAL(10,2) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL,
    "shippingAmount" DECIMAL(10,2) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'mxn',
    "stripePaymentIntentID" VARCHAR(255),
    "stripeSessionID" VARCHAR(255),
    "paymentMethod" VARCHAR(50) NOT NULL,
    "paymentStatusID" INTEGER,
    "paidAt" TIMESTAMP(3),
    "customerNote" TEXT,
    "adminNote" TEXT,
    "trackingNumber" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Orders_pkey" PRIMARY KEY ("orderID")
);

-- CreateTable
CREATE TABLE "public"."OrderDetails" (
    "orderDetailID" SERIAL NOT NULL,
    "orderID" INTEGER NOT NULL,
    "productVariantID" INTEGER NOT NULL,
    "productName" VARCHAR(255) NOT NULL,
    "variantSKU" VARCHAR(100) NOT NULL,
    "priceAtPurchase" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discountType" VARCHAR(50),
    "discountCode" VARCHAR(50),
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderDetails_pkey" PRIMARY KEY ("orderDetailID")
);

-- CreateTable
CREATE TABLE "public"."DeliveryStatus" (
    "deliveryStatusID" SERIAL NOT NULL,
    "statusName" VARCHAR(50) NOT NULL,
    "description" TEXT,

    CONSTRAINT "DeliveryStatus_pkey" PRIMARY KEY ("deliveryStatusID")
);

-- CreateTable
CREATE TABLE "public"."PaymentStatus" (
    "paymentStatusID" SERIAL NOT NULL,
    "statusName" VARCHAR(50) NOT NULL,
    "description" TEXT,

    CONSTRAINT "PaymentStatus_pkey" PRIMARY KEY ("paymentStatusID")
);

-- CreateTable
CREATE TABLE "public"."StripeWebhookLog" (
    "webhookID" SERIAL NOT NULL,
    "eventID" VARCHAR(255) NOT NULL,
    "eventType" VARCHAR(255) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StripeWebhookLog_pkey" PRIMARY KEY ("webhookID")
);

-- CreateTable
CREATE TABLE "public"."DiscountCoupons" (
    "couponID" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "discountType" VARCHAR(50) NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL,
    "minOrderAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "maxUsageLimit" INTEGER,
    "maxUsagePerUser" INTEGER DEFAULT 1,
    "currentUsageCount" INTEGER NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscountCoupons_pkey" PRIMARY KEY ("couponID")
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
CREATE UNIQUE INDEX "Category_categoryName_key" ON "public"."Category"("categoryName");

-- CreateIndex
CREATE UNIQUE INDEX "Gender_genderName_key" ON "public"."Gender"("genderName");

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
CREATE UNIQUE INDEX "Size_sizeLabel_key" ON "public"."Size"("sizeLabel");

-- CreateIndex
CREATE UNIQUE INDEX "Color_colorName_key" ON "public"."Color"("colorName");

-- CreateIndex
CREATE INDEX "Favorite_userID_idx" ON "public"."Favorite"("userID");

-- CreateIndex
CREATE INDEX "Favorite_productID_idx" ON "public"."Favorite"("productID");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userID_productID_key" ON "public"."Favorite"("userID", "productID");

-- CreateIndex
CREATE UNIQUE INDEX "ShoppingCart_userID_key" ON "public"."ShoppingCart"("userID");

-- CreateIndex
CREATE INDEX "ShoppingCart_userID_idx" ON "public"."ShoppingCart"("userID");

-- CreateIndex
CREATE INDEX "ShoppingCartItem_cartID_idx" ON "public"."ShoppingCartItem"("cartID");

-- CreateIndex
CREATE INDEX "ShoppingCartItem_productVariantID_idx" ON "public"."ShoppingCartItem"("productVariantID");

-- CreateIndex
CREATE UNIQUE INDEX "ShoppingCartItem_cartID_productVariantID_key" ON "public"."ShoppingCartItem"("cartID", "productVariantID");

-- CreateIndex
CREATE INDEX "Orders_userID_idx" ON "public"."Orders"("userID");

-- CreateIndex
CREATE INDEX "Orders_shippingAddressID_idx" ON "public"."Orders"("shippingAddressID");

-- CreateIndex
CREATE INDEX "Orders_billingAddressID_idx" ON "public"."Orders"("billingAddressID");

-- CreateIndex
CREATE INDEX "Orders_deliveryStatusID_idx" ON "public"."Orders"("deliveryStatusID");

-- CreateIndex
CREATE INDEX "Orders_paymentStatusID_idx" ON "public"."Orders"("paymentStatusID");

-- CreateIndex
CREATE INDEX "Orders_orderDate_idx" ON "public"."Orders"("orderDate");

-- CreateIndex
CREATE INDEX "OrderDetails_orderID_idx" ON "public"."OrderDetails"("orderID");

-- CreateIndex
CREATE INDEX "OrderDetails_productVariantID_idx" ON "public"."OrderDetails"("productVariantID");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryStatus_statusName_key" ON "public"."DeliveryStatus"("statusName");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentStatus_statusName_key" ON "public"."PaymentStatus"("statusName");

-- CreateIndex
CREATE UNIQUE INDEX "StripeWebhookLog_eventID_key" ON "public"."StripeWebhookLog"("eventID");

-- CreateIndex
CREATE INDEX "StripeWebhookLog_eventID_idx" ON "public"."StripeWebhookLog"("eventID");

-- CreateIndex
CREATE INDEX "StripeWebhookLog_eventType_idx" ON "public"."StripeWebhookLog"("eventType");

-- CreateIndex
CREATE INDEX "StripeWebhookLog_status_idx" ON "public"."StripeWebhookLog"("status");

-- CreateIndex
CREATE INDEX "StripeWebhookLog_processed_idx" ON "public"."StripeWebhookLog"("processed");

-- CreateIndex
CREATE INDEX "StripeWebhookLog_receivedAt_idx" ON "public"."StripeWebhookLog"("receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DiscountCoupons_code_key" ON "public"."DiscountCoupons"("code");

-- CreateIndex
CREATE INDEX "DiscountCoupons_code_idx" ON "public"."DiscountCoupons"("code");

-- CreateIndex
CREATE INDEX "DiscountCoupons_isActive_idx" ON "public"."DiscountCoupons"("isActive");

-- CreateIndex
CREATE INDEX "DiscountCoupons_validFrom_validUntil_idx" ON "public"."DiscountCoupons"("validFrom", "validUntil");

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

-- AddForeignKey
ALTER TABLE "public"."ShoppingCart" ADD CONSTRAINT "ShoppingCart_userID_fkey" FOREIGN KEY ("userID") REFERENCES "public"."User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShoppingCartItem" ADD CONSTRAINT "ShoppingCartItem_cartID_fkey" FOREIGN KEY ("cartID") REFERENCES "public"."ShoppingCart"("cartID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShoppingCartItem" ADD CONSTRAINT "ShoppingCartItem_productVariantID_fkey" FOREIGN KEY ("productVariantID") REFERENCES "public"."ProductVariant"("productVariantID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Orders" ADD CONSTRAINT "Orders_userID_fkey" FOREIGN KEY ("userID") REFERENCES "public"."User"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Orders" ADD CONSTRAINT "Orders_shippingAddressID_fkey" FOREIGN KEY ("shippingAddressID") REFERENCES "public"."Address"("addressID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Orders" ADD CONSTRAINT "Orders_billingAddressID_fkey" FOREIGN KEY ("billingAddressID") REFERENCES "public"."Address"("addressID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Orders" ADD CONSTRAINT "Orders_deliveryStatusID_fkey" FOREIGN KEY ("deliveryStatusID") REFERENCES "public"."DeliveryStatus"("deliveryStatusID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Orders" ADD CONSTRAINT "Orders_paymentStatusID_fkey" FOREIGN KEY ("paymentStatusID") REFERENCES "public"."PaymentStatus"("paymentStatusID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderDetails" ADD CONSTRAINT "OrderDetails_orderID_fkey" FOREIGN KEY ("orderID") REFERENCES "public"."Orders"("orderID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderDetails" ADD CONSTRAINT "OrderDetails_productVariantID_fkey" FOREIGN KEY ("productVariantID") REFERENCES "public"."ProductVariant"("productVariantID") ON DELETE RESTRICT ON UPDATE CASCADE;
