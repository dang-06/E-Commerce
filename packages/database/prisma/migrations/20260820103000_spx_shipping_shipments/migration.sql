ALTER TYPE "IntegrationName" ADD VALUE IF NOT EXISTS 'spx';

CREATE TABLE "shipping_shipments" (
  "id" BIGSERIAL PRIMARY KEY,
  "order_id" BIGINT NOT NULL,
  "provider" VARCHAR(30) NOT NULL,
  "tracking_no" VARCHAR(100),
  "tracking_link" TEXT,
  "batch_no" VARCHAR(100),
  "consignment_no" VARCHAR(100),
  "status_code" VARCHAR(30),
  "status" VARCHAR(100),
  "awb_link" TEXT,
  "awb_expires_at" TIMESTAMP(6),
  "estimated_shipping_fee" BIGINT,
  "actual_shipping_fee" BIGINT,
  "chargeable_weight" DECIMAL(10, 3),
  "raw_last_event" JSONB,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "shipping_shipments_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "shipping_events" (
  "id" BIGSERIAL PRIMARY KEY,
  "shipment_id" BIGINT,
  "provider" VARCHAR(30) NOT NULL,
  "provider_event_id" VARCHAR(100),
  "tracking_no" VARCHAR(100),
  "event_type" VARCHAR(50) NOT NULL,
  "status_code" VARCHAR(30),
  "payload" JSONB NOT NULL,
  "occurred_at" TIMESTAMP(6),
  "received_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "shipping_events_shipment_id_fkey"
    FOREIGN KEY ("shipment_id") REFERENCES "shipping_shipments"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "uniq_shipping_shipments_provider_tracking"
  ON "shipping_shipments"("provider", "tracking_no");

CREATE INDEX "idx_shipping_shipments_order_provider"
  ON "shipping_shipments"("order_id", "provider");

CREATE INDEX "idx_shipping_shipments_provider_status"
  ON "shipping_shipments"("provider", "status_code");

CREATE UNIQUE INDEX "uniq_shipping_events_provider_event"
  ON "shipping_events"("provider", "provider_event_id");

CREATE INDEX "idx_shipping_events_tracking_type_time"
  ON "shipping_events"("tracking_no", "event_type", "occurred_at");

CREATE INDEX "idx_shipping_events_shipment"
  ON "shipping_events"("shipment_id");
