import { cn } from "@/lib/utils";

describe("cn (class name utility)", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("handles undefined and null", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end");
  });

  it("deduplicates tailwind classes", () => {
    const result = cn("p-4 text-red-500", "p-2");
    expect(result).toContain("p-2");
    expect(result).not.toContain("p-4");
  });
});
