CREATE TABLE "product_color_variants" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "color_code" VARCHAR(20),
    "image_url" TEXT NOT NULL,
    "sku" VARCHAR(80),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "product_color_variants_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_product_color_variants_product_sort" ON "product_color_variants"("product_id", "sort_order");

ALTER TABLE "product_color_variants"
ADD CONSTRAINT "product_color_variants_product_id_fkey"
FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
