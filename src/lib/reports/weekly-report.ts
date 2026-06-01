import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { startOfIsoWeek } from "@/lib/payouts/tier-rules";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface WeeklyReportShape {
  headline: string;
  highlights: string[];
  anomalies: string[];
  recommendations: string[];
}

/**
 * Generate (or regenerate) the weekly report for the ISO week
 * containing `forDate` (Monday-anchored). Pulls last 7 days of
 * GravyKPISnapshot + FlywheelMetric rows and the top creators,
 * asks Claude Sonnet for a structured executive summary, persists
 * to WeeklyReport. Idempotent on weekStart.
 */
export async function generateWeeklyReport(forDate: Date = new Date()) {
  const weekStart = startOfIsoWeek(forDate);
  // Walk back 7 days from week start to include the *previous* week
  const previousWeekStart = new Date(weekStart);
  previousWeekStart.setUTCDate(previousWeekStart.getUTCDate() - 7);

  const [kpiSnapshots, flywheel, topCreators] = await Promise.all([
    db.gravyKPISnapshot.findMany({
      where: { date: { gte: previousWeekStart, lt: weekStart } },
      orderBy: { date: "asc" },
    }),
    db.flywheelMetric.findMany({
      where: { date: { gte: previousWeekStart, lt: weekStart } },
      orderBy: { date: "asc" },
    }),
    topCreatorsByConversions(previousWeekStart, weekStart),
  ]);

  const metrics = {
    weekStart: previousWeekStart.toISOString().slice(0, 10),
    weekEnd: weekStart.toISOString().slice(0, 10),
    kpiSnapshots: kpiSnapshots.map((s) => ({
      date: s.date.toISOString().slice(0, 10),
      activeCreators: s.activeGravyCreators,
      totalCreators: s.totalGravyCreators,
      clicks: s.totalClicks,
      conversions: s.totalConversions,
      revenueKobo: s.totalRevenueKobo,
    })),
    flywheel: flywheel.map((f) => ({
      date: f.date.toISOString().slice(0, 10),
      signups: f.signups,
      activations: f.activations,
      transactions: f.transactions,
    })),
    topCreators,
  };

  const prompt = `You are a growth analyst for Gravy, a creator marketplace.
Below is the previous week's snapshot data (JSON). Produce a structured
executive summary in JSON with this exact shape:

{
  "headline": "1-sentence summary of the week",
  "highlights": ["3 short bullets — what went well or notable wins"],
  "anomalies": ["1-2 bullets — anything unusual, or 'No notable anomalies' if all flat"],
  "recommendations": ["3 actionable next steps the team should take this coming week"]
}

Return ONLY the JSON object, no surrounding prose, no markdown fences.

Data:
${JSON.stringify(metrics, null, 2)}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((c) => c.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text content in Claude response");
  }
  const raw = textBlock.text.trim();
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed: WeeklyReportShape;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(
      `Failed to parse Claude response as JSON: ${(err as Error).message}\nRaw: ${cleaned.slice(0, 500)}`
    );
  }

  const report = await db.weeklyReport.upsert({
    where: { weekStart: previousWeekStart },
    create: {
      weekStart: previousWeekStart,
      headline: parsed.headline ?? "Weekly summary",
      metricsJson: metrics,
      highlightsJson: parsed.highlights ?? [],
      anomaliesJson: parsed.anomalies ?? [],
      recommendationsJson: parsed.recommendations ?? [],
      generatedBy: "claude-sonnet-4-6",
    },
    update: {
      headline: parsed.headline ?? "Weekly summary",
      metricsJson: metrics,
      highlightsJson: parsed.highlights ?? [],
      anomaliesJson: parsed.anomalies ?? [],
      recommendationsJson: parsed.recommendations ?? [],
      generatedBy: "claude-sonnet-4-6",
    },
  });

  return report;
}

async function topCreatorsByConversions(
  start: Date,
  end: Date
): Promise<
  Array<{
    displayName: string;
    tier: string;
    conversions: number;
  }>
> {
  const army = await db.creatorProfile.findMany({
    where: { isGravyArmy: true },
    select: { displayName: true, tier: true, userId: true },
  });

  const ranked = await Promise.all(
    army.map(async (c) => {
      const conversions = await db.conversion.count({
        where: {
          timestamp: { gte: start, lt: end },
          trackingLink: { creatorId: c.userId },
        },
      });
      return {
        displayName: c.displayName,
        tier: c.tier,
        conversions,
      };
    })
  );

  ranked.sort((a, b) => b.conversions - a.conversions);
  return ranked.slice(0, 10);
}
