import { describe, expect, it } from "vitest";
import { getReadingStatus, normalizeProgress } from "./reading-progress";

describe("reading progress frontend", () => {
  it("menormalisasi progress rasio maupun persentase", () => {
    expect(normalizeProgress(0.42)).toBe(42);
    expect(normalizeProgress(68)).toBe(68);
    expect(normalizeProgress(null, "finished")).toBe(100);
  });

  it("mengubah progress menjadi status baca yang konsisten", () => {
    expect(getReadingStatus(0)).toBe("unread");
    expect(getReadingStatus(40)).toBe("reading");
    expect(getReadingStatus(95)).toBe("finished");
  });
});
