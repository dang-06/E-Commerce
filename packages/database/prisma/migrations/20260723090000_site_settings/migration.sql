CREATE TABLE "site_settings" (
    "id" BIGSERIAL NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "banner_eyebrow" VARCHAR(120) NOT NULL DEFAULT 'ROSA PERFUME',
    "banner_title" VARCHAR(255) NOT NULL DEFAULT 'Wear the Story of Every Moment with Distinction',
    "banner_subtitle" VARCHAR(500) NOT NULL DEFAULT 'Khám phá bộ sưu tập đang có sẵn. Giá ưu đãi sẽ tự áp dụng khi số điện thoại đủ điều kiện.',
    "banner_button_text" VARCHAR(80) NOT NULL DEFAULT 'Xem thêm',
    "banner_image_url" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "site_settings_key_key" ON "site_settings"("key");

INSERT INTO "site_settings" (
    "key",
    "banner_eyebrow",
    "banner_title",
    "banner_subtitle",
    "banner_button_text"
) VALUES (
    'default',
    'ROSA PERFUME',
    'Wear the Story of Every Moment with Distinction',
    'Khám phá bộ sưu tập đang có sẵn. Giá ưu đãi sẽ tự áp dụng khi số điện thoại đủ điều kiện.',
    'Xem thêm'
)
ON CONFLICT ("key") DO NOTHING;
