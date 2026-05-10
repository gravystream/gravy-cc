import { formatMessagePreview } from "@/lib/formatMessagePreview";

describe("formatMessagePreview", () => {
  it("returns a string", () => {
    expect(typeof formatMessagePreview("Hello world")).toBe("string");
  });

  it("handles empty string", () => {
    expect(typeof formatMessagePreview("")).toBe("string");
  });

  it("handles long content", () => {
    const result = formatMessagePreview("a".repeat(500));
    expect(result.length).toBeLessThanOrEqual(500);
  });

  it("handles content with special chars", () => {
    expect(typeof formatMessagePreview("<b>Bold</b> & test")).toBe("string");
  });
});
