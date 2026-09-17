import { TILE, Tile } from "./constants";
import type { Enemy, Flag, Fruit } from "./types";

export interface LevelData {
  cols: number;
  rows: number;
  tiles: Tile[][];
  spawnX: number;
  spawnY: number;
  flag: Flag;
  enemies: Enemy[];
  fruits: Fruit[];
}

function emptyGrid(cols: number, rows: number): Tile[][] {
  return Array.from({ length: rows }, () => Array<Tile>(cols).fill(Tile.Empty));
}

function fillGround(tiles: Tile[][], c0: number, c1: number, groundRow: number): void {
  const rows = tiles.length;
  const cols = tiles[0].length;
  for (let c = Math.max(0, c0); c < Math.min(cols, c1); c++) {
    tiles[groundRow][c] = Tile.Grass;
    for (let r = groundRow + 1; r < rows; r++) tiles[r][c] = Tile.Dirt;
  }
}

function put(tiles: Tile[][], c: number, r: number, t: Tile): void {
  if (r >= 0 && r < tiles.length && c >= 0 && c < tiles[0].length) tiles[r][c] = t;
}

function enemy(xTile: number, groundRow: number, left: number, right: number): Enemy {
  return {
    x: xTile * TILE + 3,
    y: groundRow * TILE - 22,
    vx: 55,
    w: 26,
    h: 22,
    left: left * TILE,
    right: right * TILE,
    alive: true,
  };
}

/**
 * Demo course tuned so a run-right + lookahead jumper can clear it:
 * every enemy patrol has ≥8 tiles of solid ground after it (jump travel ~6 tiles).
 */
export function buildLevel(): LevelData {
  const cols = 110;
  const rows = 18;
  const ground = 14;
  const tiles = emptyGrid(cols, rows);

  fillGround(tiles, 0, 13, ground);
  // 2-tile pit at 13–15
  fillGround(tiles, 15, 38, ground);
  // 3-tile pit at 38–41
  fillGround(tiles, 41, 50, ground);
  // crate bridge over pit 50–56
  for (let c = 51; c <= 54; c++) put(tiles, c, 12, Tile.Crate);
  fillGround(tiles, 56, 84, ground);
  // 3-tile pit at 84–87
  fillGround(tiles, 87, 110, ground);

  for (let c = 20; c <= 23; c++) put(tiles, c, 10, Tile.Brick);

  put(tiles, 64, 13, Tile.Crate);
  put(tiles, 64, 12, Tile.Crate);
  put(tiles, 65, 13, Tile.Crate);

  put(tiles, 72, 13, Tile.Stump);
  put(tiles, 73, 13, Tile.Stump);

  put(tiles, 92, 13, Tile.Crate);
  put(tiles, 93, 13, Tile.Crate);
  put(tiles, 93, 12, Tile.Crate);
  put(tiles, 94, 13, Tile.Crate);
  put(tiles, 94, 12, Tile.Crate);
  put(tiles, 94, 11, Tile.Crate);

  for (let r = 0; r < rows; r++) {
    put(tiles, 0, r, r >= ground ? Tile.Dirt : Tile.Dirt);
    put(tiles, cols - 1, r, Tile.Dirt);
  }
  put(tiles, 0, ground, Tile.Grass);

  const fruits: Fruit[] = [
    { x: 21 * TILE + 16, y: 10 * TILE - 18, r: 8, taken: false, kind: "cherry" },
    { x: 22 * TILE + 16, y: 10 * TILE - 18, r: 8, taken: false, kind: "cherry" },
    { x: 52 * TILE + 16, y: 12 * TILE - 18, r: 9, taken: false, kind: "grape" },
    { x: 74 * TILE + 16, y: ground * TILE - 48, r: 10, taken: false, kind: "peach" },
    { x: 94 * TILE + 16, y: 11 * TILE - 20, r: 8, taken: false, kind: "cherry" },
    { x: 100 * TILE + 16, y: ground * TILE - 40, r: 9, taken: false, kind: "grape" },
  ];

  const enemies: Enemy[] = [
    enemy(24, ground, 18, 32),
    enemy(68, ground, 66, 74),
    enemy(98, ground, 96, 103),
  ];

  return {
    cols,
    rows,
    tiles,
    spawnX: 3 * TILE,
    spawnY: ground * TILE - 28,
    flag: {
      x: 105 * TILE + 4,
      y: (ground - 5) * TILE,
      w: 22,
      h: 5 * TILE,
    },
    enemies,
    fruits,
  };
}

export function cloneLevel(src: LevelData): LevelData {
  return {
    cols: src.cols,
    rows: src.rows,
    tiles: src.tiles.map((row) => row.slice()),
    spawnX: src.spawnX,
    spawnY: src.spawnY,
    flag: { ...src.flag },
    enemies: src.enemies.map((e) => ({ ...e })),
    fruits: src.fruits.map((f) => ({ ...f })),
  };
}

export function isSolidTile(t: Tile): boolean {
  return t !== Tile.Empty;
}
