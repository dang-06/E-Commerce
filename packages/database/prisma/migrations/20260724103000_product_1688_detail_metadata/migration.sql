ALTER TABLE "products"
ADD COLUMN "seller_name" VARCHAR(255),
ADD COLUMN "seller_years" INTEGER,
ADD COLUMN "seller_primary_category" VARCHAR(255),
ADD COLUMN "minimum_order_quantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "shipping_origin" VARCHAR(255),
ADD COLUMN "shipping_lead_time" VARCHAR(120),
ADD COLUMN "return_policy" VARCHAR(255),
ADD COLUMN "review_rating" DECIMAL(3, 2),
ADD COLUMN "review_count" INTEGER,
ADD COLUMN "review_tags" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "review_image_urls" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "quality_certifications" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "packaging_attributes" JSONB NOT NULL DEFAULT '[]';
