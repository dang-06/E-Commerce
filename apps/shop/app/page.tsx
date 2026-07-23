"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search, ShoppingBag } from "lucide-react";
import { OrderSummary } from "../components/OrderSummary";
import { ProductCard } from "../components/ProductCard";
import { RecipientFields } from "../components/RecipientFields";
import { checkPromotion, createOrder, fetchProducts, fetchSiteSettings, quoteOrder } from "../lib/api";
import { normalizeVietnamesePhone } from "../lib/phone";
import { calculateCartTotals, type CartTotals } from "../lib/pricing";
import { readCart, setCartQuantity, writeCart } from "../lib/cart";
import { formatVnd, parseVnd } from "../lib/money";
import { submitCheckout } from "../lib/checkout-flow";
import { validateRecipientForm } from "../lib/validation";
import type {
  CartItem,
  OrderQuote,
  OrderResult,
  Product,
  PromotionSession,
  RecipientForm,
  SiteSettings,
} from "../lib/types";

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

const defaultSiteSettings: SiteSettings = {
  bannerButtonText: "Xem thêm",
  bannerEyebrow: "ROSA PERFUME",
  bannerImageUrl: null,
  bannerSubtitle: "Khám phá bộ sưu tập đang có sẵn. Giá ưu đãi sẽ tự áp dụng khi số điện thoại đủ điều kiện.",
  bannerTitle: "Wear the Story of Every Moment with Distinction",
  logoImageUrl: null,
  logoText: "ROSA PERFUME",
  updatedAt: "",
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
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSiteSettings);

  useEffect(() => {
    setCartItems(readCart(globalThis.localStorage));
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadSiteSettings(): Promise<void> {
      try {
        const settings = await fetchSiteSettings();
        if (!cancelled) {
          setSiteSettings(settings);
        }
      } catch {
        if (!cancelled) {
          setSiteSettings(defaultSiteSettings);
        }
      }
    }
    void loadSiteSettings();
    return () => {
      cancelled = true;
    };
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

  function addToCart(productId: string, quantity = 1): void {
    const current = cartItems.find((item) => item.productId === productId)?.quantity ?? 0;
    setCartItems(setCartQuantity(cartItems, productId, current + quantity));
  }

  function buyNow(productId: string, quantity: number): void {
    setCartItems((currentItems) => {
      const current = currentItems.find((item) => item.productId === productId)?.quantity ?? 0;
      return setCartQuantity(currentItems, productId, current + quantity);
    });
    setSelectedProduct(null);
    setCartOpen(false);
    setOrderError(null);
    setStep("checkout");
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

  function goHome(): void {
    setSelectedProduct(null);
    setCartOpen(false);
    setOrderError(null);
    setStep(promotionSession ? "catalog" : "intro");
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
      <AnnouncementBar />
      <ShopHeader
        cartQuantity={totals.totalQuantity}
        cartTotal={totals.payableAmount ?? totals.subtotal - totals.discountAmount}
        searchTerm={searchTerm}
        siteSettings={siteSettings}
        onCartClick={() => {
          setCartOpen(true);
        }}
        onHome={goHome}
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
          onBuyNow={buyNow}
          onHome={goHome}
          promotionUnlocked={promotionSession?.eligible === true}
          quantity={cartItems.find((item) => item.productId === selectedProduct.id)?.quantity ?? 0}
        />
      ) : null}

      {step === "catalog" && !selectedProduct ? (
        <ShopHome
          filteredProducts={filteredProducts}
          orderError={orderError}
          products={products}
          productsError={productsError}
          productsLoading={productsLoading}
          promotionUnlocked={promotionSession?.eligible === true}
          siteSettings={siteSettings}
          onDetail={setSelectedProduct}
        />
      ) : null}

      {step === "checkout" ? (
        <CheckoutView
          errors={recipientErrors}
          form={recipient}
          orderError={orderError}
          submitting={submitting}
          totals={totals}
          onBack={() => {
            setStep("catalog");
          }}
          onChange={(field, value) => {
            setRecipient({ ...recipient, [field]: value });
          }}
          onReview={() => {
            void reviewOrder();
          }}
        />
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

function AnnouncementBar(): React.ReactElement {
  return (
    <div className="announcement-bar" aria-label="Ưu đãi cửa hàng">
      <div>
        {Array.from({ length: 5 }).map((_, index) => (
          <span key={index}>
            Giảm ngay cho khách có ưu đãi <em>FreeShip theo xác nhận đơn hàng</em>
          </span>
        ))}
      </div>
    </div>
  );
}

function ShopHeader({
  cartQuantity,
  cartTotal,
  onCartClick,
  onHome,
  onSearchChange,
  searchTerm,
  siteSettings,
}: {
  cartQuantity: number;
  cartTotal: number;
  onCartClick: () => void;
  onHome: () => void;
  onSearchChange: (value: string) => void;
  searchTerm: string;
  siteSettings: SiteSettings;
}): React.ReactElement {
  const logoText = siteSettings.logoText.trim() || "ROSA PERFUME";
  const logoImage = siteSettings.logoImageUrl ?? "/placeholder-logo.png";

  return (
    <header className="shop-header">
      <button className="brand-lockup" type="button" aria-label="Về trang chính" onClick={onHome}>
        <img src={logoImage} alt="" />
        <span>{logoText}</span>
      </button>
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

function ShopHome({
  filteredProducts,
  onDetail,
  orderError,
  products,
  productsError,
  productsLoading,
  promotionUnlocked,
  siteSettings,
}: {
  filteredProducts: Product[];
  onDetail: (product: Product) => void;
  orderError: string | null;
  products: Product[];
  productsError: string | null;
  productsLoading: boolean;
  promotionUnlocked: boolean;
  siteSettings: SiteSettings;
}): React.ReactElement {
  const heroProduct = products[0] ?? null;
  const heroImage = siteSettings.bannerImageUrl ?? (heroProduct ? productImage(heroProduct) : null);
  const storyImages = products.slice(0, 8).flatMap((product) => {
    const image = productImage(product);
    return image ? [{ image, name: product.name, product }] : [];
  });
  return (
    <>
      <section className="home-hero" aria-labelledby="home-hero-title">
        <div className="home-hero-media">
          {heroImage ? (
            <img src={heroImage} alt={siteSettings.bannerTitle} />
          ) : (
            <span className="image-placeholder" aria-hidden="true">
              R
            </span>
          )}
        </div>
        <div className="home-hero-copy">
          <p>{siteSettings.bannerEyebrow}</p>
          <h1 id="home-hero-title">{siteSettings.bannerTitle}</h1>
          <span>{siteSettings.bannerSubtitle}</span>
          <button
            type="button"
            onClick={() => {
              document.getElementById("catalog-title")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            {siteSettings.bannerButtonText}
          </button>
        </div>
      </section>

      {storyImages.length > 0 ? (
        <section className="home-story-strip" aria-label="Bộ sưu tập nổi bật">
          {storyImages.map((item) => (
            <button
              key={item.product.id}
              type="button"
              onClick={() => {
                onDetail(item.product);
              }}
            >
              <img src={item.image} alt={item.name} />
            </button>
          ))}
        </section>
      ) : null}

      <section className="shop-section home-trending" aria-labelledby="catalog-title">
        <div className="home-section-heading">
          <h2 id="catalog-title">⚡Trending now</h2>
          <span>{filteredProducts.length} sản phẩm</span>
        </div>
        {productsLoading ? <p className="status">Đang tải sản phẩm...</p> : null}
        {productsError ? <p className="status error">{productsError}</p> : null}
        {!productsLoading && !productsError && products.length === 0 ? (
          <p className="empty-state">Hiện chưa có sản phẩm khả dụng.</p>
        ) : null}
        {!productsLoading && !productsError && products.length > 0 && filteredProducts.length === 0 ? (
          <p className="empty-state">Không tìm thấy sản phẩm phù hợp.</p>
        ) : null}
        <div className="product-list">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} promotionUnlocked={promotionUnlocked} onDetail={onDetail} />
          ))}
        </div>
        {orderError ? <p className="status error">{orderError}</p> : null}
      </section>
    </>
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

function productImage(product: Product): string | null {
  return product.imageUrl ?? product.images[0]?.imageUrl ?? product.colorVariants[0]?.imageUrl ?? null;
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

function CheckoutView({
  errors,
  form,
  onBack,
  onChange,
  onReview,
  orderError,
  submitting,
  totals,
}: {
  errors: Partial<Record<keyof RecipientForm, string>>;
  form: RecipientForm;
  onBack: () => void;
  onChange: (field: keyof RecipientForm, value: string) => void;
  onReview: () => void;
  orderError: string | null;
  submitting: boolean;
  totals: CartTotals;
}): React.ReactElement {
  return (
    <section className="checkout-shell" aria-labelledby="checkout-title">
      <div className="checkout-main">
        <div className="checkout-brand">ROSA PERFUME</div>
        <nav className="checkout-steps" aria-label="Tiến trình thanh toán">
          <span>Giỏ hàng</span>
          <span aria-hidden="true">/</span>
          <strong>Thông tin</strong>
          <span aria-hidden="true">/</span>
          <span>Hoàn tất</span>
        </nav>
        <h1 id="checkout-title">Thông tin giao hàng</h1>
        <RecipientFields errors={errors} form={form} onChange={onChange} />
        {orderError ? <p className="status error">{orderError}</p> : null}
        <div className="checkout-actions">
          <button className="checkout-back-button" type="button" onClick={onBack}>
            <ArrowLeft aria-hidden="true" size={17} />
            Tiếp tục mua hàng
          </button>
          <button className="checkout-primary-button" disabled={submitting} type="button" onClick={onReview}>
            {submitting ? "Đang lấy báo giá..." : "Tiếp tục thanh toán"}
          </button>
        </div>
      </div>

      <aside className="checkout-sidebar" aria-label="Tóm tắt đơn hàng">
        <div className="checkout-line-items">
          {totals.lines.map((line) => {
            const imageUrl = line.product.imageUrl ?? line.product.images[0]?.imageUrl;
            return (
              <div className="checkout-line-item" key={line.product.id}>
                <div className="checkout-line-image">
                  {imageUrl ? (
                    <img src={imageUrl} alt={line.product.name} />
                  ) : (
                    <span aria-hidden="true">{line.product.name.slice(0, 1).toUpperCase()}</span>
                  )}
                  <em>{line.quantity}</em>
                </div>
                <div>
                  <strong>{line.product.name}</strong>
                  <span>{line.product.sku}</span>
                </div>
                <p>{formatVnd(line.lineTotal)}</p>
              </div>
            );
          })}
        </div>
        <OrderSummary totals={totals} />
      </aside>
    </section>
  );
}

function ProductDetail({
  onAdd,
  onBack,
  onBuyNow,
  onHome,
  product,
  promotionUnlocked,
  quantity,
}: {
  onAdd: (productId: string, quantity?: number) => void;
  onBack: () => void;
  onBuyNow: (productId: string, quantity: number) => void;
  onHome: () => void;
  product: Product;
  promotionUnlocked: boolean;
  quantity: number;
}): React.ReactElement {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(product.colorVariants[0]?.id ?? null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  useEffect(() => {
    setSelectedVariantId(product.colorVariants[0]?.id ?? null);
    setSelectedQuantity(1);
  }, [product.id]);

  const listedPrice = parseVnd(product.listedPrice);
  const discount = promotionUnlocked && product.isPromotionEligible ? Math.min(parseVnd(product.discountAmount), listedPrice) : 0;
  const finalPrice = listedPrice - discount;
  const selectedVariant = product.colorVariants.find((variant) => variant.id === selectedVariantId) ?? product.colorVariants[0] ?? null;
  const galleryImages = buildProductGallery(product, selectedVariant?.id ?? null);
  const fallbackImageUrl = selectedVariant?.imageUrl ?? product.imageUrl ?? product.images[0]?.imageUrl ?? null;
  const imageUrl = selectedImageUrl ?? fallbackImageUrl;

  useEffect(() => {
    setSelectedImageUrl(fallbackImageUrl);
  }, [fallbackImageUrl, product.id]);

  const trimmedDescription = product.description?.trim();
  const description =
    trimmedDescription && trimmedDescription.length > 0 ? trimmedDescription : "Sản phẩm đang được cập nhật mô tả.";
  const detailRows = buildProductDetailRows(description);

  function addSelectedQuantityToCart(): void {
    onAdd(product.id, selectedQuantity);
  }

  return (
    <section aria-labelledby="detail-title" className="nik-product-page">
      <div className="nik-product-gallery">
        <button className="nik-back-button" type="button" onClick={onBack}>
          <ArrowLeft aria-hidden="true" size={18} />
          Cửa hàng
        </button>
        <div className="nik-product-media">
          {discount > 0 ? <span className="nik-sale-badge">Sale off</span> : null}
          {imageUrl ? (
            <img src={imageUrl} alt={selectedVariant?.name ?? product.name} />
          ) : (
            <span className="image-placeholder" aria-hidden="true">
              {product.name.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        {galleryImages.length > 1 ? (
          <div className="nik-product-thumbs" aria-label="Ảnh sản phẩm">
            {galleryImages.map((image) => (
              <button
                key={image.id}
                className={image.imageUrl === imageUrl ? "nik-product-thumb selected" : "nik-product-thumb"}
                type="button"
                onClick={() => {
                  setSelectedImageUrl(image.imageUrl);
                }}
              >
                <img src={image.imageUrl} alt={image.altText} />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <aside className="nik-product-info">
        <nav className="nik-breadcrumb" aria-label="Điều hướng sản phẩm">
          <button type="button" onClick={onHome}>
            Trang chủ
          </button>
          <span>/</span> Cửa hàng <span>/</span> <strong>{product.name}</strong>
        </nav>
        <p className="nik-product-kicker">{selectedVariant?.name ?? product.sku}</p>
        <h2 id="detail-title" className="nik-product-title">
          {product.name}
        </h2>

        <div className="nik-product-price">
          {discount > 0 ? <span>{formatVnd(listedPrice)}</span> : null}
          <strong>{formatVnd(finalPrice)}</strong>
        </div>

        {product.colorVariants.length > 0 ? (
          <div className="nik-option-group" aria-label="Màu sản phẩm">
            <div className="nik-option-heading">
              <h3>Màu khác</h3>
              {selectedVariant ? <span>{selectedVariant.name}</span> : null}
            </div>
            <div className="nik-color-grid">
              {product.colorVariants.map((variant) => (
                <button
                  key={variant.id}
                  className={variant.id === selectedVariant?.id ? "nik-color-option selected" : "nik-color-option"}
                  type="button"
                  title={variant.name}
                  onClick={() => {
                    setSelectedVariantId(variant.id);
                    setSelectedImageUrl(variant.imageUrl);
                  }}
                >
                  <img src={variant.imageUrl} alt={variant.name} />
                  <span style={{ background: variant.colorCode ?? "#f2f2f2" }} />
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="nik-purchase-panel">
          <div className="nik-quantity-row">
            <span>Số lượng</span>
            <div className="nik-quantity-control">
              <button
                type="button"
                aria-label="Giảm số lượng"
                onClick={() => {
                  setSelectedQuantity((current) => Math.max(1, current - 1));
                }}
              >
                -
              </button>
              <output aria-label="Số lượng đã chọn">{selectedQuantity}</output>
              <button
                type="button"
                aria-label="Tăng số lượng"
                onClick={() => {
                  setSelectedQuantity((current) => Math.min(99, current + 1));
                }}
              >
                +
              </button>
            </div>
          </div>
          <button
            className="nik-add-button"
            type="button"
            onClick={() => {
              addSelectedQuantityToCart();
            }}
          >
            {quantity > 0 ? `Thêm vào giỏ (${quantity} sản phẩm)` : "Thêm vào giỏ hàng"}
          </button>
          <button
            className="nik-buy-button"
            type="button"
            onClick={() => {
              onBuyNow(product.id, selectedQuantity);
            }}
          >
            Mua ngay
          </button>
        </div>

        <details className="nik-accordion" open>
          <summary>Mô tả</summary>
          <div>
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
        </details>
      </aside>
    </section>
  );
}

function buildProductGallery(
  product: Product,
  selectedVariantId: string | null,
): { id: string; imageUrl: string; altText: string }[] {
  const selectedVariant = product.colorVariants.find((variant) => variant.id === selectedVariantId);
  const images = [
    ...(selectedVariant
      ? [{ id: `variant-${selectedVariant.id}`, imageUrl: selectedVariant.imageUrl, altText: selectedVariant.name }]
      : []),
    ...(product.imageUrl ? [{ id: "main", imageUrl: product.imageUrl, altText: product.name }] : []),
    ...product.images.map((image) => ({
      id: `image-${image.id}`,
      imageUrl: image.imageUrl,
      altText: image.altText ?? product.name,
    })),
    ...product.colorVariants
      .filter((variant) => variant.id !== selectedVariantId)
      .map((variant) => ({
        id: `variant-${variant.id}`,
        imageUrl: variant.imageUrl,
        altText: variant.name,
      })),
  ];
  const seen = new Set<string>();
  return images.filter((image) => {
    if (seen.has(image.imageUrl)) {
      return false;
    }
    seen.add(image.imageUrl);
    return true;
  });
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
