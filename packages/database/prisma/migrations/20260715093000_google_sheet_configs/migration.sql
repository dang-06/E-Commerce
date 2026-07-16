CREATE TYPE "GoogleSheetPurpose" AS ENUM ('eligible_customers', 'orders');

CREATE TABLE "google_sheet_configs" (
    "id" BIGSERIAL NOT NULL,
    "purpose" "GoogleSheetPurpose" NOT NULL,
    "sheet_url" TEXT NOT NULL,
    "spreadsheet_id" VARCHAR(120) NOT NULL,
    "worksheet_name" VARCHAR(120),
    "phone_column" VARCHAR(50),
    "order_mapping" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_sync_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "google_sheet_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "google_sheet_configs_purpose_key" ON "google_sheet_configs"("purpose");
CREATE INDEX "idx_google_sheet_configs_purpose_active" ON "google_sheet_configs"("purpose", "is_active");
