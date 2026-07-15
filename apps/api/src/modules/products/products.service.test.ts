import assert from "node:assert/strict";
import test from "node:test";
import { NotFoundException } from "@nestjs/common";
import { ProductsService } from "./products.service.js";

interface ProductRecord {
  id: bigint;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  listedPrice: bigint;
  stockQuantity: number | null;
  isPromotionEligible: boolean;
  discountAmount: bigint;
  isActive: boolean;
  sortOrder: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  images: ProductImageRecord[];
}

interface ProductImageRecord {
  id: bigint;
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  productId: bigint;
}

function createProduct(overrides: Partial<ProductRecord>): ProductRecord {
  const now = new Date("2026-07-15T00:00:00.000Z");
  return {
    id: 1n,
    sku: "SKU-1",
    name: "Product 1",
    slug: "product-1",
    description: null,
    imageUrl: null,
    listedPrice: 99000n,
    stockQuantity: null,
    isPromotionEligible: true,
    discountAmount: 25000n,
    isActive: true,
    sortOrder: 1,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
    images: [],
    ...overrides,
  };
}

class FakePrismaForProducts {
  readonly records: ProductRecord[];

  constructor(records: ProductRecord[]) {
    this.records = records;
  }

  readonly product = {
    findMany: (args: { where?: { isActive?: boolean; deletedAt?: null } }) => {
      let products = [...this.records];
      if (args.where?.isActive !== undefined) {
        products = products.filter((product) => product.isActive === args.where?.isActive);
      }
      if (args.where?.deletedAt === null) {
        products = products.filter((product) => product.deletedAt === null);
      }
      return Promise.resolve(
        products.sort((left, right) => left.sortOrder - right.sortOrder || Number(left.id - right.id)),
      );
    },
    findFirst: (args: { where: { slug: string; isActive: boolean; deletedAt: null } }) =>
      Promise.resolve(
        this.records.find(
        (product) =>
          product.slug === args.where.slug &&
          product.isActive === args.where.isActive &&
          product.deletedAt === null,
        ) ?? null,
      ),
    findUnique: (args: { where: { id: bigint } }) =>
      Promise.resolve(this.records.find((product) => product.id === args.where.id) ?? null),
    create: (args: { data: { sku: string; listedPrice: bigint; images?: { create: unknown[] } } }) => {
      const product = createProduct({
        id: BigInt(this.records.length + 1),
        sku: args.data.sku,
        listedPrice: args.data.listedPrice,
        images: args.data.images ? [] : [],
      });
      this.records.push(product);
      return Promise.resolve(product);
    },
    update: (args: { where: { id: bigint }; data: Partial<ProductRecord> }) => {
      const product = this.records.find((candidate) => candidate.id === args.where.id);
      if (!product) {
        throw new Error("missing product");
      }
      Object.assign(product, args.data);
      return Promise.resolve(product);
    },
  };
}

function createService(records: ProductRecord[]): ProductsService {
  return new ProductsService(new FakePrismaForProducts(records) as never);
}

void test("public product list returns only active non-deleted products sorted by sortOrder", async () => {
  const service = createService([
    createProduct({ id: 1n, slug: "hidden", isActive: false, sortOrder: 1 }),
    createProduct({ id: 2n, slug: "deleted", deletedAt: new Date(), sortOrder: 2 }),
    createProduct({ id: 3n, slug: "second", sortOrder: 20 }),
    createProduct({ id: 4n, slug: "first", sortOrder: 10 }),
  ]);

  const result = await service.listPublic();

  assert.deepEqual(
    result.map((product) => product.slug),
    ["first", "second"],
  );
  assert.equal(result[0]?.listedPrice, "99000");
});

void test("public product detail rejects inactive or deleted slugs", async () => {
  const service = createService([createProduct({ slug: "hidden", isActive: false })]);

  await assert.rejects(() => service.getPublicBySlug("hidden"), NotFoundException);
});

void test("admin create normalizes sku and stores VND as bigint", async () => {
  const prisma = new FakePrismaForProducts([]);
  const service = new ProductsService(prisma as never);

  const result = await service.create({
    sku: "sku-1",
    name: "Product",
    slug: "product",
    listedPrice: 120000,
  });

  assert.equal(result.sku, "SKU-1");
  assert.equal(prisma.records[0]?.listedPrice, 120000n);
});

void test("admin soft delete hides a product without deleting the record", async () => {
  const product = createProduct({ id: 1n });
  const service = createService([product]);

  const result = await service.softDelete("1");

  assert.equal(result.isActive, false);
  assert.ok(result.deletedAt);
  assert.equal(product.id, 1n);
});
