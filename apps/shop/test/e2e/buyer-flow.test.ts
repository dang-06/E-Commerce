import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeCartItems, setCartQuantity } from "../../lib/cart";
import { submitCheckout } from "../../lib/checkout-flow";
import { normalizeVietnamesePhone } from "../../lib/phone";
import { calculateCartTotals } from "../../lib/pricing";
import { validateRecipientForm } from "../../lib/validation";
import { sampleProduct, validRecipient } from "../fixtures";

void test("buyer flow checks phone, builds cart, validates recipient and submits order payload", async () => {
  const phone = normalizeVietnamesePhone("+84 901-234-567");
  assert.equal(phone, "0901234567");

  const product = sampleProduct();
  const cart = setCartQuantity([], product.id, 2);
  const totals = calculateCartTotals([product], cart, true, null);
  assert.equal(totals.totalQuantity, 2);
  assert.equal(totals.subtotal, 198000);
  assert.equal(totals.discountAmount, 50000);

  const recipient = validRecipient();
  assert.equal(validateRecipientForm(recipient).valid, true);

  const result = await submitCheckout({
    cartItems: cart,
    createOrder: (payload) => {
      assert.equal(payload.session.promotionToken, "signed-token");
      assert.deepEqual(payload.cartItems, [{ productId: "1", quantity: 2 }]);
      return Promise.resolve({
        orderCode: "ORD-TEST-1",
        createdAt: new Date("2026-07-15T00:00:00.000Z").toISOString(),
      });
    },
    idempotencyKey: "idem-1",
    products: [product],
    recipient,
    session: {
      phone,
      promotionToken: "signed-token",
      expiresAt: new Date("2026-07-15T00:30:00.000Z").toISOString(),
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.order?.orderCode, "ORD-TEST-1");
});

void test("buyer flow blocks checkout without promotion session or valid recipient", async () => {
  const product = sampleProduct();
  const noSession = await submitCheckout({
    cartItems: [{ productId: product.id, quantity: 1 }],
    createOrder: () => Promise.reject(new Error("should not submit without session")),
    idempotencyKey: "idem-2",
    products: [product],
    recipient: validRecipient(),
    session: null,
  });

  assert.equal(noSession.ok, false);

  const invalidRecipient = validateRecipientForm(validRecipient({ recipientPhone: "12345" }));
  assert.equal(invalidRecipient.valid, false);
  assert.equal(Boolean(invalidRecipient.errors.recipientPhone), true);
});

void test("cart storage sanitization removes malformed items and merges duplicates", () => {
  const sanitized = sanitizeCartItems([
    { productId: "1", quantity: 1 },
    { productId: "1", quantity: 2 },
    { productId: "2", quantity: 0 },
    { productId: 3, quantity: 1 },
  ]);

  assert.deepEqual(sanitized, [
    { productId: "1", quantity: 3 },
    { productId: "2", quantity: 1 },
  ]);
});
