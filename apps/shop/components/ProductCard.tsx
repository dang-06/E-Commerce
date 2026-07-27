import Link from "next/link";
import { formatVnd, parseVnd } from "../lib/money";
import type { Product } from "../lib/types";
import { PriceBlock } from "./PriceBlock";

export function ProductCard({
  product,
  promotionUnlocked,
}: {
  onDetail?: (product: Product) => void;
  product: Product;
  promotionUnlocked: boolean;
}): React.ReactElement {
  const listedPrice = parseVnd(product.listedPrice);
  const discountPerItem =
    promotionUnlocked && product.isPromotionEligible ? Math.min(parseVnd(product.discountAmount), listedPrice) : 0;
  const imageUrl = product.imageUrl ?? product.images[0]?.imageUrl;
  const discountLabel = discountPerItem > 0 ? `-${formatVnd(discountPerItem)}` : null;

  return (
    <article className="product-card">
      <Link
        aria-label={`Xem chi tiết ${product.name}`}
        className="image-button"
        href={`/products/${product.slug}`}
      >
        {discountLabel ? <span className="discount-badge">{discountLabel}</span> : null}
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} loading="lazy" />
        ) : (
          <span className="image-placeholder" aria-hidden="true">
            {product.name.slice(0, 1).toUpperCase()}
          </span>
        )}
      </Link>
      <div className="product-info">
        <p className="sku">{product.sku}</p>
        <h3>{product.name}</h3>
        <PriceBlock
          discountPerItem={discountPerItem}
          finalUnitPrice={listedPrice - discountPerItem}
          listedPrice={listedPrice}
        />
        {product.colorVariants.length > 0 ? (
          <div className="card-color-swatches" aria-label={`Màu của ${product.name}`}>
            {product.colorVariants.slice(0, 6).map((variant) => (
              <span
                key={variant.id}
                title={variant.name}
                style={{ background: variant.colorCode ?? "#f3f3f3" }}
              />
            ))}
          </div>
        ) : null}
        {discountPerItem > 0 ? <p className="saving-inline">Giảm {formatVnd(discountPerItem)} / sản phẩm</p> : null}
        <div className="product-actions">
          <Link
            className="secondary-button"
            href={`/products/${product.slug}`}
          >
            Chi tiết
          </Link>
        </div>
      </div>
    </article>
  );
}
