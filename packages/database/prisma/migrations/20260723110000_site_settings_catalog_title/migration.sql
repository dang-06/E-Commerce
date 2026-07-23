ALTER TABLE "site_settings"
ADD COLUMN "catalog_title" VARCHAR(120) NOT NULL DEFAULT '';

ALTER TABLE "site_settings"
ALTER COLUMN "catalog_title" DROP DEFAULT;
