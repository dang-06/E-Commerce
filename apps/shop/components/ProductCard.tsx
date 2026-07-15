import { parseVnd } from "../lib/money";
import type { Product } from "../lib/types";
import { PriceBlock } from "./PriceBlock";

export function ProductCard({
  onAdd,
  onDetail,
  product,
  promotionUnlocked,
  quantity,
}: {
  onAdd: (productId: string) => void;
  onDetail: (product: Product) => void;
  product: Product;
  promotionUnlocked: boolean;
  quantity: number;
}): React.ReactElement {
  const listedPrice = parseVnd(product.listedPrice);
  const discountPerItem =
    promotionUnlocked && product.isPromotionEligible ? Math.min(parseVnd(product.discountAmount), listedPrice) : 0;
  const imageUrl = product.imageUrl ?? product.images[0]?.imageUrl;

  return (
    <article className="product-card">
      <button
        aria-label={`Xem chi tiết ${product.name}`}
        className="image-button"
        type="button"
        onClick={() => {
          onDetail(product);
        }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} loading="lazy" />
        ) : (
          <span className="image-placeholder" aria-hidden="true">
            {product.name.slice(0, 1).toUpperCase()}
          </span>
        )}
      </button>
      <div className="product-info">
        <p className="sku">{product.sku}</p>
        <h3>{product.name}</h3>
        <PriceBlock
          discountPerItem={discountPerItem}
          finalUnitPrice={listedPrice - discountPerItem}
          listedPrice={listedPrice}
        />
        <div className="product-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              onDetail(product);
            }}
          >
            Chi tiết
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={() => {
              onAdd(product.id);
            }}
          >
            {quantity > 0 ? `Đã chọn ${quantity}` : "Thêm"}
          </button>
        </div>
      </div>
    </article>
  );
}
