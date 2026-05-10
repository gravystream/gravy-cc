import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const brandProfile = await db.brandProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!brandProfile) {
      return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });
    }

    const type = req.nextUrl.searchParams.get("type") || "links";

    if (type === "links") {
      const links = await db.trackingLink.findMany({
        where: { campaign: { brandId: brandProfile.id } },
        include: {
          campaign: { select: { title: true } },
          creator: { select: { name: true, email: true } },
          conversions: { select: { value: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      const headers = ["Link ID","Short Code","Destination URL","Campaign","Creator","Creator Email","Total Clicks","Unique Clicks","Conversions","Revenue","Status","Created At"];
      const rows = links.map((l) => [
        l.id,
        l.shortCode,
        l.destinationUrl,
        l.campaign?.title || "",
        l.creator?.name || "",
        l.creator?.email || "",
        l.totalClicks,
        l.uniqueClicks,
        l.conversions.length,
        l.conversions.reduce((s, c) => s + (c.value || 0), 0).toFixed(2),
        l.isActive ? "Active" : "Paused",
        l.createdAt.toISOString().split("T")[0],
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="brand-links-export-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    if (type === "clicks") {
      const clicks = await db.linkClick.findMany({
        where: { trackingLink: { campaign: { brandId: brandProfile.id } } },
        include: {
          trackingLink: {
            select: { shortCode: true, campaign: { select: { title: true } } },
          },
        },
        orderBy: { timestamp: "desc" },
        take: 10000,
      });

      const headers = ["Click ID","Short Code","Campaign","Timestamp","Device","Browser","OS","Country","Referrer","Is Unique"];
      const rows = clicks.map((c) => [
        c.id,
        c.trackingLink.shortCode,
        c.trackingLink.campaign?.title || "",
        c.timestamp.toISOString(),
        c.device || "",
        c.browser || "",
        c.os || "",
        c.country || "",
        c.referrer || "",
        c.isUnique ? "Yes" : "No",
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="brand-clicks-export-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    if (type === "conversions") {
      const conversions = await db.conversion.findMany({
        where: { trackingLink: { campaign: { brandId: brandProfile.id } } },
        include: {
          trackingLink: {
            select: { shortCode: true, campaign: { select: { title: true } }, creator: { select: { name: true } } },
          },
        },
        orderBy: { timestamp: "desc" },
        take: 10000,
      });

      const headers = ["Conversion ID","Short Code","Campaign","Creator","Type","Value","Timestamp"];
      const rows = conversions.map((c) => [
        c.id,
        c.trackingLink.shortCode,
        c.trackingLink.campaign?.title || "",
        c.trackingLink.creator?.name || "",
        c.type,
        c.value?.toFixed(2) || "0.00",
        c.timestamp.toISOString(),
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="brand-conversions-export-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({ error: "Invalid export type. Use: links, clicks, or conversions" }, { status: 400 });
  } catch (error) {
    console.error("Brand export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
