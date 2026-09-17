import {
  COYOTE,
  DT,
  GRAVITY,
  JUMP_CUT,
  JUMP_VEL,
  MAX_FALL,
  MOVE_SPEED,
  PLAYER_H,
  PLAYER_W,
  TILE,
} from "./constants";
import { buildLevel, cloneLevel, isSolidTile, type LevelData } from "./level";
import type { InputState, Particle, Player, Status } from "./types";

export class World {
  level: LevelData;
  player: Player;
  status: Status = "play";
  time = 0;
  fruits = 0;
  particles: Particle[] = [];
  private template: LevelData;

  constructor(template: LevelData = buildLevel()) {
    this.template = template;
    this.level = cloneLevel(template);
    this.player = this.makePlayer();
  }

  reset(): void {
    this.level = cloneLevel(this.template);
    this.player = this.makePlayer();
    this.status = "play";
    this.time = 0;
    this.fruits = 0;
    this.particles = [];
  }

  get width(): number {
    return this.level.cols * TILE;
  }

  get height(): number {
    return this.level.rows * TILE;
  }

  step(input: InputState, dt: number = DT): void {
    if (this.status !== "play") return;
    this.time += dt;
    this.movePlayer(input, dt);
    this.moveEnemies(dt);
    this.collectFruits();
    this.collideEnemies();
    this.checkFlag();
    this.updateParticles(dt);

    if (this.player.y > this.height - 8) this.die();
  }

  tileAt(tx: number, ty: number): number {
    if (tx < 0 || tx >= this.level.cols) return 1;
    if (ty < 0 || ty >= this.level.rows) return 0;
    return this.level.tiles[ty][tx];
  }

  solidAtPixel(px: number, py: number): boolean {
    return isSolidTile(this.tileAt(Math.floor(px / TILE), Math.floor(py / TILE)));
  }

  private makePlayer(): Player {
    return {
      x: this.level.spawnX,
      y: this.level.spawnY,
      vx: 0,
      vy: 0,
      w: PLAYER_W,
      h: PLAYER_H,
      onGround: false,
      coyote: 0,
      jumpHeld: false,
      facing: 1,
    };
  }

  private movePlayer(input: InputState, dt: number): void {
    const p = this.player;
    if (input.left === input.right) p.vx = 0;
    else if (input.left) {
      p.vx = -MOVE_SPEED;
      p.facing = -1;
    } else {
      p.vx = MOVE_SPEED;
      p.facing = 1;
    }

    if (p.onGround) p.coyote = COYOTE;
    else p.coyote = Math.max(0, p.coyote - dt);

    const jumpNow = input.jump && !p.jumpHeld;
    if (jumpNow && p.coyote > 0) {
      p.vy = JUMP_VEL;
      p.onGround = false;
      p.coyote = 0;
      this.burst(p.x + p.w / 2, p.y + p.h, "#c4a574", 6);
    }
    if (!input.jump && p.vy < 0) p.vy *= JUMP_CUT;
    p.jumpHeld = input.jump;

    p.vy = Math.min(MAX_FALL, p.vy + GRAVITY * dt);

    const wasGrounded = p.onGround;
    p.x += p.vx * dt;
    this.collideAxis("x");
    p.y += p.vy * dt;
    p.onGround = false;
    this.collideAxis("y");
    if (p.onGround && !wasGrounded && p.vy >= 0) {
      this.burst(p.x + p.w / 2, p.y + p.h, "#d9c29a", 4);
    }
  }

  private collideAxis(axis: "x" | "y"): void {
    const p = this.player;
    const x0 = Math.floor(p.x / TILE);
    const x1 = Math.floor((p.x + p.w - 0.001) / TILE);
    const y0 = Math.floor(p.y / TILE);
    const y1 = Math.floor((p.y + p.h - 0.001) / TILE);

    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (!isSolidTile(this.tileAt(tx, ty))) continue;
        const rx = tx * TILE;
        const ry = ty * TILE;
        if (axis === "x") {
          if (p.vx > 0) p.x = rx - p.w;
          else if (p.vx < 0) p.x = rx + TILE;
          else {
            const cx = p.x + p.w / 2;
            p.x = cx < rx + TILE / 2 ? rx - p.w : rx + TILE;
          }
          p.vx = 0;
        } else {
          if (p.vy > 0) {
            p.y = ry - p.h;
            p.vy = 0;
            p.onGround = true;
          } else if (p.vy < 0) {
            p.y = ry + TILE;
            p.vy = 0;
          }
        }
      }
    }
  }

  private moveEnemies(dt: number): void {
    for (const e of this.level.enemies) {
      if (!e.alive) continue;
      e.x += e.vx * dt;
      if (e.x < e.left) {
        e.x = e.left;
        e.vx = Math.abs(e.vx);
      } else if (e.x + e.w > e.right) {
        e.x = e.right - e.w;
        e.vx = -Math.abs(e.vx);
      }
      const front = e.vx > 0 ? e.x + e.w + 2 : e.x - 2;
      const footY = e.y + e.h + 2;
      if (!this.solidAtPixel(front, footY) || this.solidAtPixel(front, e.y + e.h * 0.5)) {
        e.vx *= -1;
      }
    }
  }

  private collectFruits(): void {
    const p = this.player;
    for (const f of this.level.fruits) {
      if (f.taken) continue;
      const dx = p.x + p.w / 2 - f.x;
      const dy = p.y + p.h / 2 - f.y;
      if (dx * dx + dy * dy < (f.r + 12) * (f.r + 12)) {
        f.taken = true;
        this.fruits += 1;
        this.burst(f.x, f.y, "#ff5b7a", 10);
      }
    }
  }

  private collideEnemies(): void {
    const p = this.player;
    for (const e of this.level.enemies) {
      if (!e.alive) continue;
      if (!overlap(p, e)) continue;
      const stomp = p.vy > 80 && p.y + p.h < e.y + e.h * 0.6;
      if (stomp) {
        e.alive = false;
        p.vy = -360;
        p.onGround = false;
        this.burst(e.x + e.w / 2, e.y, "#6fbf4a", 12);
      } else {
        this.die();
        return;
      }
    }
  }

  private checkFlag(): void {
    if (overlap(this.player, this.level.flag)) this.win();
  }

  private win(): void {
    this.status = "won";
    this.player.vx = 0;
    this.burst(this.level.flag.x, this.player.y, "#ffd35a", 18);
  }

  private die(): void {
    if (this.status !== "play") return;
    this.status = "lost";
    this.player.vx = 0;
  }

  private burst(x: number, y: number, color: string, n: number): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 40 + Math.random() * 90;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 30,
        life: 0.35 + Math.random() * 0.25,
        max: 0.6,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  private updateParticles(dt: number): void {
    this.particles = this.particles.filter((pt) => {
      pt.life -= dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 420 * dt;
      return pt.life > 0;
    });
  }
}

function overlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
