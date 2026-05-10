import { NextResponse } from "next/server";
import { generateWeeklyReport } from "@/lib/reports/weekly-report";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Schedule on the VPS, every Monday at 06:00 UTC:
//   0 6 * * 1  curl -X POST -H "X-Cron-Secret: $CRON_SECRET" \
//     https://novaclio.io/api/cron/weekly-report
export async function POST(req: Request) {
  if (req.headers.get("x-cron-secret") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const report = await generateWeeklyReport();
    return NextResponse.json({ report });
  } catch (error: any) {
    console.error("Weekly report generation failed:", error);
    return NextResponse.json(
      { error: error?.message ?? "Generation failed" },
      { status: 500 }
    );
  }
}
