// Conversion Webhook Receiver
// POST /api/webhooks/conversions
// Brands send conversion events (purchases, signups, installs) via webhook

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createHmac, timingSafeEqual } from "crypto";

export const dynamic = "force-dynamic";

function verifySignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expected = createHmac("sha256", secret).update(payload).digest("hex");
    const sig = signature.replace("sha256=", "");
    return timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const webhookSecret = request.headers.get("x-novaclio-webhook-secret");
    const signature = request.headers.get("x-novaclio-signature");

    if (!webhookSecret && !signature) {
      return NextResponse.json({ error: "Missing webhook authentication" }, { status: 401 });
    }

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { shortCode, trackingLinkId, type, value, metadata, idempotencyKey } = body;

    if (!shortCode && !trackingLinkId) {
      return NextResponse.json(
        { error: "Either shortCode or trackingLinkId is required" },
        { status: 400 }
      );
    }

    if (!type || !["purchase", "signup", "install", "custom"].includes(type)) {
      return NextResponse.json(
        { error: "type must be one of: purchase, signup, install, custom" },
        { status: 400 }
      );
    }

    // Find the tracking link
    let trackingLink;
    if (trackingLinkId) {
      trackingLink = await db.trackingLink.findUnique({
        where: { id: trackingLinkId },
        include: { campaign: true },
      });
    } else if (shortCode) {
      trackingLink = await db.trackingLink.findUnique({
        where: { shortCode },
        include: { campaign: true },
      });
    }

    if (!trackingLink) {
      return NextResponse.json({ error: "Tracking link not found" }, { status: 404 });
    }

    // Validate webhook secret against the campaign
    const campaign = trackingLink.campaign;
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Check webhook secret (plain text match or HMAC signature)
    if (webhookSecret) {
      if (campaign.webhookSecret !== webhookSecret) {
        return NextResponse.json({ error: "Invalid webhook secret" }, { status: 401 });
      }
    } else if (signature && campaign.webhookSecret) {
      if (!verifySignature(rawBody, signature, campaign.webhookSecret)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Idempotency check
    if (idempotencyKey) {
      const existing = await db.conversion.findFirst({
        where: {
          trackingLinkId: trackingLink.id,
          metadata: {
            path: ["idempotencyKey"],
            equals: idempotencyKey,
          },
        },
      });

      if (existing) {
        return NextResponse.json({
          ok: true,
          message: "Conversion already recorded (idempotent)",
          conversionId: existing.id,
        });
      }
    }

    // Create the conversion
    const conversion = await db.conversion.create({
      data: {
        trackingLinkId: trackingLink.id,
        type,
        value: value || 0,
        amount: value || 0,
        metadata: {
          ...(metadata || {}),
          ...(idempotencyKey ? { idempotencyKey } : {}),
          webhookReceivedAt: new Date().toISOString(),
        },
      },
    });

    // Update PerformanceMetric for today if exists
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      await db.performanceMetric.updateMany({
        where: {
          trackingLinkId: trackingLink.id,
          date: today,
        },
        data: {
          conversions: { increment: 1 },
          revenue: { increment: value || 0 },
        },
      });
    } catch {
      // PerformanceMetric for today may not exist yet — non-critical
    }

    return NextResponse.json({
      ok: true,
      conversionId: conversion.id,
      type,
      value: value || 0,
    });
  } catch (error: any) {
    console.error("Webhook conversion error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
