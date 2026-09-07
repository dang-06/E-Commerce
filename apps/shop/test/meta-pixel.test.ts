import assert from "node:assert/strict";
import test from "node:test";
import { setCartQuantity } from "../lib/cart";
import { submitCheckout } from "../lib/checkout-flow";
import {
  trackCompleteRegistration,
  trackOrderCreatedConversions,
  trackPageView,
  type MetaPixelFunction,
} from "../lib/meta-pixel";
import type { OrderResult } from "../lib/types";
import { sampleProduct, validRecipient } from "./fixtures";

type FbqCall = Parameters<MetaPixelFunction>;

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

function withMetaPixelWindow(
  input: { pixelId?: string; withFbq?: boolean },
  run: (calls: FbqCall[]) => void | Promise<void>,
): Promise<void> | void {
  const previousPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const calls: FbqCall[] = [];
  const fbq: MetaPixelFunction = (...command) => {
    calls.push(command);
  };

  process.env.NEXT_PUBLIC_META_PIXEL_ID = input.pixelId ?? "1234567890";
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      ...(input.withFbq === false ? {} : { fbq }),
      sessionStorage: new MemoryStorage(),
    },
  });

  const result = run(calls);
  if (result instanceof Promise) {
    return result.finally(() => {
      restoreWindow(previousWindow);
      restorePixelId(previousPixelId);
    });
  }

  restoreWindow(previousWindow);
  restorePixelId(previousPixelId);
}

function restoreWindow(descriptor: PropertyDescriptor | undefined): void {
  if (descriptor) {
    Object.defineProperty(globalThis, "window", descriptor);
    return;
  }

  Reflect.deleteProperty(globalThis, "window");
}

function restorePixelId(value: string | undefined): void {
  if (value === undefined) {
    Reflect.deleteProperty(process.env, "NEXT_PUBLIC_META_PIXEL_ID");
    return;
  }

  process.env.NEXT_PUBLIC_META_PIXEL_ID = value;
}

function createdOrder(overrides: Partial<OrderResult> = {}): OrderResult {
  return {
    createdAt: new Date("2026-09-07T00:00:00.000Z").toISOString(),
    discountAmount: "25000",
    orderCode: "OD202609070001",
    shippingFee: "30000",
    status: "created",
    subtotal: "214000",
    totalAmount: "219000",
    totalQuantity: 2,
    ...overrides,
  };
}

function eventCalls(calls: FbqCall[], event: string): FbqCall[] {
  return calls.filter((call) => call[0] === "track" && call[1] === event);
}

void test("Meta Pixel helper does not throw server-side", () => {
  const previousPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  process.env.NEXT_PUBLIC_META_PIXEL_ID = "1234567890";
  restoreWindow(undefined);

  assert.doesNotThrow(() => {
    trackPageView();
    trackCompleteRegistration(
      {
        content_ids: ["1"],
        currency: "VND",
        num_items: 1,
        status: "created",
        value: 219000,
      },
      { eventID: "OD-SERVER" },
    );
  });

  restoreWindow(previousWindow);
  restorePixelId(previousPixelId);
});

void test("Meta Pixel helper does not throw when fbq is missing", () => {
  void withMetaPixelWindow({ withFbq: false }, () => {
    assert.doesNotThrow(() => {
      trackPageView();
      trackOrderCreatedConversions(createdOrder(), [{ productId: "1", quantity: 1 }]);
    });
  });
});

void test("missing Pixel ID skips tracking safely", () => {
  void withMetaPixelWindow({ pixelId: "" }, (calls) => {
    trackPageView();
    trackOrderCreatedConversions(createdOrder(), [{ productId: "1", quantity: 1 }]);

    assert.equal(calls.length, 0);
  });
});

void test("order API success tracks CompleteRegistration and Purchase", async () => {
  await withMetaPixelWindow({}, async (calls) => {
    const product = sampleProduct();
    const cart = setCartQuantity([], product.id, 2);
    const result = await submitCheckout({
      cartItems: cart,
      createOrder: () => Promise.resolve(createdOrder()),
      idempotencyKey: "idem-success-1",
      products: [product],
      recipient: validRecipient(),
      session: { eligible: false, phone: "0909999999" },
    });

    if (result.ok && result.order) {
      trackOrderCreatedConversions(result.order, cart);
    }

    assert.equal(eventCalls(calls, "CompleteRegistration").length, 1);
    assert.equal(eventCalls(calls, "Purchase").length, 1);
  });
});

void test("order API failure does not track CompleteRegistration or Purchase", async () => {
  await withMetaPixelWindow({}, async (calls) => {
    const product = sampleProduct();
    const result = await submitCheckout({
      cartItems: [{ productId: product.id, quantity: 1 }],
      createOrder: () => Promise.reject(new Error("API failed")),
      idempotencyKey: "idem-failure-1",
      products: [product],
      recipient: validRecipient(),
      session: { eligible: false, phone: "0909999999" },
    });

    if (result.ok && result.order) {
      trackOrderCreatedConversions(result.order, [{ productId: product.id, quantity: 1 }]);
    }

    assert.equal(result.ok, false);
    assert.equal(eventCalls(calls, "CompleteRegistration").length, 0);
    assert.equal(eventCalls(calls, "Purchase").length, 0);
  });
});

void test("Purchase value uses final total from order response in VND units", () => {
  void withMetaPixelWindow({}, (calls) => {
    trackOrderCreatedConversions(createdOrder({ totalAmount: "219000" }), [
      { productId: "1", quantity: 2 },
    ]);

    const purchase = eventCalls(calls, "Purchase")[0];
    assert.ok(purchase);
    assert.deepEqual(purchase[2], { currency: "VND", value: 219000 });
  });
});

void test("same order does not track the same conversion twice", () => {
  void withMetaPixelWindow({}, (calls) => {
    const order = createdOrder({ orderCode: "OD-DEDUPE-1" });
    const cart = [{ productId: "1", quantity: 1 }];

    trackOrderCreatedConversions(order, cart);
    trackOrderCreatedConversions(order, cart);

    assert.equal(eventCalls(calls, "CompleteRegistration").length, 1);
    assert.equal(eventCalls(calls, "Purchase").length, 1);
  });
});

void test("different orders track independently", () => {
  void withMetaPixelWindow({}, (calls) => {
    const cart = [{ productId: "1", quantity: 1 }];

    trackOrderCreatedConversions(createdOrder({ orderCode: "OD-ONE" }), cart);
    trackOrderCreatedConversions(createdOrder({ orderCode: "OD-TWO" }), cart);

    assert.equal(eventCalls(calls, "CompleteRegistration").length, 2);
    assert.equal(eventCalls(calls, "Purchase").length, 2);
  });
});

void test("conversion payload does not contain recipient PII or sensitive tokens", () => {
  void withMetaPixelWindow({}, (calls) => {
    trackOrderCreatedConversions(createdOrder(), [{ productId: "1", quantity: 2 }]);

    const serializedPayloads = JSON.stringify(calls);
    assert.doesNotMatch(serializedPayloads, /Nguyen Van A/);
    assert.doesNotMatch(serializedPayloads, /0901234567/);
    assert.doesNotMatch(serializedPayloads, /1 Nguyen Hue/);
    assert.doesNotMatch(serializedPayloads, /promotionToken|signed-token|cookie/i);
  });
});
