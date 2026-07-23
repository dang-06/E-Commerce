ALTER TABLE "site_settings"
ALTER COLUMN "banner_eyebrow" DROP DEFAULT,
ALTER COLUMN "banner_title" DROP DEFAULT,
ALTER COLUMN "banner_subtitle" DROP DEFAULT,
ALTER COLUMN "banner_button_text" DROP DEFAULT,
ALTER COLUMN "logo_text" DROP DEFAULT;

UPDATE "site_settings"
SET
  "banner_eyebrow" = CASE WHEN "banner_eyebrow" = 'Cửa hàng' THEN '' ELSE "banner_eyebrow" END,
  "banner_title" = CASE WHEN "banner_title" = 'Wear the Story of Every Moment with Distinction' THEN '' ELSE "banner_title" END,
  "banner_subtitle" = CASE
    WHEN "banner_subtitle" = 'Khám phá bộ sưu tập đang có sẵn. Giá ưu đãi sẽ tự áp dụng khi số điện thoại đủ điều kiện.' THEN ''
    ELSE "banner_subtitle"
  END,
  "banner_button_text" = CASE WHEN "banner_button_text" = 'Xem thêm' THEN '' ELSE "banner_button_text" END,
  "logo_text" = CASE WHEN "logo_text" = 'Cửa hàng' THEN '' ELSE "logo_text" END,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "banner_eyebrow" = 'Cửa hàng'
   OR "banner_title" = 'Wear the Story of Every Moment with Distinction'
   OR "banner_subtitle" = 'Khám phá bộ sưu tập đang có sẵn. Giá ưu đãi sẽ tự áp dụng khi số điện thoại đủ điều kiện.'
   OR "banner_button_text" = 'Xem thêm'
   OR "logo_text" = 'Cửa hàng';
