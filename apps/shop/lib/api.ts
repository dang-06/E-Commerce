import type { CartItem, OrderResult, Product, PromotionCheckResult, PromotionSession, RecipientForm } from "./types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("content-type", "application/json");
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export function fetchProducts(): Promise<Product[]> {
  return requestJson<Product[]>("/products", { cache: "no-store" });
}

export function checkPromotion(phone: string): Promise<PromotionCheckResult> {
  return requestJson<PromotionCheckResult>("/promotions/check", {
    body: JSON.stringify({ phone }),
    method: "POST",
  });
}

export function createOrder(input: {
  cartItems: CartItem[];
  idempotencyKey: string;
  recipient: RecipientForm;
  session: PromotionSession;
}): Promise<OrderResult> {
  return requestJson<OrderResult>("/orders", {
    body: JSON.stringify({
      idempotencyKey: input.idempotencyKey,
      items: input.cartItems,
      note: input.recipient.note || undefined,
      promotionPhone: input.session.phone,
      promotionToken: input.session.promotionToken,
      recipient: {
        address: input.recipient.address,
        district: input.recipient.district,
        name: input.recipient.recipientName,
        phone: input.recipient.recipientPhone,
        province: input.recipient.province,
        ward: input.recipient.ward,
      },
    }),
    method: "POST",
  });
}
