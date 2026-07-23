ALTER TABLE "site_settings"
ALTER COLUMN "banner_eyebrow" SET DEFAULT 'Cửa hàng',
ALTER COLUMN "logo_text" SET DEFAULT 'Cửa hàng';

UPDATE "site_settings"
SET
  "banner_eyebrow" = CASE WHEN "banner_eyebrow" = 'ROSA PERFUME' THEN 'Cửa hàng' ELSE "banner_eyebrow" END,
  "logo_text" = CASE WHEN "logo_text" = 'ROSA PERFUME' THEN 'Cửa hàng' ELSE "logo_text" END,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "banner_eyebrow" = 'ROSA PERFUME'
   OR "logo_text" = 'ROSA PERFUME';
