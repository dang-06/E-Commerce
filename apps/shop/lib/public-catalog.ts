import type { Product } from "./types";

export function isVisibleShopProduct(product: Product): boolean {
  return product.isActive;
}

export function visibleShopProducts(products: Product[]): Product[] {
  return products.filter(isVisibleShopProduct);
}
