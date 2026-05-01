import { describe, expect, it } from "vitest";
import { createHighscoreEntry, normalizePlayerName, sortHighscores } from "./highscore";

describe("highscores", () => {
  it("keeps the legacy sort order", () => {
    const sorted = sortHighscores([
      createHighscoreEntry("slow", 10, 50),
      createHighscoreEntry("less", 8, 1),
      createHighscoreEntry("fast", 10, 20)
    ]);

    expect(sorted.map((entry) => entry.name)).toEqual(["FAST", "SLOW", "LESS"]);
  });

  it("normalizes and validates player names", () => {
    expect(normalizePlayerName(" jonas ")).toBe("JONAS");
    expect(() => normalizePlayerName("two words")).toThrow("spaces");
    expect(() => normalizePlayerName("abcdefghijkl")).toThrow("10");
  });
});
