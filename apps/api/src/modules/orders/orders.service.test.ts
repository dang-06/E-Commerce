import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { BadRequestException, ConflictException, UnauthorizedException, ValidationPipe } from "@nestjs/common";
import { PromotionTokenService } from "../promotions/promotion-token.service.js";
import { PromotionsService } from "../promotions/promotions.service.js";
import { OrderQuoteStore } from "./order-quote-store.service.js";
import { CreateOrderDto } from "./dto/order.dto.js";
import { OrdersService } from "./orders.service.js";

const ruleUpdatedAt = new Date("2026-07-14T00:00:00.000Z");

interface SeedData {
  customers: Record<string, unknown>[];
  failIntegrationLog: boolean;
  jobs: Record<string, unknown>[];
  logs: Record<string, unknown>[];
  orderItems: Record<string, unknown>[];
  orders: Record<string, unknown>[];
  products: Record<string, unknown>[];
  rules: Record<string, unknown>[];
}

class FakePrisma {
  private ids = { job: 1n, log: 1n, order: 1n, orderItem: 1n };

  constructor(private readonly seed: SeedData) {}

  eligibleCustomer = {
    findUnique: ({ where }: { where: { phoneHash: string } }) =>
      Promise.resolve(this.seed.customers.find((customer) => customer.phoneHash === where.phoneHash) ?? null),
  };

  promotionRule = {
    findFirst: ({ where }: { where: { code: string; isActive: boolean } }) =>
      Promise.resolve(
        this.seed.rules.find((rule) => rule.code === where.code && rule.isActive === where.isActive) ?? null,
      ),
  };

  product = {
    findMany: ({ where }: { where: { id: { in: bigint[] } } }) =>
      Promise.resolve(this.seed.products.filter((product) => where.id.in.some((id) => id === product.id))),
  };

  order = {
    findUnique: ({ where }: { where: { idempotencyKey?: string; orderCode?: string } }) =>
      Promise.resolve(
        this.withItems(this.seed.orders.find(
          (order) =>
            (where.idempotencyKey !== undefined && order.idempotencyKey === where.idempotencyKey) ||
            (where.orderCode !== undefined && order.orderCode === where.orderCode),
        ) ?? null),
      ),
    findUniqueOrThrow: ({ where }: { where: { id: bigint } }) => {
      const order = this.seed.orders.find((candidate) => candidate.id === where.id);
      if (!order) {
        throw new Error("Order not found");
      }
      return Promise.resolve(this.withItems(order));
    },
    create: ({ data }: { data: Record<string, unknown> }) => {
      const order = {
        ...data,
        id: this.ids.order,
        createdAt: new Date("2026-07-15T00:00:00.000Z"),
        updatedAt: new Date("2026-07-15T00:00:00.000Z"),
        orderStatus: "pending",
        paymentStatus: "pending",
        pancakeOrderId: null,
        shippingOrderId: null,
      };
      this.ids.order += 1n;
      this.seed.orders.push(order);
      return Promise.resolve(order);
    },
  };

  orderItem = {
    createMany: ({ data }: { data: Record<string, unknown>[] }) => {
      for (const item of data) {
        this.seed.orderItems.push({
          ...item,
          id: this.ids.orderItem++,
          createdAt: new Date("2026-07-15T00:00:00.000Z"),
        });
      }
      return Promise.resolve({ count: data.length });
    },
  };

  integrationJob = {
    create: ({ data }: { data: Record<string, unknown> }) => {
      const job = {
        ...data,
        id: this.ids.job++,
        attemptCount: 0,
        createdAt: new Date("2026-07-15T00:00:00.000Z"),
        updatedAt: new Date("2026-07-15T00:00:00.000Z"),
      };
      this.seed.jobs.push(job);
      return Promise.resolve(job);
    },
  };

  integrationLog = {
    create: ({ data }: { data: Record<string, unknown> }) => {
      if (this.seed.failIntegrationLog) {
        return Promise.reject(new Error("integration log failure"));
      }
      const log = {
        ...data,
        id: this.ids.log++,
        attemptCount: 0,
        createdAt: new Date("2026-07-15T00:00:00.000Z"),
        updatedAt: new Date("2026-07-15T00:00:00.000Z"),
      };
      this.seed.logs.push(log);
      return Promise.resolve(log);
    },
  };

  async $transaction<T>(callback: (tx: FakePrisma) => Promise<T>): Promise<T> {
    const snapshot = {
      jobs: [...this.seed.jobs],
      logs: [...this.seed.logs],
      orderItems: [...this.seed.orderItems],
      orders: [...this.seed.orders],
    };
    try {
      return await callback(this);
    } catch (error) {
      this.seed.jobs.splice(0, this.seed.jobs.length, ...snapshot.jobs);
      this.seed.logs.splice(0, this.seed.logs.length, ...snapshot.logs);
      this.seed.orderItems.splice(0, this.seed.orderItems.length, ...snapshot.orderItems);
      this.seed.orders.splice(0, this.seed.orders.length, ...snapshot.orders);
      throw error;
    }
  }

  private withItems(order: Record<string, unknown> | null): Record<string, unknown> | null {
    if (!order) {
      return null;
    }
    return {
      ...order,
      items: this.seed.orderItems.filter((item) => item.orderId === order.id),
    };
  }
}

function product(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: 1n,
    sku: "SKU-1",
    name: "Serum",
    listedPrice: 100000n,
    stockQuantity: null,
    isPromotionEligible: true,
    discountAmount: 25000n,
    isActive: true,
    deletedAt: null,
    ...overrides,
  };
}

function buildHarness(overrides: { products?: Record<string, unknown>[]; failIntegrationLog?: boolean } = {}) {
  const seed: SeedData = {
    customers: [],
    failIntegrationLog: overrides.failIntegrationLog ?? false,
    jobs: [],
    logs: [],
    orderItems: [],
    orders: [],
    products: overrides.products ?? [product()],
    rules: [
      {
        id: 1n,
        code: "PHONE_25000",
        name: "Phone 25k",
        discountAmount: 25000n,
        startsAt: null,
        endsAt: null,
        isActive: true,
        config: null,
        createdAt: ruleUpdatedAt,
        updatedAt: ruleUpdatedAt,
      },
    ],
  };
  const prisma = new FakePrisma(seed);
  const tokenService = new PromotionTokenService();
  const promotions = new PromotionsService(
    prisma as never,
    tokenService,
    {} as never,
    { isPhoneEligible: () => Promise.resolve(null) } as never,
  );
  const phoneHash = promotions.hashPhone("0901234567");
  seed.customers.push({
    id: 1n,
    phoneNormalized: "0901234567",
    phoneHash,
    source: "manual",
    sourceCustomerId: null,
    eligibilityReason: "manual",
    successfulOrderAt: null,
    usageCount: 0,
    usageLimit: null,
    isActive: true,
    importedAt: ruleUpdatedAt,
    createdAt: ruleUpdatedAt,
    updatedAt: ruleUpdatedAt,
  });
  const token = tokenService.sign(phoneHash, "PHONE_25000", Math.floor(ruleUpdatedAt.getTime() / 1000)).token;
  const service = new OrdersService(prisma as never, promotions, tokenService, new OrderQuoteStore());
  return { seed, service, token };
}

function baseCreateInput(token: string): CreateOrderDto {
  return {
    idempotencyKey: `idem-${randomUUID()}`,
    promotionPhone: "0901234567",
    promotionToken: token,
    items: [{ productId: "1", quantity: 1 }],
    recipient: {
      name: "Nguyen Van A",
      phone: "0912345678",
      province: "Ho Chi Minh",
      district: "Quan 1",
      ward: "Ben Nghe",
      address: "1 Le Loi",
    },
    paymentMethod: "cod",
    note: "Giao gio hanh chinh",
  };
}

void test("quotes and creates a normal-price order when product is not promotion eligible", async () => {
  const { service, token } = buildHarness({ products: [product({ isPromotionEligible: false })] });
  const input = baseCreateInput(token);
  const quote = await service.quote(input);
  assert.equal(quote.subtotal, "100000");
  assert.equal(quote.discountAmount, "0");
  assert.equal(quote.totalAmount, "100000");

  const order = await service.create(input);
  assert.equal(order.status, "created");
  assert.equal(order.items[0]?.finalUnitPrice, "100000");
});

void test("calculates promotion discount for multiple products and repeated quantity", async () => {
  const { service, token } = buildHarness({
    products: [
      product(),
      product({ id: 2n, sku: "SKU-2", name: "Cream", listedPrice: 200000n, discountAmount: 25000n }),
    ],
  });
  const input = baseCreateInput(token);
  input.items = [
    { productId: "1", quantity: 2 },
    { productId: "2", quantity: 1 },
  ];
  const quote = await service.quote(input);
  assert.equal(quote.totalQuantity, 3);
  assert.equal(quote.subtotal, "400000");
  assert.equal(quote.discountAmount, "75000");
  assert.equal(quote.totalAmount, "325000");
});

void test("rejects fake promotion tokens and hidden products", async () => {
  const { service, token } = buildHarness({ products: [product({ isActive: false })] });
  const invalidTokenInput = baseCreateInput(token);
  invalidTokenInput.promotionToken = "fake.token";
  await assert.rejects(() => service.quote(invalidTokenInput), UnauthorizedException);
  await assert.rejects(() => service.quote(baseCreateInput(token)), BadRequestException);
});

void test("returns price_changed when product price changes after quote", async () => {
  const { seed, service, token } = buildHarness();
  const input = baseCreateInput(token);
  await service.quote(input);
  seed.products[0] = Object.assign({}, seed.products[0], { listedPrice: 120000n });

  await assert.rejects(
    () => service.create(input),
    (error) => {
      assert.ok(error instanceof ConflictException);
      assert.equal((error.getResponse() as { status: string }).status, "price_changed");
      return true;
    },
  );
});

void test("rejects invalid quantities and does not trust frontend totals", async () => {
  const { service, token } = buildHarness();
  const invalidQuantityInput = baseCreateInput(token);
  invalidQuantityInput.items = [{ productId: "1", quantity: 0 }];
  await assert.rejects(
    () => service.quote(invalidQuantityInput),
    BadRequestException,
  );

  const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
  const tamperedInput = Object.assign({}, baseCreateInput(token), { totalAmount: 1 });
  await assert.rejects(() =>
    pipe.transform(
      tamperedInput,
      { type: "body", metatype: CreateOrderDto },
    ),
  );
});

void test("returns duplicate for the same idempotency key", async () => {
  const { service, token } = buildHarness();
  const input = baseCreateInput(token);
  await service.quote(input);
  const first = await service.create(input);
  const second = await service.create(input);
  assert.equal(first.orderCode, second.orderCode);
  assert.equal(second.status, "duplicate");
});

void test("rolls back order when transaction fails after order insert", async () => {
  const { seed, service, token } = buildHarness({ failIntegrationLog: true });
  const input = baseCreateInput(token);
  await service.quote(input);
  await assert.rejects(() => service.create(input), /integration log failure/);
  assert.equal(seed.orders.length, 0);
  assert.equal(seed.jobs.length, 0);
});
