// Real-time click event emitter
// Called from click-worker after writing a click to DB
// Publishes to Redis pub/sub so Socket.io can relay to connected clients

import Redis from "ioredis";

let publisher: Redis | null = null;

function getPublisher(): Redis {
  if (!publisher) {
    publisher = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    publisher.on("error", (err) => console.error("Redis click-emitter error:", err));
  }
  return publisher;
}

export interface ClickEvent {
  trackingLinkId: string;
  creatorId: string;
  campaignId: string;
  totalClicks: number;
  uniqueClicks: number;
  timestamp: string;
}

export async function emitClickEvent(event: ClickEvent): Promise<void> {
  try {
    const redis = getPublisher();
    // Publish to a channel that Socket.io server subscribes to
    await redis.publish(
      "tracking:click-events",
      JSON.stringify(event)
    );
  } catch (error) {
    console.error("Failed to emit click event:", error);
  }
}
