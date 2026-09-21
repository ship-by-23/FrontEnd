import { describe, expect, it } from "vitest";
import { cn, formatDate } from "./utils";

describe("utility frontend", () => {
  it("menyelesaikan konflik utility Tailwind dengan nilai terakhir", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("mengembalikan fallback untuk tanggal yang tidak valid", () => {
    expect(formatDate("bukan-tanggal")).toBe("Tanggal tidak tersedia");
    expect(formatDate(null)).toBe("Tanggal tidak tersedia");
  });
});
