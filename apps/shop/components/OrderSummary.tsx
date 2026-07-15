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
        <div>
          <dt>Tổng giảm giá</dt>
          <dd>-{formatVnd(totals.discountAmount)}</dd>
        </div>
        <div>
          <dt>Phí vận chuyển</dt>
          <dd>{totals.shippingFee === null ? "Chờ xác nhận" : formatVnd(totals.shippingFee)}</dd>
        </div>
        <div className="summary-total">
          <dt>Tổng thanh toán</dt>
          <dd>{totals.payableAmount === null ? "Chờ xác nhận phí vận chuyển" : formatVnd(totals.payableAmount)}</dd>
        </div>
      </dl>
      <p className="summary-note">Giá hiển thị là tạm tính. Hệ thống sẽ tính lại giá chính thức khi tạo đơn.</p>
    </section>
  );
}
