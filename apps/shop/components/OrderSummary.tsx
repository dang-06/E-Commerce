import { formatVnd } from "../lib/money";
import type { CartTotals } from "../lib/pricing";

export function OrderSummary({ totals }: { totals: CartTotals }): React.ReactElement {
  return (
    <section className="summary" aria-labelledby="summary-title">
      <h2 id="summary-title">Tóm tắt đơn hàng</h2>
      <dl>
        <div>
          <dt>Tổng sản phẩm</dt>
          <dd>{totals.totalQuantity}</dd>
        </div>
        <div>
          <dt>Tổng giá gốc</dt>
          <dd>{formatVnd(totals.subtotal)}</dd>
        </div>
        {totals.discountAmount > 0 ? (
          <div>
            <dt>Tổng giảm giá</dt>
            <dd>-{formatVnd(totals.discountAmount)}</dd>
          </div>
        ) : null}
        <div>
          <dt>Phí vận chuyển</dt>
          <dd>
            {totals.shippingFee === null
              ? "Chờ xác nhận"
              : totals.shippingFee === 0
                ? "Miễn phí"
                : formatVnd(totals.shippingFee)}
          </dd>
        </div>
        <div className="summary-total">
          <dt>Tổng thanh toán</dt>
          <dd>{totals.payableAmount === null ? "Chờ xác nhận" : formatVnd(totals.payableAmount)}</dd>
        </div>
      </dl>
      <p className="summary-note">
        Phí ship 30.000đ cho đơn 1 sản phẩm; từ 2 sản phẩm trở lên miễn phí ship.
      </p>
    </section>
  );
}
