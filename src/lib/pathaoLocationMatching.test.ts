import { describe, expect, it } from "vitest";
import { extractPathaoLocationHints, resolvePathaoLocationMatch } from "./pathaoLocationMatching";

describe("pathaoLocationMatching", () => {
  it("infers Dhaka from thana-only address", () => {
    const hints = extractPathaoLocationHints("House 12, Sector 11, Uttara 10");

    expect(hints.cityHints).toContain("Dhaka");
    expect(hints.zoneHints).toContain("Uttara");
  });

  it("matches zone from Bangla thana text", () => {
    const match = resolvePathaoLocationMatch(
      "মিরপুর ১০, ঢাকা",
      [
        { id: "1", name: "Uttara" },
        { id: "2", name: "Mirpur" },
      ],
      ["Mirpur"],
    );

    expect(match?.name).toBe("Mirpur");
  });

  it("avoids ambiguous generic zone auto-pick", () => {
    const hints = extractPathaoLocationHints("Sadar, Bangladesh");

    expect(hints.zoneHints).toEqual([]);
    expect(resolvePathaoLocationMatch("Sadar, Bangladesh", [{ id: "1", name: "Kotwali" }], hints.zoneHints)).toBeNull();
  });
});