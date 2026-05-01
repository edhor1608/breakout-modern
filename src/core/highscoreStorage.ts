import { type HighscoreEntry, sortHighscores } from "./highscore";

const STORAGE_KEY = "breakout-modern.highscores.v1";

export function readHighscores(): HighscoreEntry[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortHighscores(
      parsed.filter(isHighscoreEntry).map((entry) => ({
        name: entry.name,
        destroyedBlocks: entry.destroyedBlocks,
        elapsedSeconds: entry.elapsedSeconds,
        createdAt: entry.createdAt
      }))
    );
  } catch {
    return [];
  }
}

export function writeHighscores(entries: HighscoreEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sortHighscores(entries)));
}

export function addHighscore(entry: HighscoreEntry): HighscoreEntry[] {
  const next = sortHighscores([...readHighscores(), entry]);
  writeHighscores(next);
  return next;
}

export function resetHighscores(): void {
  localStorage.removeItem(STORAGE_KEY);
}

function isHighscoreEntry(value: unknown): value is HighscoreEntry {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.name === "string" &&
    typeof candidate.destroyedBlocks === "number" &&
    typeof candidate.elapsedSeconds === "number" &&
    typeof candidate.createdAt === "string"
  );
}
