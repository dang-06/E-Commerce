import { calculateCartTotals } from "./pricing";
import { validateRecipientForm } from "./validation";
import type { CartItem, OrderResult, Product, PromotionSession, RecipientForm } from "./types";

export interface CheckoutFlowResult {
  ok: boolean;
  error?: string;
  order?: OrderResult;
}

export async function submitCheckout(input: {
  cartItems: CartItem[];
  createOrder: (payload: {
    cartItems: CartItem[];
    idempotencyKey: string;
    recipient: RecipientForm;
    session: PromotionSession;
  }) => Promise<OrderResult>;
  idempotencyKey: string;
  products: Product[];
  recipient: RecipientForm;
  session: PromotionSession | null;
}): Promise<CheckoutFlowResult> {
  if (!input.session) {
    return { ok: false, error: "Vui lòng nhập số điện thoại trước khi đặt hàng." };
  }

  const totals = calculateCartTotals(input.products, input.cartItems, input.session.eligible, null);
  if (totals.totalQuantity <= 0) {
    return { ok: false, error: "Giỏ hàng đang trống." };
  }

  const validation = validateRecipientForm(input.recipient);
  if (!validation.valid) {
    return { ok: false, error: "Vui lòng kiểm tra lại thông tin nhận hàng." };
  }

  let order: OrderResult;
  try {
    order = await input.createOrder({
      cartItems: input.cartItems,
      idempotencyKey: input.idempotencyKey,
      recipient: input.recipient,
      session: input.session,
    });
  } catch {
    return { ok: false, error: "Không thể tạo đơn. Vui lòng tải lại báo giá và thử lại." };
  }

  return { ok: true, order };
}
