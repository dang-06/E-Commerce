import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHmac } from "node:crypto";

const prisma = new PrismaClient();

const defaultPassword = process.env.DEV_ADMIN_PASSWORD ?? "Admin@123456";
const hashSecret =
  process.env.API_AUTH_SECRET ??
  "development-only-change-me-auth-secret-at-least-32-characters";

function hashSensitiveValue(value: string): string {
  return createHmac("sha256", hashSecret).update(value).digest("hex");
}

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(defaultPassword, 12);

  const admin = await prisma.admin.upsert({
    where: { email: "admin@example.local" },
    update: {
      fullName: "Development Admin",
      passwordHash,
      role: "admin",
      status: "active",
    },
    create: {
      email: "admin@example.local",
      fullName: "Development Admin",
      passwordHash,
      role: "admin",
      status: "active",
    },
  });

  await prisma.admin.upsert({
    where: { email: "operator@example.local" },
    update: {
      fullName: "Development Operator",
      passwordHash,
      role: "operator",
      status: "active",
    },
    create: {
      email: "operator@example.local",
      fullName: "Development Operator",
      passwordHash,
      role: "operator",
      status: "active",
    },
  });

  await prisma.promotionRule.upsert({
    where: { code: "PHONE_25000" },
    update: {
      name: "Phone-based 25.000 VND discount",
      discountAmount: 25000n,
      isActive: true,
    },
    create: {
      code: "PHONE_25000",
      name: "Phone-based 25.000 VND discount",
      discountAmount: 25000n,
      isActive: true,
      config: {
        note: "Development seed only. Business limits still require confirmation.",
      },
    },
  });

  await prisma.googleSheetConfig.upsert({
    where: { purpose: "eligible_customers" },
    update: {
      sheetUrl: "https://docs.google.com/spreadsheets/d/11dJMJ2rQLjcBlw4fjJJVVEvU07t00ujPF2oVyAz1fQk/edit?usp=sharing",
      spreadsheetId: "11dJMJ2rQLjcBlw4fjJJVVEvU07t00ujPF2oVyAz1fQk",
      worksheetName: null,
      phoneColumn: "A",
      isActive: true,
    },
    create: {
      purpose: "eligible_customers",
      sheetUrl: "https://docs.google.com/spreadsheets/d/11dJMJ2rQLjcBlw4fjJJVVEvU07t00ujPF2oVyAz1fQk/edit?usp=sharing",
      spreadsheetId: "11dJMJ2rQLjcBlw4fjJJVVEvU07t00ujPF2oVyAz1fQk",
      worksheetName: null,
      phoneColumn: "A",
      isActive: true,
    },
  });

  await prisma.googleSheetConfig.upsert({
    where: { purpose: "orders" },
    update: {
      sheetUrl: "https://docs.google.com/spreadsheets/d/1H0Em48MvTPgucBTP4DEu8k4RIua_uID-nisetyYLaIs/edit?usp=sharing",
      spreadsheetId: "1H0Em48MvTPgucBTP4DEu8k4RIua_uID-nisetyYLaIs",
      worksheetName: null,
      orderMapping: {
        columns: [
          "syncedAt",
          "orderCode",
          "recipientName",
          "recipientPhone",
          "address",
          "totalQuantity",
          "subtotal",
          "discountAmount",
          "shippingFee",
          "totalAmount",
          "paymentMethod",
          "note",
          "items",
        ],
      },
      isActive: true,
    },
    create: {
      purpose: "orders",
      sheetUrl: "https://docs.google.com/spreadsheets/d/1H0Em48MvTPgucBTP4DEu8k4RIua_uID-nisetyYLaIs/edit?usp=sharing",
      spreadsheetId: "1H0Em48MvTPgucBTP4DEu8k4RIua_uID-nisetyYLaIs",
      worksheetName: null,
      orderMapping: {
        columns: [
          "syncedAt",
          "orderCode",
          "recipientName",
          "recipientPhone",
          "address",
          "totalQuantity",
          "subtotal",
          "discountAmount",
          "shippingFee",
          "totalAmount",
          "paymentMethod",
          "note",
          "items",
        ],
      },
      isActive: true,
    },
  });

  await prisma.siteSettings.upsert({
    where: { key: "default" },
    update: {},
    create: {
      bannerButtonText: "",
      bannerEyebrow: "",
      bannerSubtitle: "",
      bannerTitle: "",
      catalogTitle: "",
      key: "default",
      logoText: "",
    },
  });

  const products = [
    {
      sku: "DEV-SKU-001",
      slug: "dior-jadore-intense-parfum",
      name: "Dior J'adore Intense Parfum",
      listedPrice: 5980000n,
      imageUrl: "/products/perfume-1.png",
      stockQuantity: 80,
      sortOrder: 1,
    },
    {
      sku: "DEV-SKU-002",
      slug: "dior-jadore-eau-de-parfum-gift-set",
      name: "Dior J'adore Eau de Parfum Gift Set",
      listedPrice: 6650000n,
      imageUrl: "/products/perfume-2.png",
      stockQuantity: 55,
      sortOrder: 2,
    },
    {
      sku: "DEV-SKU-003",
      slug: "miss-dior-essence",
      name: "Miss Dior Essence",
      listedPrice: 5800000n,
      imageUrl: "/products/perfume-3.png",
      stockQuantity: 40,
      sortOrder: 3,
    },
    {
      sku: "DEV-SKU-004",
      slug: "dior-pure-poison",
      name: "Dior Pure Poison",
      listedPrice: 4200000n,
      imageUrl: "/products/perfume-4.png",
      stockQuantity: 25,
      sortOrder: 4,
    },
    {
      sku: "DEV-SKU-005",
      slug: "dior-poison-girl",
      name: "Dior Poison Girl",
      listedPrice: 3890000n,
      imageUrl: "/products/perfume-5.png",
      stockQuantity: 16,
      sortOrder: 5,
    },
  ];

  const seededProducts = [];
  for (const product of products) {
    const seededProduct = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        slug: product.slug,
        listedPrice: product.listedPrice,
        imageUrl: product.imageUrl,
        stockQuantity: product.stockQuantity,
        discountAmount: 25000n,
        isPromotionEligible: true,
        isActive: true,
        sortOrder: product.sortOrder,
      },
      create: {
        ...product,
        description: "Dữ liệu mẫu nước hoa cho môi trường development.",
        discountAmount: 25000n,
        isPromotionEligible: true,
        isActive: true,
      },
    });
    seededProducts.push(seededProduct);
  }

  const customerPhones = [
    { phone: "0901234567", source: "manual" as const, reason: "manual" as const },
    { phone: "0902345678", source: "import" as const, reason: "imported" as const },
    { phone: "0903456789", source: "sheet" as const, reason: "purchased" as const },
    { phone: "0904567890", source: "pancake" as const, reason: "delivered" as const },
  ];
  const seededCustomers = [];
  for (const customer of customerPhones) {
    const seededCustomer = await prisma.eligibleCustomer.upsert({
      where: { phoneHash: hashSensitiveValue(customer.phone) },
      update: {
        phoneNormalized: customer.phone,
        source: customer.source,
        eligibilityReason: customer.reason,
        isActive: true,
      },
      create: {
        phoneNormalized: customer.phone,
        phoneHash: hashSensitiveValue(customer.phone),
        source: customer.source,
        eligibilityReason: customer.reason,
        isActive: true,
      },
    });
    seededCustomers.push(seededCustomer);
  }

  const seedOrderCodes = ["DEVORDER001", "DEVORDER002"];
  const oldSeedOrders = await prisma.order.findMany({
    where: { orderCode: { in: seedOrderCodes } },
    select: { id: true },
  });
  const oldSeedOrderIds = oldSeedOrders.map((order) => order.id);
  if (oldSeedOrderIds.length > 0) {
    await prisma.integrationLog.deleteMany({ where: { orderId: { in: oldSeedOrderIds } } });
    await prisma.integrationJob.deleteMany({ where: { orderId: { in: oldSeedOrderIds } } });
    await prisma.orderItem.deleteMany({ where: { orderId: { in: oldSeedOrderIds } } });
    await prisma.order.deleteMany({ where: { id: { in: oldSeedOrderIds } } });
  }

  const firstProduct = seededProducts[0];
  const secondProduct = seededProducts[1];
  const thirdProduct = seededProducts[2];
  const firstCustomer = seededCustomers[0];
  const secondCustomer = seededCustomers[1];
  if (!firstProduct || !secondProduct || !thirdProduct || !firstCustomer || !secondCustomer) {
    throw new Error("Development seed requires at least three products and two eligible customers");
  }

  const firstOrderSubtotal = firstProduct.listedPrice * 2n + secondProduct.listedPrice;
  const firstOrderDiscount = firstProduct.discountAmount * 2n + secondProduct.discountAmount;
  const firstOrderShipping = 30000n;
  const firstOrder = await prisma.order.create({
    data: {
      orderCode: "DEVORDER001",
      idempotencyKey: "seed-dev-order-001",
      eligibleCustomerId: firstCustomer.id,
      promotionPhone: firstCustomer.phoneNormalized,
      promotionPhoneHash: firstCustomer.phoneHash,
      isPromotionApplied: true,
      recipientName: "Nguyễn Văn A",
      recipientPhone: "0901234567",
      province: "TP. Hồ Chí Minh",
      district: "Quận 1",
      ward: "Phường Bến Nghé",
      address: "12 Nguyễn Huệ",
      totalQuantity: 3,
      subtotal: firstOrderSubtotal,
      discountAmount: firstOrderDiscount,
      shippingFee: firstOrderShipping,
      totalAmount: firstOrderSubtotal - firstOrderDiscount + firstOrderShipping,
      paymentMethod: "cod",
      paymentStatus: "pending",
      orderStatus: "pending",
      note: "Đơn mẫu development.",
      items: {
        create: [
          {
            productId: firstProduct.id,
            sku: firstProduct.sku,
            productName: firstProduct.name,
            listedPrice: firstProduct.listedPrice,
            discountPerItem: firstProduct.discountAmount,
            finalUnitPrice: firstProduct.listedPrice - firstProduct.discountAmount,
            quantity: 2,
            lineSubtotal: firstProduct.listedPrice * 2n,
            lineDiscount: firstProduct.discountAmount * 2n,
            lineTotal: (firstProduct.listedPrice - firstProduct.discountAmount) * 2n,
          },
          {
            productId: secondProduct.id,
            sku: secondProduct.sku,
            productName: secondProduct.name,
            listedPrice: secondProduct.listedPrice,
            discountPerItem: secondProduct.discountAmount,
            finalUnitPrice: secondProduct.listedPrice - secondProduct.discountAmount,
            quantity: 1,
            lineSubtotal: secondProduct.listedPrice,
            lineDiscount: secondProduct.discountAmount,
            lineTotal: secondProduct.listedPrice - secondProduct.discountAmount,
          },
        ],
      },
    },
  });

  const secondOrderSubtotal = thirdProduct.listedPrice;
  const secondOrderDiscount = thirdProduct.discountAmount;
  const secondOrderShipping = 30000n;
  const secondOrder = await prisma.order.create({
    data: {
      orderCode: "DEVORDER002",
      idempotencyKey: "seed-dev-order-002",
      eligibleCustomerId: secondCustomer.id,
      promotionPhone: secondCustomer.phoneNormalized,
      promotionPhoneHash: secondCustomer.phoneHash,
      isPromotionApplied: true,
      recipientName: "Trần Thị B",
      recipientPhone: "0902345678",
      province: "Hà Nội",
      district: "Ba Đình",
      ward: "Phúc Xá",
      address: "8 Trúc Bạch",
      totalQuantity: 1,
      subtotal: secondOrderSubtotal,
      discountAmount: secondOrderDiscount,
      shippingFee: secondOrderShipping,
      totalAmount: secondOrderSubtotal - secondOrderDiscount + secondOrderShipping,
      paymentMethod: "cod",
      paymentStatus: "pending",
      orderStatus: "confirmed",
      note: "Đơn mẫu có lỗi đồng bộ để kiểm tra retry.",
      items: {
        create: [
          {
            productId: thirdProduct.id,
            sku: thirdProduct.sku,
            productName: thirdProduct.name,
            listedPrice: thirdProduct.listedPrice,
            discountPerItem: thirdProduct.discountAmount,
            finalUnitPrice: thirdProduct.listedPrice - thirdProduct.discountAmount,
            quantity: 1,
            lineSubtotal: thirdProduct.listedPrice,
            lineDiscount: thirdProduct.discountAmount,
            lineTotal: thirdProduct.listedPrice - thirdProduct.discountAmount,
          },
        ],
      },
    },
  });

  for (const integration of ["pancake", "sheet"] as const) {
    const job = await prisma.integrationJob.create({
      data: {
        action: "create",
        integration,
        orderId: firstOrder.id,
        requestPayload: { orderCode: firstOrder.orderCode },
        status: "pending",
      },
    });
    await prisma.integrationLog.create({
      data: {
        action: "create",
        integration,
        integrationJobId: job.id,
        orderId: firstOrder.id,
        requestPayload: { orderCode: firstOrder.orderCode },
        status: "pending",
      },
    });
  }

  const failedJob = await prisma.integrationJob.create({
    data: {
      action: "create",
      attemptCount: 1,
      integration: "pancake",
      lastError: "Development mock integration failed",
      nextRetryAt: new Date(Date.now() + 10 * 60 * 1000),
      orderId: secondOrder.id,
      requestPayload: { orderCode: secondOrder.orderCode },
      status: "failed",
    },
  });
  await prisma.integrationLog.create({
    data: {
      action: "create",
      attemptCount: 1,
      errorMessage: "Development mock integration failed",
      integration: "pancake",
      integrationJobId: failedJob.id,
      nextRetryAt: failedJob.nextRetryAt,
      orderId: secondOrder.id,
      requestPayload: { orderCode: secondOrder.orderCode },
      status: "failed",
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "create",
      adminId: admin.id,
      entityId: firstOrder.orderCode,
      entityType: "seed",
      metadata: { note: "Development seed data refreshed" },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
