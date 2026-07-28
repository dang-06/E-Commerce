"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Search, ShoppingCart, Star } from "lucide-react";
import { IntroVideoPlayer } from "../../../components/IntroVideoPlayer";
import { fetchProductBySlug, fetchProducts, fetchSiteSettings } from "../../../lib/api";
import { readCart, setCartQuantity, writeCart } from "../../../lib/cart";
import { formatVnd, parseVnd } from "../../../lib/money";
import { readPromotionSession } from "../../../lib/promotion-session";
import type { CartItem, Product, PromotionSession, SiteSettings } from "../../../lib/types";

const emptySiteSettings: SiteSettings = {
  bannerButtonText: "",
  bannerEyebrow: "",
  bannerImageUrl: null,
  bannerSubtitle: "",
  bannerTitle: "",
  catalogTitle: "Sản phẩm",
  logoImageUrl: null,
  logoText: "",
  updatedAt: "",
};

export default function ProductRoutePage(): React.ReactElement {
  const params = useParams() as Record<string, unknown>;
  const slugParam = params.slug;
  const slug =
    typeof slugParam === "string"
      ? slugParam
      : Array.isArray(slugParam) && typeof slugParam[0] === "string"
        ? slugParam[0]
        : "";
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(emptySiteSettings);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const [promotionSession, setPromotionSession] = useState<PromotionSession | null>(null);

  useEffect(() => {
    setCartItems(readCart(globalThis.localStorage));
    setPromotionSession(readPromotionSession(globalThis.localStorage));
  }, []);

  useEffect(() => {
    function syncPromotionSession(): void {
      setPromotionSession(readPromotionSession(globalThis.localStorage));
    }

    globalThis.addEventListener("promotion-session-updated", syncPromotionSession);
    return () => {
      globalThis.removeEventListener("promotion-session-updated", syncPromotionSession);
    };
  }, []);

  useEffect(() => {
    writeCart(globalThis.localStorage, cartItems);
  }, [cartItems]);

  useEffect(() => {
    let cancelled = false;
    async function loadDetail(): Promise<void> {
      setLoading(true);
      setError(null);
      try {
        const [detail, list, settings] = await Promise.all([
          fetchProductBySlug(slug),
          fetchProducts(),
          fetchSiteSettings().catch(() => emptySiteSettings),
        ]);
        if (cancelled) {
          return;
        }
        setProduct(detail);
        setProducts(list);
        setSiteSettings(settings);
        setSelectedVariantId(detail.colorVariants[0]?.id ?? null);
        setSelectedImageUrl(productImage(detail));
      } catch {
        if (!cancelled) {
          setError("Không tải được chi tiết sản phẩm.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void loadDetail();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const selectedVariant = product?.colorVariants.find((variant) => variant.id === selectedVariantId) ?? null;
  const galleryImages = product ? buildProductGallery(product, selectedVariant?.id ?? null) : [];
  const imageUrl = selectedImageUrl ?? selectedVariant?.imageUrl ?? (product ? productImage(product) : null);
  const relatedProducts = product
    ? products.filter((item) => item.id !== product.id).slice(0, 8)
    : [];
  const cartQuantity = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems],
  );

  function addSelectedQuantityToCart(): void {
    if (!product) {
      return;
    }
    setCartItems((currentItems) => {
      const current = currentItems.find((item) => item.productId === product.id)?.quantity ?? 0;
      return setCartQuantity(currentItems, product.id, current + selectedQuantity);
    });
    setCartNotice("Đã thêm vào giỏ hàng.");
  }

  function buyNow(): void {
    if (!product) {
      return;
    }
    const current = cartItems.find((item) => item.productId === product.id)?.quantity ?? 0;
    const nextItems = setCartQuantity(cartItems, product.id, current + selectedQuantity);
    writeCart(globalThis.localStorage, nextItems);
    globalThis.location.href = "/?checkout=1";
  }

  if (loading) {
    return (
      <main className="app-shell">
        <ProductRouteHeader cartQuantity={cartQuantity} siteSettings={siteSettings} />
        <section className="shop-section">
          <p className="status">Đang tải chi tiết sản phẩm...</p>
        </section>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="app-shell">
        <ProductRouteHeader cartQuantity={cartQuantity} siteSettings={siteSettings} />
        <section className="shop-section">
          <p className="status error">{error ?? "Không tìm thấy sản phẩm."}</p>
          <Link className="secondary-button" href="/">
            Về cửa hàng
          </Link>
        </section>
      </main>
    );
  }

  const listedPrice = parseVnd(product.listedPrice);
  const detailRows =
    product.productAttributes.length > 0
      ? product.productAttributes
      : [{ label: "Mô tả", value: product.description ?? "Sản phẩm đang được cập nhật mô tả." }];
  const detailImageUrls = product.detailImageUrls.filter((item) => item.trim().length > 0);
  const discount =
    promotionSession?.eligible === true && product.isPromotionEligible
      ? Math.min(parseVnd(product.discountAmount), listedPrice)
      : 0;
  const finalPrice = listedPrice - discount;

  return (
    <main className="app-shell">
      <ProductRouteHeader cartQuantity={cartQuantity} siteSettings={siteSettings} />
      <section aria-labelledby="detail-title" className="nik-product-page">
        <div className="nik-product-gallery">
          <div className="nik-product-media">
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
                  className={
                    image.imageUrl === imageUrl ? "nik-product-thumb selected" : "nik-product-thumb"
                  }
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
            <Link href="/">Trang chủ</Link>
            <span>/</span> <strong>{product.name}</strong>
          </nav>
          <p className="nik-product-kicker">{selectedVariant?.name ?? product.sku}</p>
          <h1 id="detail-title" className="nik-product-title">
            {product.name}
          </h1>
          <p className="nik-product-meta">
            {[product.sellerName, product.sellerPrimaryCategory].find(
              (value): value is string => typeof value === "string" && value.trim().length > 0,
            ) ?? "Sản phẩm chính hãng"}
          </p>

          <div className="nik-product-price-panel">
            <div className="nik-price-row">
              <span>Giá bán</span>
              <strong>{formatVnd(finalPrice)}</strong>
            </div>
            {discount > 0 ? (
              <div className="nik-price-row nik-listed-price-row">
                <span>Giá gốc</span>
                <del>{formatVnd(listedPrice)}</del>
              </div>
            ) : null}
            <p className="nik-moq-line">Tối thiểu {product.minimumOrderQuantity} sản phẩm.</p>
            <div className="nik-policy-strip">
              {product.returnPolicy ? <span>{product.returnPolicy}</span> : null}
              {product.shippingLeadTime ? <span>{product.shippingLeadTime}</span> : null}
              {product.shippingOrigin ? <span>Gửi hàng từ {product.shippingOrigin}</span> : null}
            </div>
          </div>

          {product.colorVariants.length > 0 ? (
            <div className="nik-option-group" aria-label="Màu sản phẩm">
              <div className="nik-option-heading">
                <h3>Loại khác</h3>
                {selectedVariant ? <span>{selectedVariant.name}</span> : null}
              </div>
              <div className="nik-color-grid">
                {product.colorVariants.map((variant) => (
                  <button
                    key={variant.id}
                    className={
                      variant.id === selectedVariantId
                        ? "nik-color-option selected"
                        : "nik-color-option"
                    }
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
            <button className="nik-buy-button" type="button" onClick={buyNow}>
              Đặt hàng ngay
            </button>
            <button className="nik-add-button" type="button" onClick={addSelectedQuantityToCart}>
              Thêm vào giỏ hàng
            </button>
          </div>
          {cartNotice ? <p className="status success">{cartNotice}</p> : null}
        </aside>

        <section className="nik-detail-content" aria-label="Mô tả sản phẩm">
          {product.introVideoUrls.length > 0 ? (
            <section className="nik-video-section" aria-label="Video giới thiệu sản phẩm">
              <div className="nik-detail-heading">
                <h3>Video giới thiệu</h3>
                <span>{product.introVideoUrls.length} video</span>
              </div>
              <div className="nik-video-grid">
                {product.introVideoUrls.slice(0, 2).map((videoUrl, index) => (
                  <IntroVideoPlayer
                    key={`${videoUrl}-${index}`}
                    title={`${product.name} video ${index + 1}`}
                    videoUrl={videoUrl}
                  />
                ))}
              </div>
            </section>
          ) : null}
          <ReviewSection product={product} />
          <section className="nik-attributes-panel" aria-label="Thuộc tính sản phẩm">
            <h3>Thuộc tính sản phẩm</h3>
            <div>
              {detailRows.map((row) => (
                <p key={row.label}>
                  <span>{row.label}</span>
                  <strong>{row.value}</strong>
                </p>
              ))}
            </div>
          </section>
          {product.description ? <p className="nik-detail-description">{product.description}</p> : null}
          {detailImageUrls.length > 0 ? (
            <div className="nik-detail-images">
              {detailImageUrls.map((detailImageUrl, index) => (
                <img
                  key={`${detailImageUrl}-${index}`}
                  src={detailImageUrl}
                  alt={`${product.name} chi tiết ${index + 1}`}
                />
              ))}
            </div>
          ) : null}
          {relatedProducts.length > 0 ? (
            <section className="nik-related-section" aria-label="Đề xuất sản phẩm">
              <div className="nik-detail-heading">
                <h3>Đề xuất theo cùng một phong cách</h3>
                <span>{relatedProducts.length} sản phẩm</span>
              </div>
              <div className="nik-related-grid">
                {relatedProducts.map((relatedProduct) => {
                  const relatedImage = productImage(relatedProduct);
                  return (
                    <Link key={relatedProduct.id} href={`/products/${relatedProduct.slug}`}>
                      {relatedImage ? <img src={relatedImage} alt={relatedProduct.name} /> : null}
                      <strong>{relatedProduct.name}</strong>
                      <span>{formatVnd(parseVnd(relatedProduct.listedPrice))}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ) : null}
        </section>
      </section>
    </main>
  );
}

function ProductRouteHeader({
  cartQuantity,
  siteSettings,
}: {
  cartQuantity: number;
  siteSettings: SiteSettings;
}): React.ReactElement {
  const logoText = displayBrandName(siteSettings);
  const [searchOpen, setSearchOpen] = useState(false);
  return (
    <header className={searchOpen ? "shop-header search-open" : "shop-header"}>
      <div className="lux-header-bar">
        <div className="lux-header-left">
          <Link className="lux-header-action" href="/">
            <span>Menu</span>
          </Link>
          <button
            className="lux-header-action"
            type="button"
            aria-expanded={searchOpen}
            aria-controls="product-search-panel"
            onClick={() => {
              setSearchOpen((open) => !open);
            }}
          >
            <Search aria-hidden="true" size={28} />
            <span>Search</span>
          </button>
        </div>

        <Link className="lux-brand" href="/">
          {siteSettings.logoImageUrl ? <img src={siteSettings.logoImageUrl} alt="" /> : null}
          <span>{logoText}</span>
        </Link>

        <div className="lux-header-right">
          <a className="lux-contact-link" href="tel:0901234567">
            Contact us
          </a>
          <Link className="lux-cart-button" href="/?checkout=1" aria-label={`${cartQuantity} sản phẩm trong giỏ`}>
            <ShoppingCart aria-hidden="true" size={23} />
            {cartQuantity > 0 ? <em>{cartQuantity}</em> : null}
          </Link>
        </div>
      </div>
      <div className="lux-search-panel" id="product-search-panel" aria-hidden={!searchOpen}>
        <label className="lux-search-field">
          <span>Search on {logoText}</span>
          <input placeholder="Về cửa hàng để tìm sản phẩm" readOnly />
        </label>
        <Link className="lux-search-close" href="/">
          Search
        </Link>
      </div>
    </header>
  );
}

function ReviewSection({ product }: { product: Product }): React.ReactElement | null {
  if (
    product.reviewRating === null &&
    product.reviewTags.length === 0 &&
    product.reviewImageUrls.length === 0 &&
    !hasReviewSample(product)
  ) {
    return null;
  }
  return (
    <section className="nik-review-section" aria-label="Đánh giá sản phẩm">
      <div className="nik-review-header">
        <h3>Đánh giá sản phẩm</h3>
        <div className="nik-review-score">
          <ReviewStars rating={product.reviewRating ?? 0} />
          {product.reviewRating !== null ? <strong>{product.reviewRating.toFixed(1)}</strong> : null}
          <span>({product.reviewCount ?? 0} đánh giá)</span>
        </div>
      </div>
      {product.reviewTags.length > 0 ? (
        <div className="nik-review-tags">
          {product.reviewTags.map((tag) => (
            <span key={`${tag.label}-${tag.value}`}>
              {tag.label} <strong>{tag.value}</strong>
            </span>
          ))}
        </div>
      ) : null}
      {hasReviewSample(product) ? (
        <article className="nik-review-sample">
          <div className="nik-review-buyer">
            {product.reviewSample.buyerAvatarUrl ? (
              <img src={product.reviewSample.buyerAvatarUrl} alt="" />
            ) : (
              <span aria-hidden="true">
                {(product.reviewSample.buyerName.trim() || "A").slice(0, 1).toUpperCase()}
              </span>
            )}
            <strong>{product.reviewSample.buyerName.trim() || "Ẩn danh mua"}</strong>
            {product.reviewSample.purchasedSummary ? (
              <>
                <i aria-hidden="true" />
                <em>{product.reviewSample.purchasedSummary}</em>
              </>
            ) : null}
          </div>
          {product.reviewSample.content ? <p>{product.reviewSample.content}</p> : null}
        </article>
      ) : null}
      {product.reviewImageUrls.length > 0 ? (
        <div className="nik-review-images">
          {product.reviewImageUrls.map((reviewImageUrl, index) => (
            <figure key={`${reviewImageUrl}-${index}`}>
              {index === 0 && product.reviewSample.imageBadge ? (
                <figcaption>{product.reviewSample.imageBadge}</figcaption>
              ) : null}
              <img src={reviewImageUrl} alt={`${product.name} đánh giá ${index + 1}`} />
            </figure>
          ))}
        </div>
      ) : null}
      <button className="nik-review-more-button" type="button">
        Xem tất cả đánh giá
      </button>
    </section>
  );
}

function hasReviewSample(product: Product): boolean {
  return [
    product.reviewSample.buyerName,
    product.reviewSample.buyerAvatarUrl ?? "",
    product.reviewSample.purchasedSummary,
    product.reviewSample.content,
    product.reviewSample.imageBadge,
  ].some((value) => value.trim().length > 0);
}

function ReviewStars({ rating }: { rating: number }): React.ReactElement {
  return (
    <span className="nik-review-stars" aria-label={`${rating.toFixed(1)} trên 5 sao`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          aria-hidden="true"
          className={index < Math.round(rating) ? "filled" : undefined}
          key={index}
          size={20}
        />
      ))}
    </span>
  );
}

function buildProductGallery(
  product: Product,
  selectedVariantId: string | null,
): { id: string; imageUrl: string; altText: string }[] {
  const selectedVariant = product.colorVariants.find((variant) => variant.id === selectedVariantId);
  return uniqueImages([
    ...(selectedVariant
      ? [
          {
            id: `variant-${selectedVariant.id}`,
            imageUrl: selectedVariant.imageUrl,
            altText: selectedVariant.name,
          },
        ]
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
  ]);
}

function uniqueImages(
  images: { id: string; imageUrl: string; altText: string }[],
): { id: string; imageUrl: string; altText: string }[] {
  const seen = new Set<string>();
  return images.filter((image) => {
    if (!image.imageUrl || seen.has(image.imageUrl)) {
      return false;
    }
    seen.add(image.imageUrl);
    return true;
  });
}

function productImage(product: Product): string | null {
  return product.imageUrl ?? product.images[0]?.imageUrl ?? product.colorVariants[0]?.imageUrl ?? null;
}

function displayBrandName(siteSettings: SiteSettings): string {
  return siteSettings.logoText || "Rosa";
}
