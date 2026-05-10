// Socket.io tracking integration
// Subscribes to Redis pub/sub for click events and emits to connected creators
// This should be imported and called in the existing Socket.io server setup

import Redis from "ioredis";
import type { Server as SocketIOServer } from "socket.io";

let subscriber: Redis | null = null;

export function initTrackingSocket(io: SocketIOServer): void {
  subscriber = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: 3,
  });

  subscriber.on("error", (err) => {
    console.error("Redis tracking subscriber error:", err);
  });

  // Subscribe to click events channel
  subscriber.subscribe("tracking:click-events", (err) => {
    if (err) {
      console.error("Failed to subscribe to tracking:click-events:", err);
      return;
    }
    console.log("Subscribed to tracking:click-events for real-time updates");
  });

  // When a click event is published, emit to the creator's room
  subscriber.on("message", (channel, message) => {
    if (channel !== "tracking:click-events") return;

    try {
      const event = JSON.parse(message);
      const { creatorId, trackingLinkId, totalClicks, uniqueClicks, campaignId } = event;

      // Emit to the creator's room (creator:{userId})
      if (creatorId) {
        io.to(`creator:${creatorId}`).emit("click-update", {
          trackingLinkId,
          totalClicks,
          uniqueClicks,
          campaignId,
          timestamp: event.timestamp,
        });
      }

      // Also emit to admin room for the admin dashboard
      io.to("admin").emit("click-update", {
        trackingLinkId,
        totalClicks,
        uniqueClicks,
        campaignId,
        creatorId,
        timestamp: event.timestamp,
      });

      // Emit to brand room for brand dashboard
      if (campaignId) {
        io.to(`campaign:${campaignId}`).emit("click-update", {
          trackingLinkId,
          totalClicks,
          uniqueClicks,
          timestamp: event.timestamp,
        });
      }
    } catch (error) {
      console.error("Failed to process click event:", error);
    }
  });

  console.log("Tracking socket integration initialized");
}

export function cleanupTrackingSocket(): void {
  if (subscriber) {
    subscriber.unsubscribe("tracking:click-events");
    subscriber.quit();
    subscriber = null;
  }
}
