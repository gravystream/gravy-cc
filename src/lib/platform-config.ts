import { db } from "./db";
const CACHE: Map<string, { value: string; expiresAt: number }> = new Map();
const TTL = 60000;
const DEFAULTS: Record<string, string> = { commission_rate: "10", ai_quality_threshold: "50", ai_proposal_threshold: "60", auto_release_hours: "72", min_payout_amount: "500000", max_revisions: "3" };
export async function getConfigValue(key: string): Promise<string> {
  const cached = CACHE.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  try {
    const config = await db.platformConfig.findUnique({ where: { key } });
    const value = config?.value || DEFAULTS[key] || "";
    CACHE.set(key, { value, expiresAt: Date.now() + TTL });
    return value;
  } catch { return DEFAULTS[key] || ""; }
}
export async function getConfigNumber(key: string): Promise<number> {
  const value = await getConfigValue(key);
  return parseInt(value, 10) || 0;
}
