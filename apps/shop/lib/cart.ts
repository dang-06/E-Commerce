import type { CartItem, Product } from "./types";

const maxQuantity = 99;

export function sanitizeCartItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const merged = new Map<string, number>();
  for (const item of value) {
    if (!isCartItemLike(item)) {
      continue;
    }
    const quantity = Math.max(1, Math.min(maxQuantity, Math.floor(item.quantity)));
    merged.set(item.productId, Math.min(maxQuantity, (merged.get(item.productId) ?? 0) + quantity));
  }

  return [...merged.entries()].map(([productId, quantity]) => ({ productId, quantity }));
}

export function readCart(storage: Storage | undefined, key = "shop_cart_v1"): CartItem[] {
  if (!storage) {
    return [];
  }

  try {
    return sanitizeCartItems(JSON.parse(storage.getItem(key) ?? "[]"));
  } catch {
    storage.removeItem(key);
    return [];
  }
}

export function writeCart(storage: Storage | undefined, items: CartItem[], key = "shop_cart_v1"): void {
  if (!storage) {
    return;
  }
  storage.setItem(key, JSON.stringify(sanitizeCartItems(items)));
}

export function setCartQuantity(items: CartItem[], productId: string, quantity: number): CartItem[] {
  const rest = items.filter((item) => item.productId !== productId);
  if (quantity <= 0) {
    return rest;
  }
  return [...rest, { productId, quantity: Math.min(maxQuantity, Math.floor(quantity)) }];
}

export function getProduct(products: Product[], productId: string): Product | undefined {
  return products.find((product) => product.id === productId);
}

function isCartItemLike(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<CartItem>;
  return typeof candidate.productId === "string" && typeof candidate.quantity === "number";
}
