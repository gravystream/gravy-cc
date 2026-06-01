import { NextResponse } from "next/server";
import { getCreatorAudienceProfile } from "@/lib/audience/insights";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const days = Math.max(
    1,
    Math.min(365, parseInt(searchParams.get("days") || "30", 10))
  );

  const audience = await getCreatorAudienceProfile(id, days);
  if (!audience) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  return NextResponse.json({ audience });
}
