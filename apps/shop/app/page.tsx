"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search, ShoppingBag } from "lucide-react";
import { OrderSummary } from "../components/OrderSummary";
import { ProductCard } from "../components/ProductCard";
import { RecipientFields } from "../components/RecipientFields";
import { checkPromotion, createOrder, fetchProducts, quoteOrder } from "../lib/api";
import { normalizeVietnamesePhone } from "../lib/phone";
import { calculateCartTotals, type CartTotals } from "../lib/pricing";
import { readCart, setCartQuantity, writeCart } from "../lib/cart";
import { formatVnd, parseVnd } from "../lib/money";
import { submitCheckout } from "../lib/checkout-flow";
import { validateRecipientForm } from "../lib/validation";
import type { CartItem, OrderQuote, OrderResult, Product, PromotionSession, RecipientForm } from "../lib/types";

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
  const [checkoutIdempotencyKey, setCheckoutIdempotencyKey] = useState<string | null>(null);
  const [serverQuote, setServerQuote] = useState<OrderQuote | null>(null);
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    setCartItems(readCart(globalThis.localStorage));
  }, []);

  useEffect(() => {
    writeCart(globalThis.localStorage, cartItems);
  }, [cartItems]);

  const totals = useMemo(
    () => calculateCartTotals(products, cartItems, promotionSession?.eligible === true, null),
    [cartItems, products, promotionSession],
  );
  const displayTotals = serverQuote ? totalsFromQuote(serverQuote) : totals;
  const filteredProducts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) {
      return products;
    }
    return products.filter((product) =>
      `${product.name} ${product.sku} ${product.slug}`.toLowerCase().includes(keyword),
    );
  }, [products, searchTerm]);

  useEffect(() => {
    setCheckoutIdempotencyKey(null);
    setServerQuote(null);
  }, [cartItems]);

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
      setPromotionSession({
        eligible: result.eligible && Boolean(result.promotionToken && result.expiresAt),
        phone: normalizedPhone,
        ...(result.expiresAt ? { expiresAt: result.expiresAt } : {}),
        ...(result.promotionToken ? { promotionToken: result.promotionToken } : {}),
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
      setCartOpen(true);
      return;
    }
    setOrderError(null);
    setCartOpen(false);
    setStep("checkout");
  }

  async function reviewOrder(): Promise<void> {
    const validation = validateRecipientForm(recipient);
    setRecipientErrors(validation.errors);
    if (!validation.valid) {
      return;
    }
    if (!promotionSession) {
      setOrderError("Vui lòng nhập số điện thoại trước khi đặt hàng.");
      return;
    }

    setSubmitting(true);
    setOrderError(null);
    const idempotencyKey = checkoutIdempotencyKey ?? crypto.randomUUID();
    try {
      const quote = await quoteOrder({
        cartItems,
        idempotencyKey,
        session: promotionSession,
      });
      setCheckoutIdempotencyKey(idempotencyKey);
      setServerQuote(quote);
      setStep("confirm");
    } catch {
      setOrderError("Không thể lấy báo giá chính thức. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  async function placeOrder(): Promise<void> {
    if (!checkoutIdempotencyKey) {
      setOrderError("Vui lòng tải lại báo giá trước khi đặt hàng.");
      return;
    }
    setSubmitting(true);
    setOrderError(null);
    const result = await submitCheckout({
      cartItems,
      createOrder,
      idempotencyKey: checkoutIdempotencyKey,
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
      <ShopHeader
        cartQuantity={totals.totalQuantity}
        cartTotal={totals.payableAmount ?? totals.subtotal - totals.discountAmount}
        searchTerm={searchTerm}
        onCartClick={() => {
          setCartOpen(true);
        }}
        onSearchChange={setSearchTerm}
      />

      {step === "intro" || step === "checking" ? (
        <section className="phone-panel" aria-labelledby="phone-title">
          <p className="eyebrow">ROSA PERFUME</p>
          <h1 id="phone-title">Nhập số điện thoại để vào cửa hàng</h1>
          <p className="intro-copy">
            Nếu số điện thoại có ưu đãi, sản phẩm sẽ tự hiện giá giảm. Nếu chưa có ưu đãi, bạn vẫn xem và đặt hàng với
            giá gốc.
          </p>
          <label className="field" htmlFor="promotion-phone">
            <span>Số điện thoại</span>
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
            Vào cửa hàng
          </button>
        </section>
      ) : null}

      {promotionSession ? (
        <section className={promotionSession.eligible ? "promotion-banner eligible" : "promotion-banner"}>
          {promotionSession.eligible
            ? "Số điện thoại có ưu đãi. Giá giảm đã được áp dụng trên sản phẩm đủ điều kiện."
            : "Bạn đang xem giá gốc. Giá cuối cùng vẫn sẽ được hệ thống xác nhận khi đặt hàng."}
        </section>
      ) : null}

      {step === "catalog" && selectedProduct ? (
        <ProductDetail
          product={selectedProduct}
          onBack={() => {
            setSelectedProduct(null);
          }}
          onAdd={addToCart}
          promotionUnlocked={promotionSession?.eligible === true}
          quantity={cartItems.find((item) => item.productId === selectedProduct.id)?.quantity ?? 0}
        />
      ) : null}

      {step === "catalog" && !selectedProduct ? (
        <section className="shop-section" aria-labelledby="catalog-title">
          <h2 className="sr-only" id="catalog-title">Danh sách sản phẩm</h2>
          {productsLoading ? <p className="status">Đang tải sản phẩm...</p> : null}
          {productsError ? <p className="status error">{productsError}</p> : null}
          {!productsLoading && !productsError && products.length === 0 ? (
            <p className="empty-state">Hiện chưa có sản phẩm khả dụng.</p>
          ) : null}
          <div className="product-list">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                promotionUnlocked={promotionSession?.eligible === true}
                onDetail={setSelectedProduct}
              />
            ))}
          </div>
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
            <button
              className="primary-button"
              disabled={submitting}
              type="button"
              onClick={() => {
                void reviewOrder();
              }}
            >
              {submitting ? "Đang lấy báo giá..." : "Xem lại đơn"}
            </button>
          </div>
        </section>
      ) : null}

      {step === "confirm" ? (
        <section className="shop-section" aria-labelledby="confirm-title">
          <h2 id="confirm-title">Xác nhận đơn</h2>
          <OrderSummary totals={displayTotals} />
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

      {cartOpen ? (
        <CartDrawer
          cartItems={cartItems}
          onCheckout={goToCheckout}
          onClose={() => {
            setCartOpen(false);
          }}
          onQuantityChange={updateQuantity}
          products={products}
          totals={displayTotals}
        />
      ) : null}
    </main>
  );
}

function ShopHeader({
  cartQuantity,
  cartTotal,
  onCartClick,
  onSearchChange,
  searchTerm,
}: {
  cartQuantity: number;
  cartTotal: number;
  onCartClick: () => void;
  onSearchChange: (value: string) => void;
  searchTerm: string;
}): React.ReactElement {
  return (
    <header className="shop-header">
      <div className="brand-lockup" aria-label="Rosa Perfume">
        <img src="/placeholder-logo.png" alt="" />
        <span>ROSA PERFUME</span>
      </div>
      <label className="search-box">
        <span className="sr-only">Tìm sản phẩm</span>
        <input
          placeholder="Tìm sản phẩm của bạn"
          value={searchTerm}
          onChange={(event) => {
            onSearchChange(event.target.value);
          }}
        />
        <Search aria-hidden="true" size={25} />
      </label>
      <button className="cart-status" type="button" onClick={onCartClick} aria-label={`${cartQuantity} sản phẩm trong giỏ`}>
        <ShoppingBag aria-hidden="true" size={31} />
        <div>
          <strong>{formatVnd(cartTotal)}</strong>
          <span>{cartQuantity} sản phẩm</span>
        </div>
      </button>
    </header>
  );
}

function totalsFromQuote(quote: OrderQuote): CartTotals {
  return {
    lines: [],
    totalQuantity: quote.totalQuantity,
    subtotal: parseVnd(quote.subtotal),
    discountAmount: parseVnd(quote.discountAmount),
    shippingFee: parseVnd(quote.shippingFee),
    payableAmount: parseVnd(quote.totalAmount),
  };
}

function CartDrawer({
  cartItems,
  onCheckout,
  onClose,
  onQuantityChange,
  products,
  totals,
}: {
  cartItems: CartItem[];
  onCheckout: () => void;
  onClose: () => void;
  onQuantityChange: (productId: string, quantity: number) => void;
  products: Product[];
  totals: CartTotals;
}): React.ReactElement {
  return (
    <div className="cart-backdrop" role="presentation" onClick={onClose}>
      <aside
        aria-labelledby="cart-title"
        aria-modal="true"
        className="cart-drawer"
        role="dialog"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <div className="section-heading">
          <h2 id="cart-title">Giỏ hàng</h2>
          <button className="close-button" type="button" onClick={onClose} aria-label="Đóng giỏ hàng">
            ×
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
        <OrderSummary totals={totals} />
        <button className="primary-button full-width" type="button" onClick={onCheckout}>
          Nhận hàng
        </button>
      </aside>
    </div>
  );
}

function ProductDetail({
  onAdd,
  onBack,
  product,
  promotionUnlocked,
  quantity,
}: {
  onAdd: (productId: string) => void;
  onBack: () => void;
  product: Product;
  promotionUnlocked: boolean;
  quantity: number;
}): React.ReactElement {
  const listedPrice = parseVnd(product.listedPrice);
  const discount = promotionUnlocked && product.isPromotionEligible ? Math.min(parseVnd(product.discountAmount), listedPrice) : 0;
  const finalPrice = listedPrice - discount;
  const imageUrl = product.imageUrl ?? product.images[0]?.imageUrl;
  const trimmedDescription = product.description?.trim();
  const description =
    trimmedDescription && trimmedDescription.length > 0 ? trimmedDescription : "Sản phẩm đang được cập nhật mô tả.";
  const detailRows = buildProductDetailRows(description);
  return (
    <section aria-labelledby="detail-title" className="detail-sheet">
      <div className="detail-content">
        <div className="detail-media">
          {discount > 0 ? <span className="detail-discount">-{formatVnd(discount)}</span> : null}
          {imageUrl ? (
            <img src={imageUrl} alt={product.name} />
          ) : (
            <span className="image-placeholder" aria-hidden="true">
              {product.name.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        <div className="detail-copy">
          <nav className="detail-breadcrumb" aria-label="Điều hướng sản phẩm">
            Trang chủ <span>/</span>  <strong>{product.name}</strong>
          </nav>
          <p className="sku">{product.sku}</p>
          <h2 id="detail-title">{product.name}</h2>
          <div className="detail-price">
            {discount > 0 ? <span className="price-listed">{formatVnd(listedPrice)}</span> : null}
            <strong>{formatVnd(finalPrice)}</strong>
          </div>
          <div className="detail-specs">
            {detailRows.length > 0 ? (
              detailRows.map((row) => (
                <p key={row.label}>
                  <strong>{row.label}:</strong> {row.value}
                </p>
              ))
            ) : (
              <p>{description}</p>
            )}
          </div>
        </div>
        <div className="detail-actions">
          <button
            className="primary-button full-width"
            type="button"
            onClick={() => {
              onAdd(product.id);
            }}
          >
            {quantity > 0 ? `Thêm nữa (${quantity} trong giỏ)` : "Thêm vào giỏ"}
          </button>
        </div>
      </div>
    </section>
  );
}

function buildProductDetailRows(description: string): { label: string; value: string }[] {
  const lines = description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const parsedRows = lines.flatMap((line) => {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex <= 0) {
      return [];
    }
    return [
      {
        label: line.slice(0, separatorIndex).trim(),
        value: line.slice(separatorIndex + 1).trim(),
      },
    ];
  });

  return parsedRows;
}
