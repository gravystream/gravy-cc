// Worker initialization - import this in a server-side entry point
// to start the click processing worker

let workerStarted = false;

export async function initClickWorker() {
  if (workerStarted) return;
  workerStarted = true;

  try {
    // Dynamic import to avoid loading worker code in client bundles
    const { clickWorker } = await import("@/lib/tracking/click-worker");
    console.log("Click worker initialized, processing queue...");

    // Graceful shutdown
    const shutdown = async () => {
      console.log("Shutting down click worker...");
      await clickWorker.close();
      process.exit(0);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    console.error("Failed to initialize click worker:", error);
    workerStarted = false;
  }
}
