-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('admin', 'operator');
CREATE TYPE "AdminStatus" AS ENUM ('active', 'locked');
CREATE TYPE "CustomerSource" AS ENUM ('sheet', 'pancake', 'best', 'import', 'manual');
CREATE TYPE "EligibilityReason" AS ENUM ('delivered', 'purchased', 'manual', 'imported');
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'failed');
CREATE TYPE "PaymentMethod" AS ENUM ('cod', 'bank_transfer', 'online');
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE "IntegrationName" AS ENUM ('pancake', 'sheet', 'best');
CREATE TYPE "IntegrationAction" AS ENUM ('create', 'update');
CREATE TYPE "IntegrationStatus" AS ENUM ('pending', 'processing', 'success', 'failed', 'cancelled');
CREATE TYPE "AuditAction" AS ENUM ('create', 'update', 'delete', 'login', 'retry');

-- CreateTable
CREATE TABLE "admins" (
    "id" BIGSERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(150) NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'operator',
    "status" "AdminStatus" NOT NULL DEFAULT 'active',
    "last_login_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "eligible_customers" (
    "id" BIGSERIAL NOT NULL,
    "phone_normalized" VARCHAR(20) NOT NULL,
    "phone_hash" VARCHAR(64) NOT NULL,
    "source" "CustomerSource" NOT NULL,
    "source_customer_id" VARCHAR(100),
    "eligibility_reason" "EligibilityReason" NOT NULL,
    "successful_order_at" TIMESTAMP(6),
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "usage_limit" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "imported_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    CONSTRAINT "eligible_customers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "products" (
    "id" BIGSERIAL NOT NULL,
    "sku" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "listed_price" BIGINT NOT NULL,
    "stock_quantity" INTEGER,
    "is_promotion_eligible" BOOLEAN NOT NULL DEFAULT true,
    "discount_amount" BIGINT NOT NULL DEFAULT 25000,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "deleted_at" TIMESTAMP(6),
    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_images" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "image_url" TEXT NOT NULL,
    "alt_text" VARCHAR(255),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "promotion_rules" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "discount_amount" BIGINT NOT NULL DEFAULT 25000,
    "starts_at" TIMESTAMP(6),
    "ends_at" TIMESTAMP(6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    CONSTRAINT "promotion_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "orders" (
    "id" BIGSERIAL NOT NULL,
    "order_code" VARCHAR(30) NOT NULL,
    "idempotency_key" VARCHAR(100) NOT NULL,
    "eligible_customer_id" BIGINT,
    "promotion_phone" VARCHAR(20),
    "promotion_phone_hash" VARCHAR(64),
    "is_promotion_applied" BOOLEAN NOT NULL DEFAULT false,
    "recipient_name" VARCHAR(150) NOT NULL,
    "recipient_phone" VARCHAR(20) NOT NULL,
    "province" VARCHAR(100) NOT NULL,
    "district" VARCHAR(100) NOT NULL,
    "ward" VARCHAR(100) NOT NULL,
    "address" TEXT NOT NULL,
    "total_quantity" INTEGER NOT NULL,
    "subtotal" BIGINT NOT NULL,
    "discount_amount" BIGINT NOT NULL DEFAULT 0,
    "shipping_fee" BIGINT NOT NULL DEFAULT 0,
    "total_amount" BIGINT NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL DEFAULT 'cod',
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "order_status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "pancake_order_id" VARCHAR(100),
    "shipping_order_id" VARCHAR(100),
    "note" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_items" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "sku" VARCHAR(50) NOT NULL,
    "product_name" VARCHAR(255) NOT NULL,
    "listed_price" BIGINT NOT NULL,
    "discount_per_item" BIGINT NOT NULL DEFAULT 0,
    "final_unit_price" BIGINT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "line_subtotal" BIGINT NOT NULL,
    "line_discount" BIGINT NOT NULL DEFAULT 0,
    "line_total" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "promotion_checks" (
    "id" BIGSERIAL NOT NULL,
    "phone_hash" VARCHAR(64) NOT NULL,
    "is_eligible" BOOLEAN NOT NULL,
    "token_id" UUID,
    "ip_hash" VARCHAR(64),
    "user_agent" VARCHAR(255),
    "checked_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(6),
    CONSTRAINT "promotion_checks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "integration_jobs" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "integration" "IntegrationName" NOT NULL,
    "action" "IntegrationAction" NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'pending',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "next_retry_at" TIMESTAMP(6),
    "locked_at" TIMESTAMP(6),
    "locked_by" VARCHAR(100),
    "external_id" VARCHAR(100),
    "request_payload" JSONB,
    "last_error" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    CONSTRAINT "integration_jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "integration_logs" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "integration_job_id" BIGINT,
    "integration" "IntegrationName" NOT NULL,
    "action" "IntegrationAction" NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'pending',
    "external_id" VARCHAR(100),
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "request_payload" JSONB,
    "response_payload" JSONB,
    "error_message" TEXT,
    "next_retry_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    CONSTRAINT "integration_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "admin_id" BIGINT,
    "action" "AuditAction" NOT NULL,
    "entity_type" VARCHAR(80) NOT NULL,
    "entity_id" VARCHAR(100),
    "ip_hash" VARCHAR(64),
    "metadata" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- Unique constraints and lookup indexes
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");
CREATE INDEX "idx_admins_role_status" ON "admins"("role", "status");
CREATE UNIQUE INDEX "eligible_customers_phone_hash_key" ON "eligible_customers"("phone_hash");
CREATE INDEX "idx_eligible_customers_active_source" ON "eligible_customers"("is_active", "source");
CREATE INDEX "idx_eligible_customers_phone_normalized" ON "eligible_customers"("phone_normalized");
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");
CREATE INDEX "idx_products_active_sort" ON "products"("is_active", "sort_order");
CREATE INDEX "idx_products_deleted_at" ON "products"("deleted_at");
CREATE INDEX "idx_product_images_product_sort" ON "product_images"("product_id", "sort_order");
CREATE UNIQUE INDEX "promotion_rules_code_key" ON "promotion_rules"("code");
CREATE INDEX "idx_promotion_rules_active_window" ON "promotion_rules"("is_active", "starts_at", "ends_at");
CREATE UNIQUE INDEX "orders_order_code_key" ON "orders"("order_code");
CREATE UNIQUE INDEX "orders_idempotency_key_key" ON "orders"("idempotency_key");
CREATE INDEX "idx_orders_status_created" ON "orders"("order_status", "created_at");
CREATE INDEX "idx_orders_recipient_phone" ON "orders"("recipient_phone");
CREATE INDEX "idx_orders_promotion_phone" ON "orders"("promotion_phone");
CREATE INDEX "idx_orders_promotion_phone_hash" ON "orders"("promotion_phone_hash");
CREATE INDEX "idx_orders_eligible_customer" ON "orders"("eligible_customer_id");
CREATE INDEX "idx_order_items_order" ON "order_items"("order_id");
CREATE INDEX "idx_order_items_product" ON "order_items"("product_id");
CREATE INDEX "idx_promotion_checks_phone_checked" ON "promotion_checks"("phone_hash", "checked_at");
CREATE INDEX "idx_promotion_checks_token" ON "promotion_checks"("token_id");
CREATE INDEX "idx_promotion_checks_checked_at" ON "promotion_checks"("checked_at");
CREATE INDEX "idx_integration_jobs_status_retry" ON "integration_jobs"("status", "next_retry_at");
CREATE INDEX "idx_integration_jobs_order_integration" ON "integration_jobs"("order_id", "integration");
CREATE INDEX "idx_integration_logs_status_retry" ON "integration_logs"("status", "next_retry_at");
CREATE INDEX "idx_integration_logs_order_integration" ON "integration_logs"("order_id", "integration");
CREATE INDEX "idx_integration_logs_job" ON "integration_logs"("integration_job_id");
CREATE INDEX "idx_audit_logs_admin_created" ON "audit_logs"("admin_id", "created_at");
CREATE INDEX "idx_audit_logs_entity" ON "audit_logs"("entity_type", "entity_id");

-- Check constraints
ALTER TABLE "eligible_customers" ADD CONSTRAINT "eligible_customers_usage_count_nonnegative" CHECK ("usage_count" >= 0);
ALTER TABLE "eligible_customers" ADD CONSTRAINT "eligible_customers_usage_limit_nonnegative" CHECK ("usage_limit" IS NULL OR "usage_limit" >= 0);
ALTER TABLE "products" ADD CONSTRAINT "products_listed_price_nonnegative" CHECK ("listed_price" >= 0);
ALTER TABLE "products" ADD CONSTRAINT "products_discount_amount_nonnegative" CHECK ("discount_amount" >= 0);
ALTER TABLE "products" ADD CONSTRAINT "products_stock_quantity_nonnegative" CHECK ("stock_quantity" IS NULL OR "stock_quantity" >= 0);
ALTER TABLE "promotion_rules" ADD CONSTRAINT "promotion_rules_discount_amount_nonnegative" CHECK ("discount_amount" >= 0);
ALTER TABLE "orders" ADD CONSTRAINT "orders_total_quantity_positive" CHECK ("total_quantity" > 0);
ALTER TABLE "orders" ADD CONSTRAINT "orders_money_nonnegative" CHECK ("subtotal" >= 0 AND "discount_amount" >= 0 AND "shipping_fee" >= 0 AND "total_amount" >= 0);
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_money_nonnegative" CHECK ("listed_price" >= 0 AND "discount_per_item" >= 0 AND "final_unit_price" >= 0 AND "line_subtotal" >= 0 AND "line_discount" >= 0 AND "line_total" >= 0);
ALTER TABLE "integration_jobs" ADD CONSTRAINT "integration_jobs_attempt_count_nonnegative" CHECK ("attempt_count" >= 0);
ALTER TABLE "integration_logs" ADD CONSTRAINT "integration_logs_attempt_count_nonnegative" CHECK ("attempt_count" >= 0);

-- Foreign keys
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_eligible_customer_id_fkey" FOREIGN KEY ("eligible_customer_id") REFERENCES "eligible_customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "integration_jobs" ADD CONSTRAINT "integration_jobs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "integration_logs" ADD CONSTRAINT "integration_logs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "integration_logs" ADD CONSTRAINT "integration_logs_integration_job_id_fkey" FOREIGN KEY ("integration_job_id") REFERENCES "integration_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

