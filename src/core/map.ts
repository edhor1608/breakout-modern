export type MapCell = {
  id: string;
  row: number;
  column: number;
  hits: number;
  x: number;
  y: number;
};

export type ParsedMap = {
  rows: number[][];
  blocks: MapCell[];
};

export const MAP_ROWS = 10;
export const MAP_COLUMNS = 16;

export function parseLegacyMap(source: string): ParsedMap {
  const lines = source
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length !== MAP_ROWS) {
    throw new Error(`Legacy maps must contain ${MAP_ROWS} rows, got ${lines.length}.`);
  }

  const rows = lines.map((line, rowIndex) => {
    const cells = line.split(",").map((cell) => cell.trim());
    if (cells.length !== MAP_COLUMNS) {
      throw new Error(`Map row ${rowIndex + 1} must contain ${MAP_COLUMNS} columns, got ${cells.length}.`);
    }

    return cells.map((cell, columnIndex) => {
      if (!/^\d+$/.test(cell)) {
        throw new Error(`Map cell ${rowIndex + 1}:${columnIndex + 1} must be a non-negative integer.`);
      }
      return Number(cell);
    });
  });

  const blocks = rows.flatMap((row, rowIndex) =>
    row.flatMap((hits, columnIndex) => {
      if (hits === 0) {
        return [];
      }

      return [
        {
          id: `block${columnIndex}_${rowIndex}`,
          row: rowIndex,
          column: columnIndex,
          hits,
          x: 25 + 50 * columnIndex,
          y: 15 + 30 * rowIndex,
        },
      ];
    }),
  );

  return { rows, blocks };
}

export async function loadLegacyMap(name: string): Promise<ParsedMap> {
  const response = await fetch(`/maps/${name}`);
  if (!response.ok) {
    throw new Error(`Could not load map ${name}.`);
  }
  return parseLegacyMap(await response.text());
}
