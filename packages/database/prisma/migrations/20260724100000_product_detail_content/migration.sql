ALTER TABLE "products"
ADD COLUMN "product_attributes" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "detail_image_urls" JSONB NOT NULL DEFAULT '[]';
