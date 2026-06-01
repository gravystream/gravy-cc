// Mock Next.js server globals before importing
class MockRequest {
  constructor(url, options = {}) {
    this.url = url;
    this.method = options.method || "GET";
    this.headers = new Map(Object.entries(options.headers || {}));
  }
}

class MockResponse {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
  }
  static json(data, init = {}) {
    return new MockResponse(JSON.stringify(data), init);
  }
}

// Set globals before importing the module
(global as any).Request = MockRequest;
(global as any).Response = MockResponse;

jest.mock("next/server", () => ({
  NextRequest: MockRequest,
  NextResponse: {
    json: (data: any, init: any) => MockResponse.json(data, init),
    next: () => new MockResponse(null, { status: 200 }),
  },
}));

describe("Rate Limiter", () => {
  it("exports rate limiters", async () => {
    const mod = await import("@/lib/rate-limit");
    expect(mod).toBeDefined();
    expect(typeof mod).toBe("object");
  });

  it("has expected limiter properties", async () => {
    const mod = await import("@/lib/rate-limit");
    const keys = Object.keys(mod);
    expect(keys.length).toBeGreaterThan(0);
  });
});
