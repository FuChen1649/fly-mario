import { TILE } from "../game/constants";
import { isSolidTile } from "../game/level";
import type { Sensors } from "../game/types";
import type { World } from "../game/world";

const INF = 9999;

export function sense(world: World): Sensors {
  const p = world.player;
  const right = p.x + p.w;
  const midX = p.x + p.w * 0.5;
  const footRow = standingRow(world, midX, p.y, p.h);
  const startCol = Math.max(0, Math.ceil((right + 1) / TILE));

  let gapDist = INF;
  let gapWidth = 0;
  for (let c = startCol; c < startCol + 14; c++) {
    if (!isSolidTile(world.tileAt(c, footRow))) {
      gapDist = c * TILE - right;
      let w = 0;
      for (let k = c; k < c + 10; k++) {
        if (!isSolidTile(world.tileAt(k, footRow))) w += 1;
        else break;
      }
      gapWidth = w * TILE;
      break;
    }
  }

  let wallDist = INF;
  let stepUpDist = INF;
  const chestY = p.y + p.h * 0.45;
  const shinY = p.y + p.h * 0.85;
  for (let c = startCol; c < startCol + 10; c++) {
    const dist = c * TILE - right;
    if (world.solidAtPixel(c * TILE + 4, chestY)) {
      wallDist = dist;
      break;
    }
    if (world.solidAtPixel(c * TILE + 4, shinY) && dist < stepUpDist) {
      stepUpDist = dist;
    }
  }

  let enemyDist = INF;
  for (const e of world.level.enemies) {
    if (!e.alive) continue;
    if (e.y + e.h < p.y - 8) continue;
    if (e.y > p.y + p.h + 24) continue;
    const d = e.x - right;
    if (d > -e.w && d < enemyDist) enemyDist = Math.max(0, d);
  }

  const pitBelow =
    !world.solidAtPixel(midX, p.y + p.h + 6) &&
    !world.solidAtPixel(midX, p.y + p.h + TILE + 6) &&
    !p.onGround;

  const goalDist = Math.max(0, world.level.flag.x - right);

  const groundedChannel = p.onGround ? 1 : Math.max(0, 1 - Math.abs(p.vy) / 700);
  const loomingChannel = clamp01(1 - enemyDist / 220);
  const gapChannel = clamp01(1 - Math.max(0, gapDist) / 200);
  const wallChannel = clamp01(1 - Math.min(wallDist, stepUpDist) / 140);
  const goalChannel = clamp01(1 - goalDist / 2800);

  return {
    x: p.x,
    y: p.y,
    vx: p.vx,
    vy: p.vy,
    onGround: p.onGround,
    goalDist,
    gapDist,
    gapWidth,
    enemyDist,
    wallDist,
    stepUpDist,
    pitBelow,
    groundedChannel,
    loomingChannel,
    gapChannel,
    wallChannel,
    goalChannel,
  };
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function standingRow(world: World, px: number, py: number, ph: number): number {
  const start = Math.floor((py + ph + 1) / TILE);
  const col = Math.floor(px / TILE);
  for (let r = start; r < world.level.rows; r++) {
    if (isSolidTile(world.tileAt(col, r))) return r;
  }
  return start;
}
