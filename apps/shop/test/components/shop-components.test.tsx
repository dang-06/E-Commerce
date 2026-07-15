import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { OrderSummary } from "../../components/OrderSummary";
import { PriceBlock } from "../../components/PriceBlock";
import { ProductCard } from "../../components/ProductCard";
import { calculateCartTotals } from "../../lib/pricing";
import { sampleProduct } from "../fixtures";

void test("PriceBlock renders listed price, promotion price and saving", () => {
  const html = renderToStaticMarkup(
    <PriceBlock discountPerItem={25000} finalUnitPrice={74000} listedPrice={99000} />,
  );

  assert.match(html, /99\.000/);
  assert.match(html, /74\.000/);
  assert.match(html, /Tiết kiệm/);
});

void test("ProductCard exposes accessible actions without hard-coded catalog data", () => {
  const product = sampleProduct({ name: "Nước hoa thử nghiệm", sku: "TEST-1" });
  const html = renderToStaticMarkup(
    <ProductCard
      product={product}
      promotionUnlocked={true}
      quantity={0}
      onAdd={() => undefined}
      onDetail={() => undefined}
    />,
  );

  assert.match(html, /Nước hoa thử nghiệm/);
  assert.match(html, /aria-label="Xem chi tiết/);
  assert.match(html, /Thêm/);
});

void test("OrderSummary renders live totals and unknown shipping state", () => {
  const product = sampleProduct();
  const totals = calculateCartTotals([product], [{ productId: product.id, quantity: 2 }], true, null);
  const html = renderToStaticMarkup(<OrderSummary totals={totals} />);

  assert.match(html, /Tổng giá gốc/);
  assert.match(html, /198\.000/);
  assert.match(html, /50\.000/);
  assert.match(html, /Chờ xác nhận phí vận chuyển/);
});
