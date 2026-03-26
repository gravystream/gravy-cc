import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const DEFAULTS: Record<string, { value: string; description: string }> = {
  commission_rate: { value: "10", description: "Platform commission percentage on each job" },
  ai_quality_threshold: { value: "50", description: "Minimum AI portfolio quality score (0-100) for creator approval" },
  ai_proposal_threshold: { value: "60", description: "Minimum AI proposal quality score (0-100)" },
  auto_release_hours: { value: "72", description: "Hours after delivery before auto-releasing escrow payment" },
  min_payout_amount: { value: "500000", description: "Minimum payout amount in kobo (5000 NGN)" },
  max_revisions: { value: "3", description: "Maximum revision rounds per job" },
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || !["OWNER","ADMINISTRATOR","TECHNICAL","SUPPORT"].includes((session.user as any).role))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const configs = await db.platformConfig.findMany({ orderBy: { key: "asc" } });
    const merged = Object.entries(DEFAULTS).map(([key, def]) => {
      const existing = configs.find((c: any) => c.key === key);
      return { key, value: existing?.value || def.value, description: existing?.description || def.description, isDefault: !existing };
    });
    return NextResponse.json(merged);
  } catch (error) {
    console.error("Error fetching config:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !["OWNER","ADMINISTRATOR","TECHNICAL","SUPPORT"].includes((session.user as any).role))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { configs } = await req.json();
    if (!Array.isArray(configs)) return NextResponse.json({ error: "configs must be an array" }, { status: 400 });
    const results = await Promise.all(
      configs.map(({ key, value }: { key: string; value: string }) =>
        db.platformConfig.upsert({ where: { key }, update: { value, description: DEFAULTS[key]?.description }, create: { key, value, description: DEFAULTS[key]?.description || key } })
      )
    );
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error updating config:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
