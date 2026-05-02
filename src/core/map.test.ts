import { describe, expect, it } from "vitest";
import { parseLegacyMap } from "./map";

const legacyMap = Array.from({ length: 10 }, (_, row) =>
  Array.from({ length: 16 }, (_, column) => (row === 0 && column === 0 ? 4 : 0)).join(","),
).join("\n");

describe("parseLegacyMap", () => {
  it("parses the old 10 by 16 map format", () => {
    const parsed = parseLegacyMap(legacyMap);

    expect(parsed.rows).toHaveLength(10);
    expect(parsed.rows[0]).toHaveLength(16);
    expect(parsed.blocks).toEqual([
      {
        id: "block0_0",
        row: 0,
        column: 0,
        hits: 4,
        x: 25,
        y: 15,
      },
    ]);
  });

  it("rejects malformed maps clearly", () => {
    expect(() => parseLegacyMap("1,2,3")).toThrow("10 rows");
  });
});
