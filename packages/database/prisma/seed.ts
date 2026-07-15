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

  await prisma.admin.upsert({
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

  const products = [
    {
      sku: "DEV-SKU-001",
      slug: "san-pham-mau-1",
      name: "Sản phẩm mẫu 1",
      listedPrice: 99000n,
      sortOrder: 1,
    },
    {
      sku: "DEV-SKU-002",
      slug: "san-pham-mau-2",
      name: "Sản phẩm mẫu 2",
      listedPrice: 129000n,
      sortOrder: 2,
    },
    {
      sku: "DEV-SKU-003",
      slug: "san-pham-mau-3",
      name: "Sản phẩm mẫu 3",
      listedPrice: 149000n,
      sortOrder: 3,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        slug: product.slug,
        listedPrice: product.listedPrice,
        discountAmount: 25000n,
        isPromotionEligible: true,
        isActive: true,
        sortOrder: product.sortOrder,
      },
      create: {
        ...product,
        description: "Dữ liệu mẫu cho môi trường development.",
        discountAmount: 25000n,
        isPromotionEligible: true,
        isActive: true,
      },
    });
  }

  await prisma.eligibleCustomer.upsert({
    where: { phoneHash: hashSensitiveValue("0901234567") },
    update: {
      phoneNormalized: "0901234567",
      source: "manual",
      eligibilityReason: "manual",
      isActive: true,
    },
    create: {
      phoneNormalized: "0901234567",
      phoneHash: hashSensitiveValue("0901234567"),
      source: "manual",
      eligibilityReason: "manual",
      isActive: true,
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
