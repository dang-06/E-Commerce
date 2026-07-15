import { getProduct } from "./cart";
import { parseVnd } from "./money";
import type { CartItem, Product } from "./types";

export interface CartLine {
  product: Product;
  quantity: number;
  listedPrice: number;
  discountPerItem: number;
  finalUnitPrice: number;
  lineSubtotal: number;
  lineDiscount: number;
  lineTotal: number;
}

export interface CartTotals {
  lines: CartLine[];
  totalQuantity: number;
  subtotal: number;
  discountAmount: number;
  shippingFee: number | null;
  payableAmount: number | null;
}

export function calculateCartTotals(
  products: Product[],
  items: CartItem[],
  hasPromotion: boolean,
  shippingFee: number | null,
): CartTotals {
  const lines = items.flatMap((item) => {
    const product = getProduct(products, item.productId);
    if (!product) {
      return [];
    }

    const listedPrice = parseVnd(product.listedPrice);
    const discount = hasPromotion && product.isPromotionEligible ? parseVnd(product.discountAmount) : 0;
    const discountPerItem = Math.min(discount, listedPrice);
    const finalUnitPrice = listedPrice - discountPerItem;

    return [
      {
        product,
        quantity: item.quantity,
        listedPrice,
        discountPerItem,
        finalUnitPrice,
        lineSubtotal: listedPrice * item.quantity,
        lineDiscount: discountPerItem * item.quantity,
        lineTotal: finalUnitPrice * item.quantity,
      },
    ];
  });

  const subtotal = lines.reduce((sum, line) => sum + line.lineSubtotal, 0);
  const discountAmount = lines.reduce((sum, line) => sum + line.lineDiscount, 0);
  const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0);

  return {
    lines,
    totalQuantity,
    subtotal,
    discountAmount,
    shippingFee,
    payableAmount: shippingFee === null ? null : subtotal - discountAmount + shippingFee,
  };
}
