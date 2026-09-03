CREATE TABLE "spx_accounts" (
  "id" BIGSERIAL PRIMARY KEY,
  "phone" VARCHAR(32) NOT NULL,
  "email" VARCHAR(64),
  "user_id" BIGINT NOT NULL,
  "user_secret_ciphertext" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "verified_at" TIMESTAMP(6),
  "last_error" TEXT,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "spx_accounts_user_id_key"
  ON "spx_accounts"("user_id");

CREATE UNIQUE INDEX "uniq_spx_accounts_single_active"
  ON "spx_accounts"("is_active")
  WHERE "is_active" = true;

CREATE INDEX "idx_spx_accounts_active_updated"
  ON "spx_accounts"("is_active", "updated_at");
