import { randomInt } from "node:crypto";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Prisma, type EligibleCustomer, type Product, type PromotionRule } from "@prisma/client";
import { getConfig } from "../../config/app.config.js";
import { PrismaService } from "../../database/prisma.service.js";
import { PromotionTokenService } from "../promotions/promotion-token.service.js";
import { PromotionsService } from "../promotions/promotions.service.js";
import type { CreateOrderDto, OrderItemInputDto, QuoteOrderDto } from "./dto/order.dto.js";
import { OrderQuoteStore, type OrderQuoteSnapshot } from "./order-quote-store.service.js";

type DbClient = PrismaService | Prisma.TransactionClient;
type PricedProduct = Pick<
  Product,
  | "id"
  | "sku"
  | "name"
  | "listedPrice"
  | "stockQuantity"
  | "isPromotionEligible"
  | "discountAmount"
  | "isActive"
  | "deletedAt"
>;

interface ValidPromotion {
  customer: EligibleCustomer;
  phoneHash: string;
  phoneNormalized: string;
  rule: PromotionRule;
}

interface PricedLine {
  productId: string;
  sku: string;
  productName: string;
  listedPrice: bigint;
  discountPerItem: bigint;
  finalUnitPrice: bigint;
  quantity: number;
  lineSubtotal: bigint;
  lineDiscount: bigint;
  lineTotal: bigint;
}

interface PriceCalculation {
  promotion: ValidPromotion;
  lines: PricedLine[];
  subtotal: bigint;
  discountAmount: bigint;
  shippingFee: bigint;
  totalAmount: bigint;
  totalQuantity: number;
}

export interface OrderLineResponse {
  productId: string;
  sku: string;
  productName: string;
  listedPrice: string;
  discountPerItem: string;
  finalUnitPrice: string;
  quantity: number;
  lineSubtotal: string;
  lineDiscount: string;
  lineTotal: string;
}

export interface OrderQuoteResponse {
  status: "quoted";
  idempotencyKey: string;
  totalQuantity: number;
  subtotal: string;
  discountAmount: string;
  shippingFee: string;
  totalAmount: string;
  expiresAt: string;
  items: OrderLineResponse[];
}

export interface CreateOrderResponse {
  status: "created" | "duplicate";
  orderCode: string;
  createdAt: Date;
  totalQuantity: number;
  subtotal: string;
  discountAmount: string;
  shippingFee: string;
  totalAmount: string;
  items: OrderLineResponse[];
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly promotions: PromotionsService,
    private readonly tokens: PromotionTokenService,
    private readonly quoteStore: OrderQuoteStore,
  ) {}

  async quote(dto: QuoteOrderDto): Promise<OrderQuoteResponse> {
    const calculation = await this.calculate(dto, this.prisma);
    const snapshot = this.quoteStore.save(this.toSnapshot(dto.idempotencyKey, calculation));
    return this.toQuoteResponse(dto.idempotencyKey, calculation, snapshot.expiresAt);
  }

  async create(dto: CreateOrderDto): Promise<CreateOrderResponse> {
    const existing = await this.prisma.order.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
      include: { items: { orderBy: { id: "asc" } } },
    });
    if (existing) {
      return this.toCreateResponse(existing, "duplicate");
    }

    const calculation = await this.calculate(dto, this.prisma);
    const previousQuote = this.quoteStore.get(dto.idempotencyKey);
    if (previousQuote && !this.isSameQuote(previousQuote, this.toSnapshot(dto.idempotencyKey, calculation))) {
      throw new ConflictException({
        status: "price_changed",
        message: "Order price changed. Customer confirmation is required.",
        quote: this.toQuoteResponse(dto.idempotencyKey, calculation, Date.now() + 15 * 60 * 1000),
      });
    }

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            orderCode: await this.generateOrderCode(tx),
            idempotencyKey: dto.idempotencyKey,
            eligibleCustomerId: calculation.promotion.customer.id,
            promotionPhone: calculation.promotion.phoneNormalized,
            promotionPhoneHash: calculation.promotion.phoneHash,
            isPromotionApplied: calculation.discountAmount > 0n,
            recipientName: this.clean(dto.recipient.name),
            recipientPhone: this.promotions.normalizePhone(dto.recipient.phone),
            province: this.clean(dto.recipient.province),
            district: this.clean(dto.recipient.district),
            ward: this.clean(dto.recipient.ward),
            address: this.clean(dto.recipient.address),
            totalQuantity: calculation.totalQuantity,
            subtotal: calculation.subtotal,
            discountAmount: calculation.discountAmount,
            shippingFee: calculation.shippingFee,
            totalAmount: calculation.totalAmount,
            paymentMethod: dto.paymentMethod ?? "cod",
            note: this.optionalText(dto.note),
            items: {
              create: calculation.lines.map((line) => ({
                productId: BigInt(line.productId),
                sku: line.sku,
                productName: line.productName,
                listedPrice: line.listedPrice,
                discountPerItem: line.discountPerItem,
                finalUnitPrice: line.finalUnitPrice,
                quantity: line.quantity,
                lineSubtotal: line.lineSubtotal,
                lineDiscount: line.lineDiscount,
                lineTotal: line.lineTotal,
              })),
            },
          },
          include: { items: { orderBy: { id: "asc" } } },
        });

        for (const integration of getConfig().orderIntegrationNames) {
          const job = await tx.integrationJob.create({
            data: {
              orderId: order.id,
              integration,
              action: "create",
              status: "pending",
              requestPayload: { orderCode: order.orderCode },
            },
          });
          await tx.integrationLog.create({
            data: {
              orderId: order.id,
              integrationJobId: job.id,
              integration,
              action: "create",
              status: "pending",
              requestPayload: { orderCode: order.orderCode },
            },
          });
        }

        return order;
      });
      this.quoteStore.delete(dto.idempotencyKey);
      return this.toCreateResponse(created, "created");
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        const duplicated = await this.prisma.order.findUnique({
          where: { idempotencyKey: dto.idempotencyKey },
          include: { items: { orderBy: { id: "asc" } } },
        });
        if (duplicated) {
          return this.toCreateResponse(duplicated, "duplicate");
        }
      }
      throw error;
    }
  }

  private async calculate(dto: QuoteOrderDto, client: DbClient): Promise<PriceCalculation> {
    if (dto.items.length === 0) {
      throw new BadRequestException("Order must include at least one product");
    }
    const promotion = await this.validatePromotion(dto.promotionToken, dto.promotionPhone, client);
    const mergedItems = this.mergeItems(dto.items);
    const products = await client.product.findMany({
      where: { id: { in: mergedItems.map((item) => BigInt(item.productId)) } },
    });
    const productById = new Map(products.map((product) => [product.id.toString(), product as PricedProduct]));
    const lines = mergedItems.map((item) => {
      const product = productById.get(item.productId);
      if (!product || !product.isActive || product.deletedAt) {
        throw new BadRequestException("Product is not available for ordering");
      }
      if (product.stockQuantity !== null && item.quantity > product.stockQuantity) {
        throw new BadRequestException("Requested quantity exceeds available stock");
      }
      const discountPerItem =
        product.isPromotionEligible && product.discountAmount > 0n ? product.discountAmount : 0n;
      if (discountPerItem > product.listedPrice) {
        throw new BadRequestException("Promotion discount exceeds product price and needs confirmation");
      }
      const finalUnitPrice = product.listedPrice - discountPerItem;
      return {
        productId: product.id.toString(),
        sku: product.sku,
        productName: product.name,
        listedPrice: product.listedPrice,
        discountPerItem,
        finalUnitPrice,
        quantity: item.quantity,
        lineSubtotal: product.listedPrice * BigInt(item.quantity),
        lineDiscount: discountPerItem * BigInt(item.quantity),
        lineTotal: finalUnitPrice * BigInt(item.quantity),
      };
    });

    const subtotal = lines.reduce((sum, line) => sum + line.lineSubtotal, 0n);
    const discountAmount = lines.reduce((sum, line) => sum + line.lineDiscount, 0n);
    const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0);
    const shippingFee = this.resolveShippingFee();
    return {
      promotion,
      lines,
      subtotal,
      discountAmount,
      shippingFee,
      totalAmount: subtotal - discountAmount + shippingFee,
      totalQuantity,
    };
  }

  private async validatePromotion(token: string, phone: string, client: DbClient): Promise<ValidPromotion> {
    const phoneNormalized = this.promotions.normalizePhone(phone);
    const phoneHash = this.promotions.hashPhone(phoneNormalized);
    const payload = this.tokens.verify(token);
    if (payload.phoneHash !== phoneHash) {
      throw new UnauthorizedException("Promotion token does not match phone");
    }
    const [customer, rule] = await Promise.all([
      client.eligibleCustomer.findUnique({ where: { phoneHash } }),
      this.findActiveRule(payload.promotionRule, client),
    ]);
    if (!customer?.isActive || !rule || this.ruleVersion(rule) !== payload.promotionRuleVersion) {
      throw new UnauthorizedException("Promotion is no longer valid");
    }
    return { customer, phoneHash, phoneNormalized, rule };
  }

  private findActiveRule(code: string, client: DbClient): Promise<PromotionRule | null> {
    const now = new Date();
    return client.promotionRule.findFirst({
      where: {
        code,
        isActive: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      orderBy: { id: "desc" },
    });
  }

  private mergeItems(items: OrderItemInputDto[]): OrderItemInputDto[] {
    const merged = new Map<string, number>();
    for (const item of items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > 99) {
        throw new BadRequestException("Quantity must be between 1 and 99");
      }
      merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity);
    }
    return [...merged.entries()]
      .map(([productId, quantity]) => {
        if (quantity > 99) {
          throw new BadRequestException("Quantity must be between 1 and 99");
        }
        return { productId, quantity };
      })
      .sort((left, right) => BigInt(left.productId) < BigInt(right.productId) ? -1 : 1);
  }

  private resolveShippingFee(): bigint {
    return BigInt(getConfig().defaultShippingFeeVnd);
  }

  private toSnapshot(idempotencyKey: string, calculation: PriceCalculation): Omit<OrderQuoteSnapshot, "expiresAt"> {
    return {
      idempotencyKey,
      lines: calculation.lines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
        listedPrice: line.listedPrice.toString(),
        discountPerItem: line.discountPerItem.toString(),
        finalUnitPrice: line.finalUnitPrice.toString(),
      })),
      subtotal: calculation.subtotal.toString(),
      discountAmount: calculation.discountAmount.toString(),
      shippingFee: calculation.shippingFee.toString(),
      totalAmount: calculation.totalAmount.toString(),
      totalQuantity: calculation.totalQuantity,
    };
  }

  private isSameQuote(left: OrderQuoteSnapshot, right: Omit<OrderQuoteSnapshot, "expiresAt">): boolean {
    return JSON.stringify({ ...left, expiresAt: undefined }) === JSON.stringify(right);
  }

  private toQuoteResponse(
    idempotencyKey: string,
    calculation: PriceCalculation,
    expiresAt: number,
  ): OrderQuoteResponse {
    return {
      status: "quoted",
      idempotencyKey,
      totalQuantity: calculation.totalQuantity,
      subtotal: calculation.subtotal.toString(),
      discountAmount: calculation.discountAmount.toString(),
      shippingFee: calculation.shippingFee.toString(),
      totalAmount: calculation.totalAmount.toString(),
      expiresAt: new Date(expiresAt).toISOString(),
      items: calculation.lines.map((line) => this.toLineResponse(line)),
    };
  }

  private toCreateResponse(
    order: Prisma.OrderGetPayload<{ include: { items: true } }>,
    status: "created" | "duplicate",
  ): CreateOrderResponse {
    return {
      status,
      orderCode: order.orderCode,
      createdAt: order.createdAt,
      totalQuantity: order.totalQuantity,
      subtotal: order.subtotal.toString(),
      discountAmount: order.discountAmount.toString(),
      shippingFee: order.shippingFee.toString(),
      totalAmount: order.totalAmount.toString(),
      items: order.items.map((item) =>
        this.toLineResponse({
          productId: item.productId.toString(),
          sku: item.sku,
          productName: item.productName,
          listedPrice: item.listedPrice,
          discountPerItem: item.discountPerItem,
          finalUnitPrice: item.finalUnitPrice,
          quantity: item.quantity,
          lineSubtotal: item.lineSubtotal,
          lineDiscount: item.lineDiscount,
          lineTotal: item.lineTotal,
        }),
      ),
    };
  }

  private toLineResponse(line: PricedLine): OrderLineResponse {
    return {
      productId: line.productId,
      sku: line.sku,
      productName: line.productName,
      listedPrice: line.listedPrice.toString(),
      discountPerItem: line.discountPerItem.toString(),
      finalUnitPrice: line.finalUnitPrice.toString(),
      quantity: line.quantity,
      lineSubtotal: line.lineSubtotal.toString(),
      lineDiscount: line.lineDiscount.toString(),
      lineTotal: line.lineTotal.toString(),
    };
  }

  private async generateOrderCode(client: DbClient): Promise<string> {
    const date = new Date();
    const prefix = `OD${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const code = `${prefix}${randomInt(100000, 999999)}`;
      const existing = await client.order.findUnique({ where: { orderCode: code }, select: { id: true } });
      if (!existing) {
        return code;
      }
    }
    throw new ConflictException("Could not generate unique order code");
  }

  private ruleVersion(rule: PromotionRule): number {
    return Math.floor(rule.updatedAt.getTime() / 1000);
  }

  private clean(value: string): string {
    return value.trim();
  }

  private optionalText(value: string | undefined): string | null {
    const trimmed = value?.trim();
    if (!trimmed) {
      return null;
    }
    return trimmed;
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
  }
}
