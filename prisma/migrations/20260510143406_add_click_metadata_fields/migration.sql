-- AlterTable
ALTER TABLE "LinkClick" ADD COLUMN     "browserVersion" TEXT,
ADD COLUMN     "countryCode" TEXT,
ADD COLUMN     "deviceType" TEXT,
ADD COLUMN     "isUnique" BOOLEAN DEFAULT false,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "osVersion" TEXT,
ADD COLUMN     "region" TEXT;

