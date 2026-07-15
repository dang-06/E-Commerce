import assert from "node:assert/strict";
import test from "node:test";
import { HttpException } from "@nestjs/common";
import { PromotionRateLimiterService } from "./promotion-rate-limiter.service.js";
import { PromotionTokenService } from "./promotion-token.service.js";
import { PromotionsService } from "./promotions.service.js";
import { normalizeVietnamesePhone } from "./utils/phone.js";

interface EligibleRecord {
  id: bigint;
  phoneNormalized: string;
  phoneHash: string;
  source: "manual" | "import" | "sheet" | "pancake" | "best";
  sourceCustomerId: string | null;
  eligibilityReason: "manual" | "imported" | "purchased" | "delivered";
  successfulOrderAt: Date | null;
  usageCount: number;
  usageLimit: number | null;
  isActive: boolean;
  importedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface PromotionRuleRecord {
  id: bigint;
  code: string;
  name: string;
  discountAmount: bigint;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
  config: unknown;
  createdAt: Date;
  updatedAt: Date;
}

function now(): Date {
  return new Date("2026-07-15T00:00:00.000Z");
}

function eligible(overrides: Partial<EligibleRecord>): EligibleRecord {
  return {
    id: 1n,
    phoneNormalized: "0901234567",
    phoneHash: "hash",
    source: "manual",
    sourceCustomerId: null,
    eligibilityReason: "manual",
    successfulOrderAt: null,
    usageCount: 0,
    usageLimit: null,
    isActive: true,
    importedAt: now(),
    createdAt: now(),
    updatedAt: now(),
    ...overrides,
  };
}

function rule(overrides: Partial<PromotionRuleRecord> = {}): PromotionRuleRecord {
  return {
    id: 1n,
    code: "PHONE_25000",
    name: "Phone discount",
    discountAmount: 25000n,
    startsAt: null,
    endsAt: null,
    isActive: true,
    config: null,
    createdAt: now(),
    updatedAt: now(),
    ...overrides,
  };
}

class FakePrismaForPromotions {
  readonly checks: { phoneHash: string; isEligible: boolean; tokenId: string | null }[] = [];
  readonly customers: EligibleRecord[];
  readonly rule: PromotionRuleRecord | null;

  constructor(customers: EligibleRecord[], promotionRule: PromotionRuleRecord | null = rule()) {
    this.customers = customers;
    this.rule = promotionRule;
  }

  readonly eligibleCustomer = {
    findUnique: (args: { where: { phoneHash: string } }) =>
      Promise.resolve(this.customers.find((customer) => customer.phoneHash === args.where.phoneHash) ?? null),
    findMany: () => Promise.resolve(this.customers),
    update: (args: { where: { phoneHash?: string; id?: bigint }; data: Partial<EligibleRecord> }) => {
      const customer = this.customers.find(
        (candidate) =>
          (args.where.phoneHash !== undefined && candidate.phoneHash === args.where.phoneHash) ||
          (args.where.id !== undefined && candidate.id === args.where.id),
      );
      if (!customer) {
        throw new Error("missing customer");
      }
      Object.assign(customer, args.data);
      return Promise.resolve(customer);
    },
    create: (args: { data: Omit<EligibleRecord, "id" | "importedAt" | "createdAt" | "updatedAt" | "successfulOrderAt" | "usageCount" | "usageLimit"> }) => {
      const customer = eligible({
        id: BigInt(this.customers.length + 1),
        ...args.data,
        successfulOrderAt: null,
        usageCount: 0,
        usageLimit: null,
      });
      this.customers.push(customer);
      return Promise.resolve(customer);
    },
  };

  readonly promotionRule = {
    findFirst: () => Promise.resolve(this.rule),
  };

  readonly promotionCheck = {
    create: (args: { data: { phoneHash: string; isEligible: boolean; tokenId: string | null } }) => {
      this.checks.push(args.data);
      return Promise.resolve(args.data);
    },
  };
}

function createService(prisma: FakePrismaForPromotions): PromotionsService {
  return new PromotionsService(
    prisma as never,
    new PromotionTokenService(),
    new PromotionRateLimiterService(),
  );
}

void test("normalizes Vietnamese phone numbers", () => {
  assert.equal(normalizeVietnamesePhone("+84 901-234.567"), "0901234567");
  assert.equal(normalizeVietnamesePhone("84901234567"), "0901234567");
  assert.throws(() => normalizeVietnamesePhone("12345"));
});

void test("promotion check returns only eligible token data and stores phone hash", async () => {
  const seed = new FakePrismaForPromotions([]);
  const service = createService(seed);
  const phoneHash = service.hashPhone("0901234567");
  seed.customers.push(eligible({ phoneHash }));

  const result = await service.check("0901234567", "127.0.0.1", "test-agent");

  assert.equal(result.eligible, true);
  assert.equal(typeof result.promotionToken, "string");
  assert.ok(result.expiresAt);
  assert.deepEqual(Object.keys(result).sort(), ["eligible", "expiresAt", "promotionToken"]);
  const firstCheck = seed.checks[0];
  assert.ok(firstCheck);
  assert.equal(firstCheck.phoneHash, phoneHash);
  assert.notEqual(firstCheck.phoneHash, "0901234567");
});

void test("promotion check for inactive customer returns no customer details", async () => {
  const seed = new FakePrismaForPromotions([]);
  const service = createService(seed);
  seed.customers.push(eligible({ phoneHash: service.hashPhone("0901234567"), isActive: false }));

  const result = await service.check("0901234567", "127.0.0.1", undefined);

  assert.deepEqual(result, { eligible: false });
  const firstCheck = seed.checks[0];
  assert.ok(firstCheck);
  assert.equal(firstCheck.isEligible, false);
});

void test("promotion rate limiter applies to repeated checks", async () => {
  process.env.API_PROMOTION_RATE_LIMIT_MAX = "1";
  const seed = new FakePrismaForPromotions([]);
  const service = createService(seed);
  seed.customers.push(eligible({ phoneHash: service.hashPhone("0901234567") }));

  await service.check("0901234567", "10.0.0.1", undefined);
  await assert.rejects(() => service.check("0901234567", "10.0.0.1", undefined), HttpException);
  delete process.env.API_PROMOTION_RATE_LIMIT_MAX;
});

void test("eligible customer import counts created, updated, duplicates and invalid rows", async () => {
  const seed = new FakePrismaForPromotions([]);
  const service = createService(seed);
  const existingHash = service.hashPhone("0901234567");
  seed.customers.push(eligible({ phoneHash: existingHash }));

  const file = {
    originalname: "customers.csv",
    buffer: Buffer.from("phone\n0901234567\n+84 902 345 678\n0902.345.678\ninvalid\n"),
  } as Express.Multer.File;

  const result = await service.importEligibleCustomers(file, {
    source: "import",
    eligibilityReason: "imported",
  });

  assert.deepEqual(result, {
    success: 1,
    updated: 1,
    invalid: 1,
    duplicate: 1,
  });
});

void test("admin eligible customer list masks phone numbers", async () => {
  const service = createService(new FakePrismaForPromotions([eligible({ phoneNormalized: "0901234567" })]));

  const result = await service.listEligibleCustomers({});

  assert.equal(result[0]?.phoneMasked, "090****567");
  assert.equal(Object.hasOwn(result[0], "phoneNormalized"), false);
});
