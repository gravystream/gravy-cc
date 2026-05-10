/**
 * Smoke test for the click-tracking enqueue pipeline.
 *
 * Verifies the contract: when /go/[code]/route.ts calls enqueueClick(),
 * a job is added to the "click-processing" BullMQ queue with the
 * expected shape (trackingLinkId, ip, userAgent, referrer, timestamp).
 *
 * The full worker → Postgres → pub/sub flow is exercised manually in
 * production via real /go/* clicks; this file guards the contract.
 */

// Mock ioredis BEFORE importing anything that pulls it in
jest.mock("ioredis", () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    quit: jest.fn().mockResolvedValue(undefined),
  }));
});

// Mock BullMQ's Queue so we can capture .add() calls
const addSpy = jest.fn().mockResolvedValue({ id: "test-job-id" });
jest.mock("bullmq", () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: addSpy,
    close: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe("click-queue", () => {
  beforeEach(() => {
    addSpy.mockClear();
    jest.resetModules();
  });

  it("enqueueClick adds a job to the click-processing queue with the expected shape", async () => {
    const { enqueueClick } = await import("@/lib/tracking/click-queue");

    const payload = {
      trackingLinkId: "test-link-id",
      ip: "192.168.1.1",
      userAgent: "Mozilla/5.0 (Test)",
      referrer: "https://example.com",
      timestamp: "2026-05-10T13:00:00.000Z",
    };

    await enqueueClick(payload);

    expect(addSpy).toHaveBeenCalledTimes(1);
    expect(addSpy).toHaveBeenCalledWith(
      "process-click",
      payload,
      expect.objectContaining({ priority: 1 })
    );
  });

  it("enqueueClick swallows errors and logs a fallback (no throw)", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    addSpy.mockRejectedValueOnce(new Error("Redis down"));

    const { enqueueClick } = await import("@/lib/tracking/click-queue");

    await expect(
      enqueueClick({
        trackingLinkId: "x",
        ip: "1.2.3.4",
        userAgent: "ua",
        referrer: "",
        timestamp: new Date().toISOString(),
      })
    ).resolves.toBeUndefined();

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "CLICK_FALLBACK:",
      expect.any(String)
    );

    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });
});
