import { formatVnd } from "../lib/money";

export function PriceBlock({
  discountPerItem,
  finalUnitPrice,
  listedPrice,
}: {
  discountPerItem: number;
  finalUnitPrice: number;
  listedPrice: number;
}): React.ReactElement {
  if (discountPerItem <= 0) {
    return <strong className="price-current">{formatVnd(listedPrice)}</strong>;
  }

  return (
    <div className="price-block">
      <span className="price-listed">{formatVnd(listedPrice)}</span>
      <strong className="price-current">{formatVnd(finalUnitPrice)}</strong>
    </div>
  );
}
