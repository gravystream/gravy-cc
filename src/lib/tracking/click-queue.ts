import { Queue } from "bullmq";
import Redis from "ioredis";

// Shared Redis connection for BullMQ
const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

// Click processing queue
export const clickQueue = new Queue("click-processing", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});

export interface ClickJobData {
  trackingLinkId: string;
  ip: string;
  userAgent: string;
  referrer: string;
  timestamp: string;
}

export async function enqueueClick(data: ClickJobData): Promise<void> {
  try {
    await clickQueue.add("process-click", data, {
      priority: 1,
    });
  } catch (error) {
    console.error("Failed to enqueue click job:", error);
    // Fallback: log to console so we don't lose the click entirely
    console.log("CLICK_FALLBACK:", JSON.stringify(data));
  }
}
