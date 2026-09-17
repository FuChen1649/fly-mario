import {
  JUMP_LEAD_ENEMY,
  JUMP_LEAD_GAP,
  JUMP_LEAD_WALL,
  JUMP_HOLD_TIME,
  TILE,
} from "../game/constants";
import type { InputState, Intent, Sensors } from "../game/types";
import { isSolidTile } from "../game/level";
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

export class FlyAgent {
  jumpHold = 0;
  intent: Intent = "idle";
  line = "气味在前面。出发。";
  private lastIntent: Intent = "idle";
  private lineUntil = 0;

  reset(): void {
    this.jumpHold = 0;
    this.intent = "idle";
    this.line = "气味在前面。出发。";
    this.lastIntent = "idle";
    this.lineUntil = 0;
  }

  act(world: World): { input: InputState; sensors: Sensors } {
    const sensors = sense(world);
    const input: InputState = { left: false, right: false, jump: false };

    if (world.status === "won") {
      this.setIntent(world.time, "win", "通关。果蝇赢了。");
      return { input, sensors };
    }
    if (world.status === "lost") {
      this.setIntent(world.time, "fail", "掉下去了……再试。");
      return { input, sensors };
    }

    input.right = true;

    const wantGap =
      sensors.gapDist > 4 && sensors.gapDist < JUMP_LEAD_GAP && sensors.gapWidth >= TILE;
    const wantStomp = sensors.enemyDist > 0 && sensors.enemyDist < JUMP_LEAD_ENEMY;
    const wantVault =
      (sensors.wallDist > 0 && sensors.wallDist < JUMP_LEAD_WALL) ||
      (sensors.stepUpDist > 0 && sensors.stepUpDist < JUMP_LEAD_WALL + 8);
    const panic = sensors.pitBelow && sensors.vy > 0;
    const needJump = wantGap || wantStomp || wantVault || panic;

    if (sensors.onGround && !needJump) this.jumpHold = 0;
    if (needJump) this.jumpHold = JUMP_HOLD_TIME;

    if (this.jumpHold > 0) {
      input.jump = true;
      this.jumpHold -= 1 / 60;
    }

    if (sensors.goalDist < 40 && sensors.onGround) {
      this.setIntent(world.time, "win", "旗杆到了。");
    } else if (wantStomp) {
      this.setIntent(world.time, "stomp", pick(world.time, ["蚜虫靠近，跳。", "踩过去。", "虫子！起跳。"]));
    } else if (wantGap) {
      this.setIntent(world.time, "gap-jump", pick(world.time, ["前方有沟，跳。", "沟！起跳。", "别掉下去，跳。"]));
    } else if (wantVault) {
      this.setIntent(world.time, "vault", pick(world.time, ["障碍，跳上去。", "墙！跳。", "箱子，翻过去。"]));
    } else if (!sensors.onGround) {
      this.setIntent(world.time, "land", "稳稳落地。");
    } else {
      this.setIntent(world.time, "run", pick(world.time, ["冲向终点。", "气味在前面。", "继续飞奔。"]));
    }

    return { input, sensors };
  }

  private setIntent(time: number, intent: Intent, line: string): void {
    this.intent = intent;
    if (intent !== this.lastIntent || time >= this.lineUntil) {
      this.line = line;
      this.lastIntent = intent;
      this.lineUntil = time + (intent === "run" ? 1.8 : 1.15);
    }
  }
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

function pick(t: number, lines: string[]): string {
  return lines[Math.floor(t * 3) % lines.length]!;
}
