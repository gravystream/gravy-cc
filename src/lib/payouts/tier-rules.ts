export const TIER_MULTIPLIERS = {
  BRONZE: 1.0,
  SILVER: 1.25,
  GOLD: 1.5,
  PLATINUM: 2.0,
} as const;

export type TierName = keyof typeof TIER_MULTIPLIERS;

export const TIER_RANK: Record<TierName, number> = {
  BRONZE: 0,
  SILVER: 1,
  GOLD: 2,
  PLATINUM: 3,
};

export function calculateTier(conversionsLast30d: number): TierName {
  if (conversionsLast30d >= 100) return "PLATINUM";
  if (conversionsLast30d >= 30) return "GOLD";
  if (conversionsLast30d >= 10) return "SILVER";
  return "BRONZE";
}

export function calculateWeeklyPayoutKobo(
  conversionsThisWeek: number,
  tier: TierName,
  baseRateKoboPerConversion: number
): number {
  return Math.round(
    conversionsThisWeek * baseRateKoboPerConversion * TIER_MULTIPLIERS[tier]
  );
}

export function getBaseRateKoboPerConversion(): number {
  const raw = process.env.GRAVY_BASE_RATE_KOBO_PER_CONVERSION;
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 100_000;
}

export function startOfIsoWeek(d: Date = new Date()): Date {
  const date = new Date(d);
  const day = date.getUTCDay();
  const diff = (day + 6) % 7; // Monday-based
  date.setUTCDate(date.getUTCDate() - diff);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}
