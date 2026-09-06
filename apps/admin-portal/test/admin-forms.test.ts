import assert from "node:assert/strict";
import test from "node:test";
import { validateBannerForm } from "../lib/validation/admin-forms";

const validBannerForm = {
  bannerButtonText: "Mua ngay",
  bannerEyebrow: "Hàng chọn lọc",
  bannerImageUrl: "/products/perfume-1.png",
  bannerSubtitle: "Mô tả banner",
  bannerTitle: "Tiêu đề banner",
  catalogTitle: "Sản phẩm nổi bật",
  contactUrl: "https://example.com/contact",
  logoImageUrl: "/placeholder-logo.png",
  logoText: "NIK Studio",
};

void test("banner form accepts supported Contact us links", () => {
  for (const contactUrl of [
    "https://example.com/contact",
    "/contact",
    "mailto:support@example.com",
    "tel:0901234567",
  ]) {
    assert.equal(validateBannerForm({ ...validBannerForm, contactUrl }).contactUrl, undefined);
  }
});

void test("banner form rejects unsupported Contact us links", () => {
  const errors = validateBannerForm({ ...validBannerForm, contactUrl: "javascript:alert(1)" });
  assert.equal(errors.contactUrl, "Link Contact us phải là https://, mailto:, tel: hoặc đường dẫn bắt đầu bằng /.");
});
