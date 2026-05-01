export type HighscoreEntry = {
  name: string;
  destroyedBlocks: number;
  elapsedSeconds: number;
  createdAt: string;
};

export const MAX_HIGHSCORES = 10;

export function normalizePlayerName(name: string): string {
  const normalized = name.trim().toUpperCase();
  if (!normalized || normalized.includes(" ")) {
    throw new Error("Name must not be empty or contain spaces.");
  }
  if (normalized.length > 10) {
    throw new Error("Name must be 10 characters or fewer.");
  }
  return normalized;
}

export function sortHighscores(entries: HighscoreEntry[]): HighscoreEntry[] {
  return [...entries]
    .sort((left, right) => {
      if (left.destroyedBlocks !== right.destroyedBlocks) {
        return right.destroyedBlocks - left.destroyedBlocks;
      }
      return left.elapsedSeconds - right.elapsedSeconds;
    })
    .slice(0, MAX_HIGHSCORES);
}

export function createHighscoreEntry(name: string, destroyedBlocks: number, elapsedSeconds: number): HighscoreEntry {
  return {
    name: normalizePlayerName(name),
    destroyedBlocks,
    elapsedSeconds,
    createdAt: new Date().toISOString()
  };
}
