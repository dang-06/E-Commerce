"use client";

import { useEffect, useMemo, useState } from "react";
import { OrderSummary } from "../components/OrderSummary";
import { ProductCard } from "../components/ProductCard";
import { RecipientFields } from "../components/RecipientFields";
import { checkPromotion, createOrder, fetchProducts } from "../lib/api";
import { normalizeVietnamesePhone } from "../lib/phone";
import { calculateCartTotals } from "../lib/pricing";
import { readCart, setCartQuantity, writeCart } from "../lib/cart";
import { formatVnd, parseVnd } from "../lib/money";
import { submitCheckout } from "../lib/checkout-flow";
import { validateRecipientForm } from "../lib/validation";
import type { CartItem, OrderResult, Product, PromotionSession, RecipientForm } from "../lib/types";

type Step = "intro" | "checking" | "catalog" | "checkout" | "confirm" | "success";

const emptyRecipient: RecipientForm = {
  recipientName: "",
  recipientPhone: "",
  province: "",
  district: "",
  ward: "",
  address: "",
  note: "",
};

export default function ShopPage(): React.ReactElement {
  const [step, setStep] = useState<Step>("intro");
  const [phoneInput, setPhoneInput] = useState("");
  const [promotionSession, setPromotionSession] = useState<PromotionSession | null>(null);
  const [promotionError, setPromotionError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [productsLoading, setProductsLoading] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [recipient, setRecipient] = useState<RecipientForm>(emptyRecipient);
  const [recipientErrors, setRecipientErrors] = useState<Partial<Record<keyof RecipientForm, string>>>({});
  const [orderError, setOrderError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<OrderResult | null>(null);

  useEffect(() => {
    setCartItems(readCart(globalThis.localStorage));
  }, []);

  useEffect(() => {
    writeCart(globalThis.localStorage, cartItems);
  }, [cartItems]);

  const totals = useMemo(
    () => calculateCartTotals(products, cartItems, promotionSession !== null, null),
    [cartItems, products, promotionSession],
  );

  async function handlePromotionCheck(): Promise<void> {
    setPromotionError(null);
    let normalizedPhone: string;
    try {
      normalizedPhone = normalizeVietnamesePhone(phoneInput);
    } catch {
      setPromotionError("Số điện thoại chưa đúng định dạng. Vui lòng kiểm tra lại.");
      return;
    }

    setStep("checking");
    try {
      const result = await checkPromotion(normalizedPhone);
      if (!result.eligible || !result.promotionToken || !result.expiresAt) {
        setPromotionError("Hiện số điện thoại này chưa mở được ưu đãi trên website.");
        setStep("intro");
        return;
      }

      setPromotionSession({
        phone: normalizedPhone,
        promotionToken: result.promotionToken,
        expiresAt: result.expiresAt,
      });
      setStep("catalog");
      await loadProducts();
    } catch {
      setPromotionError("Không thể kiểm tra ưu đãi lúc này. Vui lòng thử lại.");
      setStep("intro");
    }
  }

  async function loadProducts(): Promise<void> {
    setProductsLoading(true);
    setProductsError(null);
    try {
      setProducts(await fetchProducts());
    } catch {
      setProductsError("Không tải được danh sách sản phẩm.");
    } finally {
      setProductsLoading(false);
    }
  }

  function addToCart(productId: string): void {
    const current = cartItems.find((item) => item.productId === productId)?.quantity ?? 0;
    setCartItems(setCartQuantity(cartItems, productId, current + 1));
  }

  function updateQuantity(productId: string, quantity: number): void {
    setCartItems(setCartQuantity(cartItems, productId, quantity));
  }

  function goToCheckout(): void {
    if (totals.totalQuantity === 0) {
      setOrderError("Vui lòng chọn ít nhất một sản phẩm.");
      return;
    }
    setOrderError(null);
    setStep("checkout");
  }

  function reviewOrder(): void {
    const validation = validateRecipientForm(recipient);
    setRecipientErrors(validation.errors);
    if (!validation.valid) {
      return;
    }
    setStep("confirm");
  }

  async function placeOrder(): Promise<void> {
    setSubmitting(true);
    setOrderError(null);
    const result = await submitCheckout({
      cartItems,
      createOrder,
      idempotencyKey: crypto.randomUUID(),
      products,
      recipient,
      session: promotionSession,
    });
    setSubmitting(false);

    if (!result.ok || !result.order) {
      setOrderError(result.error ?? "Không thể tạo đơn. Vui lòng thử lại.");
      return;
    }

    setOrder(result.order);
    setCartItems([]);
    setStep("success");
  }

  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="program-title">
        <p className="eyebrow">Ưu đãi khách hàng thân thiết</p>
        <h1 id="program-title">Kiểm tra số điện thoại để mở giá ưu đãi</h1>
        <p>
          Nhập số điện thoại trước khi vào gian hàng. Website chỉ hiển thị trạng thái ưu đãi cần thiết và không tiết lộ
          thông tin mua hàng của bất kỳ cá nhân nào.
        </p>
      </section>

      {step === "intro" || step === "checking" ? (
        <section className="phone-panel" aria-labelledby="phone-title">
          <h2 id="phone-title">Nhập số điện thoại</h2>
          <label className="field" htmlFor="promotion-phone">
            <span>Số điện thoại dùng để kiểm tra ưu đãi</span>
            <input
              autoComplete="tel"
              id="promotion-phone"
              inputMode="tel"
              placeholder="Ví dụ: 0901234567"
              value={phoneInput}
              onChange={(event) => {
                setPhoneInput(event.target.value);
              }}
            />
          </label>
          {promotionError ? <p className="status error">{promotionError}</p> : null}
          {step === "checking" ? <p className="status">Đang kiểm tra ưu đãi...</p> : null}
          <button
            className="primary-button full-width"
            disabled={step === "checking"}
            type="button"
            onClick={() => {
              void handlePromotionCheck();
            }}
          >
            Kiểm tra và vào gian hàng
          </button>
        </section>
      ) : null}

      {promotionSession ? (
        <section className="status success">
          Ưu đãi đã được mở cho phiên này. Giá cuối cùng vẫn sẽ được hệ thống xác nhận khi đặt hàng.
        </section>
      ) : null}

      {step === "catalog" ? (
        <section className="shop-section" aria-labelledby="catalog-title">
          <div className="section-heading">
            <h2 id="catalog-title">Danh sách sản phẩm</h2>
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                void loadProducts();
              }}
            >
              Tải lại
            </button>
          </div>
          {productsLoading ? <p className="status">Đang tải sản phẩm...</p> : null}
          {productsError ? <p className="status error">{productsError}</p> : null}
          {!productsLoading && !productsError && products.length === 0 ? (
            <p className="empty-state">Hiện chưa có sản phẩm khả dụng.</p>
          ) : null}
          <div className="product-list">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                promotionUnlocked={promotionSession !== null}
                quantity={cartItems.find((item) => item.productId === product.id)?.quantity ?? 0}
                onAdd={addToCart}
                onDetail={setSelectedProduct}
              />
            ))}
          </div>
          <CartPanel cartItems={cartItems} products={products} onCheckout={goToCheckout} onQuantityChange={updateQuantity} />
          <OrderSummary totals={totals} />
          {orderError ? <p className="status error">{orderError}</p> : null}
        </section>
      ) : null}

      {step === "checkout" ? (
        <section className="shop-section">
          <RecipientFields
            errors={recipientErrors}
            form={recipient}
            onChange={(field, value) => {
              setRecipient({ ...recipient, [field]: value });
            }}
          />
          <OrderSummary totals={totals} />
          <div className="sticky-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setStep("catalog");
              }}
            >
              Quay lại
            </button>
            <button className="primary-button" type="button" onClick={reviewOrder}>
              Xem lại đơn
            </button>
          </div>
        </section>
      ) : null}

      {step === "confirm" ? (
        <section className="shop-section" aria-labelledby="confirm-title">
          <h2 id="confirm-title">Xác nhận đơn</h2>
          <OrderSummary totals={totals} />
          <div className="confirm-box">
            <p>
              <strong>Người nhận:</strong> {recipient.recipientName}
            </p>
            <p>
              <strong>Điện thoại:</strong> {recipient.recipientPhone}
            </p>
            <p>
              <strong>Địa chỉ:</strong> {recipient.address}, {recipient.ward}, {recipient.district}, {recipient.province}
            </p>
          </div>
          {orderError ? <p className="status error">{orderError}</p> : null}
          <div className="sticky-actions">
            <button
              className="secondary-button"
              disabled={submitting}
              type="button"
              onClick={() => {
                setStep("checkout");
              }}
            >
              Sửa thông tin
            </button>
            <button
              className="primary-button"
              disabled={submitting}
              type="button"
              onClick={() => {
                void placeOrder();
              }}
            >
              {submitting ? "Đang đặt hàng..." : "Đặt hàng"}
            </button>
          </div>
        </section>
      ) : null}

      {step === "success" && order ? (
        <section className="success-screen" aria-labelledby="success-title">
          <p className="eyebrow">Đặt hàng thành công</p>
          <h2 id="success-title">Mã đơn {order.orderCode}</h2>
          <p>Đơn hàng đã được ghi nhận. Shop sẽ xử lý theo thông tin bạn đã cung cấp.</p>
          <button
            className="primary-button full-width"
            type="button"
            onClick={() => {
              setStep("catalog");
            }}
          >
            Tiếp tục xem sản phẩm
          </button>
        </section>
      ) : null}

      {selectedProduct ? (
        <ProductDetail
          product={selectedProduct}
          onClose={() => {
            setSelectedProduct(null);
          }}
          promotionUnlocked={promotionSession !== null}
        />
      ) : null}
    </main>
  );
}

function CartPanel({
  cartItems,
  onCheckout,
  onQuantityChange,
  products,
}: {
  cartItems: CartItem[];
  onCheckout: () => void;
  onQuantityChange: (productId: string, quantity: number) => void;
  products: Product[];
}): React.ReactElement {
  return (
    <section className="cart-panel" aria-labelledby="cart-title">
      <div className="section-heading">
        <h2 id="cart-title">Giỏ hàng</h2>
        <button className="primary-button" type="button" onClick={onCheckout}>
          Nhận hàng
        </button>
      </div>
      {cartItems.length === 0 ? <p className="empty-state">Giỏ hàng đang trống.</p> : null}
      {cartItems.map((item) => {
        const product = products.find((candidate) => candidate.id === item.productId);
        if (!product) {
          return null;
        }
        return (
          <div className="cart-row" key={item.productId}>
            <div>
              <strong>{product.name}</strong>
              <p>{formatVnd(parseVnd(product.listedPrice))}</p>
            </div>
            <label>
              <span className="sr-only">Số lượng {product.name}</span>
              <input
                min={0}
                type="number"
                value={item.quantity}
                onChange={(event) => {
                  onQuantityChange(item.productId, Number(event.target.value));
                }}
              />
            </label>
          </div>
        );
      })}
    </section>
  );
}

function ProductDetail({
  onClose,
  product,
  promotionUnlocked,
}: {
  onClose: () => void;
  product: Product;
  promotionUnlocked: boolean;
}): React.ReactElement {
  const listedPrice = parseVnd(product.listedPrice);
  const discount = promotionUnlocked && product.isPromotionEligible ? Math.min(parseVnd(product.discountAmount), listedPrice) : 0;
  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-labelledby="detail-title" aria-modal="true" className="detail-sheet" role="dialog">
        <button className="close-button" type="button" onClick={onClose} aria-label="Đóng chi tiết sản phẩm">
          ×
        </button>
        <p className="sku">{product.sku}</p>
        <h2 id="detail-title">{product.name}</h2>
        <p>{product.description ?? "Sản phẩm đang được cập nhật mô tả."}</p>
        <p className="detail-price">
          {discount > 0 ? (
            <>
              <span className="price-listed">{formatVnd(listedPrice)}</span>
              <strong>{formatVnd(listedPrice - discount)}</strong>
              <span className="saving">Tiết kiệm {formatVnd(discount)}</span>
            </>
          ) : (
            <strong>{formatVnd(listedPrice)}</strong>
          )}
        </p>
      </section>
    </div>
  );
}
