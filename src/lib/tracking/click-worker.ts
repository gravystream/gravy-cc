import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import { db } from "@/lib/db";
import { parseUserAgent } from "@/lib/tracking/parse-ua";
import { lookupGeoIP } from "@/lib/tracking/geoip";
import { createHash } from "crypto";
import { emitClickEvent } from "./click-event-emitter";
import type { ClickJobData } from "./click-queue";

const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const clickWorker = new Worker(
  "click-processing",
  async (job: Job<ClickJobData>) => {
    const data = job.data;

    try {
      // Parse user agent
      const ua = parseUserAgent(data.userAgent);

      // GeoIP lookup
      const geo = await lookupGeoIP(data.ip);

      // Hash IP for privacy
      const ipHash = createHash("sha256")
        .update(data.ip + (process.env.IP_SALT || "novaclio-salt"))
        .digest("hex");

      // Check uniqueness: same ipHash + trackingLinkId within 24 hours
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const existingClick = await db.linkClick.findFirst({
        where: {
          trackingLinkId: data.trackingLinkId,
          ipHash,
          timestamp: { gte: twentyFourHoursAgo },
        },
      });

      const isUnique = !existingClick;

      // Create the click record
      await db.linkClick.create({
        data: {
          trackingLinkId: data.trackingLinkId,
          ipHash,
          userAgent: data.userAgent,
          referrer: data.referrer || null,
          browser: ua.browser,
          browserVersion: ua.browserVersion,
          os: ua.os,
          osVersion: ua.osVersion,
          device: ua.device,
          deviceType: ua.deviceType,
          country: geo?.country || null,
          countryCode: geo?.countryCode || null,
          city: geo?.city || null,
          region: geo?.region || null,
          latitude: geo?.lat || null,
          longitude: geo?.lon || null,
          isUnique,
          timestamp: new Date(data.timestamp),
        },
      });

      // Update tracking link counters
      await db.trackingLink.update({
        where: { id: data.trackingLinkId },
        data: {
          totalClicks: { increment: 1 },
          ...(isUnique ? { uniqueClicks: { increment: 1 } } : {}),
        },
      });

      // Emit real-time click event via Redis pub/sub
      try {
        const updatedLink = await db.trackingLink.findUnique({
          where: { id: data.trackingLinkId },
          select: { totalClicks: true, uniqueClicks: true, campaignId: true, creatorId: true },
        });
        if (updatedLink) {
          await emitClickEvent({
            trackingLinkId: data.trackingLinkId,
            creatorId: updatedLink.creatorId,
            campaignId: updatedLink.campaignId || "",
            totalClicks: updatedLink.totalClicks,
            uniqueClicks: updatedLink.uniqueClicks,
            timestamp: data.timestamp,
          });
        }
      } catch (emitErr) {
        console.error("Failed to emit click event:", emitErr);
      }

      console.log(`Click processed for ${data.trackingLinkId} (unique: ${isUnique})`);
    } catch (error) {
      console.error("Click processing error:", error);
      throw error;
    }
  },
  {
    connection,
    concurrency: 10,
    limiter: {
      max: 100,
      duration: 1000,
    },
  }
);

clickWorker.on("failed", (job, err) => {
  console.error(`Click job ${job?.id} failed:`, err.message);
});

clickWorker.on("error", (err) => {
  console.error("Click worker error:", err);
});

export default clickWorker;
