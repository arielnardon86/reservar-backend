-- AlterTable: Add latitude and longitude columns to tenants
ALTER TABLE "tenants" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "tenants" ADD COLUMN "longitude" DOUBLE PRECISION;
