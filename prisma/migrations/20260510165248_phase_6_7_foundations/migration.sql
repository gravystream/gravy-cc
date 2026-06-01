-- CreateEnum
CREATE TYPE "CreatorTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "BonusThresholdType" AS ENUM ('CONVERSIONS', 'CLICKS', 'UNIQUE_CLICKS', 'REVENUE_KOBO');

-- CreateEnum
CREATE TYPE "ExperimentStatus" AS ENUM ('DRAFT', 'RUNNING', 'COMPLETED', 'ABANDONED');

-- AlterTable
ALTER TABLE "CreatorProfile" ADD COLUMN     "gravyOnboardedAt" TIMESTAMP(3),
ADD COLUMN     "isGravyArmy" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tier" "CreatorTier" NOT NULL DEFAULT 'BRONZE',
ADD COLUMN     "tierUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "CreatorTierHistory" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "fromTier" "CreatorTier" NOT NULL,
    "toTier" "CreatorTier" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorTierHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceBonus" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "threshold" INTEGER NOT NULL,
    "thresholdType" "BonusThresholdType" NOT NULL DEFAULT 'CONVERSIONS',
    "bonusAmountKobo" INTEGER NOT NULL,
    "earnedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "paidManually" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceBonus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GravyKPISnapshot" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalGravyCreators" INTEGER NOT NULL DEFAULT 0,
    "activeGravyCreators" INTEGER NOT NULL DEFAULT 0,
    "totalClicks" INTEGER NOT NULL DEFAULT 0,
    "totalConversions" INTEGER NOT NULL DEFAULT 0,
    "totalRevenueKobo" INTEGER NOT NULL DEFAULT 0,
    "newSignups" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GravyKPISnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventActivation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "budgetKobo" INTEGER NOT NULL DEFAULT 0,
    "signupsGenerated" INTEGER NOT NULL DEFAULT 0,
    "clicksGenerated" INTEGER NOT NULL DEFAULT 0,
    "conversionsGenerated" INTEGER NOT NULL DEFAULT 0,
    "costPerAcquisitionKobo" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventActivation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventCreator" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "signupsGenerated" INTEGER NOT NULL DEFAULT 0,
    "payoutKobo" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventCreator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlywheelMetric" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "signups" INTEGER NOT NULL DEFAULT 0,
    "activations" INTEGER NOT NULL DEFAULT 0,
    "transactions" INTEGER NOT NULL DEFAULT 0,
    "referrals" INTEGER NOT NULL DEFAULT 0,
    "signupToActivation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activationToTransaction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "transactionToReferral" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "referralToSignup" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlywheelMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experiment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "status" "ExperimentStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "sampleSize" INTEGER NOT NULL DEFAULT 0,
    "controlData" JSONB,
    "variantData" JSONB,
    "results" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Experiment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyReport" (
    "id" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "headline" TEXT NOT NULL,
    "metricsJson" JSONB NOT NULL,
    "highlightsJson" JSONB NOT NULL,
    "anomaliesJson" JSONB NOT NULL,
    "recommendationsJson" JSONB NOT NULL,
    "generatedBy" TEXT NOT NULL DEFAULT 'agent',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreatorTierHistory_creatorId_idx" ON "CreatorTierHistory"("creatorId");

-- CreateIndex
CREATE INDEX "CreatorTierHistory_createdAt_idx" ON "CreatorTierHistory"("createdAt");

-- CreateIndex
CREATE INDEX "PerformanceBonus_campaignId_idx" ON "PerformanceBonus"("campaignId");

-- CreateIndex
CREATE INDEX "PerformanceBonus_creatorId_idx" ON "PerformanceBonus"("creatorId");

-- CreateIndex
CREATE INDEX "PerformanceBonus_earnedAt_idx" ON "PerformanceBonus"("earnedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GravyKPISnapshot_date_key" ON "GravyKPISnapshot"("date");

-- CreateIndex
CREATE INDEX "GravyKPISnapshot_date_idx" ON "GravyKPISnapshot"("date");

-- CreateIndex
CREATE INDEX "EventActivation_date_idx" ON "EventActivation"("date");

-- CreateIndex
CREATE INDEX "EventCreator_creatorId_idx" ON "EventCreator"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "EventCreator_eventId_creatorId_key" ON "EventCreator"("eventId", "creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "FlywheelMetric_date_key" ON "FlywheelMetric"("date");

-- CreateIndex
CREATE INDEX "FlywheelMetric_date_idx" ON "FlywheelMetric"("date");

-- CreateIndex
CREATE INDEX "Experiment_status_idx" ON "Experiment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyReport_weekStart_key" ON "WeeklyReport"("weekStart");

-- CreateIndex
CREATE INDEX "WeeklyReport_weekStart_idx" ON "WeeklyReport"("weekStart");

-- AddForeignKey
ALTER TABLE "CreatorTierHistory" ADD CONSTRAINT "CreatorTierHistory_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceBonus" ADD CONSTRAINT "PerformanceBonus_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceBonus" ADD CONSTRAINT "PerformanceBonus_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCreator" ADD CONSTRAINT "EventCreator_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "EventActivation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCreator" ADD CONSTRAINT "EventCreator_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

