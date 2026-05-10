import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/conversions?link_id=xxx  Tracking pixel (1x1 transparent GIF)
export async function GET(req: NextRequest) {
  const linkId = req.nextUrl.searchParams.get("link_id");
  const type = req.nextUrl.searchParams.get("type") || "pageview";
  const value = parseFloat(req.nextUrl.searchParams.get("value") || "0");

  if (linkId) {
    try {
      // Verify link exists
      const link = await db.trackingLink.findUnique({ where: { id: linkId } });
      if (link) {
        // Record conversion
        await db.conversion.create({
          data: {
            trackingLinkId: linkId,
            type,
            value: value || null,
            metadata: {
              ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
              userAgent: req.headers.get("user-agent") || "",
              referrer: req.headers.get("referer") || "",
              timestamp: new Date().toISOString(),
            },
          },
        });

        // Update daily performance metric
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        await db.performanceMetric.upsert({
          where: { trackingLinkId_date: { trackingLinkId: linkId, date: today } },
          update: {
            conversions: { increment: 1 },
            revenue: { increment: value || 0 },
          },
          create: {
            trackingLinkId: linkId,
            date: today,
            conversions: 1,
            revenue: value || 0,
          },
        });
      }
    } catch (error) {
      console.error("Conversion pixel error:", error);
    }
  }

  // Return 1x1 transparent GIF
  const pixel = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
  );
  return new NextResponse(pixel, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}

// POST /api/conversions  Server-side postback
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { link_id, short_code, type, value, metadata } = body;

    // Find link by ID or short code
    let linkId = link_id;
    if (!linkId && short_code) {
      const link = await db.trackingLink.findUnique({
        where: { shortCode: short_code },
      });
      if (!link) {
        return NextResponse.json({ error: "Link not found" }, { status: 404 });
      }
      linkId = link.id;
    }

    if (!linkId) {
      return NextResponse.json(
        { error: "link_id or short_code is required" },
        { status: 400 }
      );
    }

    // Verify link exists
    const link = await db.trackingLink.findUnique({ where: { id: linkId } });
    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    // Record conversion
    const conversion = await db.conversion.create({
      data: {
        trackingLinkId: linkId,
        type: type || "conversion",
        value: value ? parseFloat(value) : null,
        metadata: metadata || {},
      },
    });

    // Update daily performance metric
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await db.performanceMetric.upsert({
      where: { trackingLinkId_date: { trackingLinkId: linkId, date: today } },
      update: {
        conversions: { increment: 1 },
        revenue: { increment: value ? parseFloat(value) : 0 },
      },
      create: {
        trackingLinkId: linkId,
        date: today,
        conversions: 1,
        revenue: value ? parseFloat(value) : 0,
      },
    });

    return NextResponse.json({
      success: true,
      conversion_id: conversion.id,
    });
  } catch (error) {
    console.error("Conversion postback error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
