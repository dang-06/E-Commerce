import { Injectable } from "@nestjs/common";

export interface OrderQuoteSnapshot {
  idempotencyKey: string;
  expiresAt: number;
  lines: {
    productId: string;
    quantity: number;
    listedPrice: string;
    discountPerItem: string;
    finalUnitPrice: string;
  }[];
  subtotal: string;
  discountAmount: string;
  shippingFee: string;
  totalAmount: string;
  totalQuantity: number;
}

@Injectable()
export class OrderQuoteStore {
  private readonly quotes = new Map<string, OrderQuoteSnapshot>();
  private readonly ttlMs = 15 * 60 * 1000;

  save(snapshot: Omit<OrderQuoteSnapshot, "expiresAt">): OrderQuoteSnapshot {
    const stored = {
      ...snapshot,
      expiresAt: Date.now() + this.ttlMs,
      lines: snapshot.lines.map((line) => ({ ...line })),
    };
    this.quotes.set(snapshot.idempotencyKey, stored);
    this.cleanupExpired();
    return stored;
  }

  get(idempotencyKey: string): OrderQuoteSnapshot | null {
    const snapshot = this.quotes.get(idempotencyKey);
    if (!snapshot) {
      return null;
    }
    if (snapshot.expiresAt <= Date.now()) {
      this.quotes.delete(idempotencyKey);
      return null;
    }
    return {
      ...snapshot,
      lines: snapshot.lines.map((line) => ({ ...line })),
    };
  }

  delete(idempotencyKey: string): void {
    this.quotes.delete(idempotencyKey);
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, snapshot] of this.quotes.entries()) {
      if (snapshot.expiresAt <= now) {
        this.quotes.delete(key);
      }
    }
  }
}
