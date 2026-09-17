import { TILE, Tile, VIEW_H, VIEW_W } from "./constants";
import type { World } from "./world";

export interface Camera {
  x: number;
  y: number;
}

export function cameraFollow(world: World, cam: Camera): void {
  const p = world.player;
  const tx = p.x + p.w / 2 - VIEW_W * 0.38;
  const ty = p.y + p.h / 2 - VIEW_H * 0.62;
  cam.x += (tx - cam.x) * 0.12;
  cam.y += (ty - cam.y) * 0.08;
  cam.x = clamp(cam.x, 0, Math.max(0, world.width - VIEW_W));
  cam.y = clamp(cam.y, 0, Math.max(0, world.height - VIEW_H));
}

export function drawWorld(
  ctx: CanvasRenderingContext2D,
  world: World,
  cam: Camera,
  speech: string,
): void {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawSky(ctx, world.time);
  drawHills(ctx, cam.x, world.time);
  ctx.save();
  ctx.translate(-Math.round(cam.x), -Math.round(cam.y));
  drawTiles(ctx, world);
  drawFlag(ctx, world);
  drawFruits(ctx, world);
  drawEnemies(ctx, world);
  drawPlayer(ctx, world);
  drawSpeech(ctx, world, speech);
  drawParticles(ctx, world);
  ctx.restore();
  drawHud(ctx, world);
}

function drawSky(ctx: CanvasRenderingContext2D, t: number): void {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, "#7ec4e8");
  g.addColorStop(0.45, "#b7e0c2");
  g.addColorStop(1, "#efe7b2");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  for (let i = 0; i < 5; i++) {
    const x = ((t * 12 + i * 210) % (VIEW_W + 160)) - 80;
    const y = 40 + (i % 3) * 36;
    cloud(ctx, x, y, 28 + (i % 2) * 10);
  }

  ctx.fillStyle = "#ffe08a";
  ctx.beginPath();
  ctx.arc(820, 70, 34, 0, Math.PI * 2);
  ctx.fill();
}

function cloud(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
  ctx.arc(x + r * 0.6, y - 6, r * 0.45, 0, Math.PI * 2);
  ctx.arc(x + r * 1.1, y, r * 0.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawHills(ctx: CanvasRenderingContext2D, camX: number, t: number): void {
  ctx.fillStyle = "#8fbf6a";
  ctx.beginPath();
  ctx.moveTo(0, VIEW_H);
  for (let x = 0; x <= VIEW_W; x += 8) {
    const wx = x + camX * 0.25;
    const y = 310 + Math.sin(wx * 0.01 + t * 0.2) * 18 + Math.sin(wx * 0.004) * 28;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(VIEW_W, VIEW_H);
  ctx.fill();

  ctx.fillStyle = "#6ea352";
  ctx.beginPath();
  ctx.moveTo(0, VIEW_H);
  for (let x = 0; x <= VIEW_W; x += 8) {
    const wx = x + camX * 0.45;
    const y = 360 + Math.sin(wx * 0.014) * 22;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(VIEW_W, VIEW_H);
  ctx.fill();
}

function drawTiles(ctx: CanvasRenderingContext2D, world: World): void {
  const { tiles, cols, rows } = world.level;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const t = tiles[r][c];
      if (t === Tile.Empty) continue;
      const x = c * TILE;
      const y = r * TILE;
      if (t === Tile.Grass || t === Tile.Dirt) {
        ctx.fillStyle = t === Tile.Grass ? "#c9843f" : "#8a5a32";
        ctx.fillRect(x, y, TILE, TILE);
        if (t === Tile.Grass) {
          ctx.fillStyle = "#6db24a";
          ctx.fillRect(x, y, TILE, 8);
          ctx.fillStyle = "#81c85a";
          for (let i = 2; i < TILE; i += 6) {
            ctx.fillRect(x + i, y - 3, 2, 5);
          }
        } else {
          ctx.fillStyle = "rgba(0,0,0,0.12)";
          ctx.fillRect(x + 6, y + 10, 8, 5);
        }
      } else if (t === Tile.Brick) {
        roundRect(ctx, x + 1, y + 1, TILE - 2, TILE - 2, 4, "#d96b4a");
        ctx.strokeStyle = "#a3442e";
        ctx.strokeRect(x + 4, y + TILE / 2, TILE - 8, 0.5);
      } else if (t === Tile.Crate) {
        roundRect(ctx, x + 1, y + 1, TILE - 2, TILE - 2, 3, "#d2a05a");
        ctx.strokeStyle = "#8a6430";
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 5, y + 5, TILE - 10, TILE - 10);
        ctx.beginPath();
        ctx.moveTo(x + 5, y + 5);
        ctx.lineTo(x + TILE - 5, y + TILE - 5);
        ctx.moveTo(x + TILE - 5, y + 5);
        ctx.lineTo(x + 5, y + TILE - 5);
        ctx.stroke();
        ctx.lineWidth = 1;
      } else if (t === Tile.Stump) {
        ctx.fillStyle = "#7a4e2a";
        ctx.fillRect(x + 6, y + 4, TILE - 12, TILE - 4);
        ctx.fillStyle = "#c9a36a";
        ctx.beginPath();
        ctx.ellipse(x + TILE / 2, y + 6, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#8a6234";
        ctx.beginPath();
        ctx.ellipse(x + TILE / 2, y + 6, 6, 3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
}

function drawFlag(ctx: CanvasRenderingContext2D, world: World): void {
  const f = world.level.flag;
  ctx.fillStyle = "#8d6a3e";
  ctx.fillRect(f.x + 4, f.y, 5, f.h);
  ctx.fillStyle = "#2c6f3a";
  const wave = Math.sin(world.time * 4) * 4;
  ctx.beginPath();
  ctx.moveTo(f.x + 9, f.y + 8);
  ctx.lineTo(f.x + 52 + wave, f.y + 22);
  ctx.lineTo(f.x + 9, f.y + 36);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fff6c8";
  ctx.font = "bold 11px sans-serif";
  ctx.fillText("通关", f.x + 14, f.y + 24);
  ctx.fillStyle = "#f5c542";
  ctx.beginPath();
  ctx.ellipse(f.x + 8, f.y - 2, 8, 5, -0.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawFruits(ctx: CanvasRenderingContext2D, world: World): void {
  for (const f of world.level.fruits) {
    if (f.taken) continue;
    const bob = Math.sin(world.time * 5 + f.x) * 3;
    if (f.kind === "cherry") {
      ctx.strokeStyle = "#3a7a32";
      ctx.beginPath();
      ctx.moveTo(f.x, f.y + bob - 4);
      ctx.quadraticCurveTo(f.x + 4, f.y + bob - 12, f.x + 8, f.y + bob - 6);
      ctx.stroke();
      ctx.fillStyle = "#e23d4a";
      ctx.beginPath();
      ctx.arc(f.x - 3, f.y + bob, 6, 0, Math.PI * 2);
      ctx.arc(f.x + 5, f.y + bob + 1, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (f.kind === "grape") {
      ctx.fillStyle = "#7b4cc7";
      for (const [dx, dy] of [
        [0, 0],
        [-6, 5],
        [6, 5],
        [0, 9],
      ] as const) {
        ctx.beginPath();
        ctx.arc(f.x + dx, f.y + bob + dy, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = "#ffb14a";
      ctx.beginPath();
      ctx.ellipse(f.x, f.y + bob, 8, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3c8a3a";
      ctx.fillRect(f.x - 2, f.y + bob - 10, 3, 5);
    }
  }
}

function drawEnemies(ctx: CanvasRenderingContext2D, world: World): void {
  for (const e of world.level.enemies) {
    if (!e.alive) continue;
    const wob = Math.sin(world.time * 10 + e.x) * 1.5;
    ctx.fillStyle = "#6fbf4a";
    ctx.beginPath();
    ctx.ellipse(e.x + e.w / 2, e.y + e.h / 2 + wob, e.w * 0.5, e.h * 0.48, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3d7a28";
    ctx.beginPath();
    ctx.ellipse(e.x + e.w / 2, e.y + 6 + wob, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1c1c1c";
    ctx.beginPath();
    ctx.arc(e.x + 8, e.y + 10 + wob, 2.2, 0, Math.PI * 2);
    ctx.arc(e.x + e.w - 8, e.y + 10 + wob, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#2a4a20";
    ctx.beginPath();
    ctx.moveTo(e.x + 8, e.y + 4 + wob);
    ctx.lineTo(e.x + 4, e.y - 4 + wob);
    ctx.moveTo(e.x + e.w - 8, e.y + 4 + wob);
    ctx.lineTo(e.x + e.w - 4, e.y - 4 + wob);
    ctx.stroke();
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, world: World): void {
  const p = world.player;
  const t = world.time;
  const run = p.onGround && Math.abs(p.vx) > 10;
  const flap = !p.onGround ? t * 28 : run ? t * 18 : t * 8;
  const wing = Math.sin(flap) * (p.onGround ? 8 : 16);
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2 + (run ? Math.sin(t * 20) * 1.2 : 0);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(p.facing, 1);
  if (world.status === "lost") ctx.rotate(t * 8);

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.ellipse(-4, -4, 14, 7, -0.5 + wing * 0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(6, -6, 12, 6, 0.4 - wing * 0.04, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e8b84a";
  ctx.beginPath();
  ctx.ellipse(0, 2, 11, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f0c96a";
  ctx.beginPath();
  ctx.ellipse(0, -6, 9, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#d22b2b";
  ctx.beginPath();
  ctx.arc(-5, -8, 5.2, 0, Math.PI * 2);
  ctx.arc(5, -8, 5.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.arc(-4, -8, 1.8, 0, Math.PI * 2);
  ctx.arc(6, -8, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.beginPath();
  ctx.arc(-6, -10, 1.2, 0, Math.PI * 2);
  ctx.arc(4, -10, 1.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#5a3a12";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-3, 10);
  ctx.lineTo(-6, 14);
  ctx.moveTo(3, 10);
  ctx.lineTo(6, 14);
  ctx.moveTo(0, 10);
  ctx.lineTo(0, 15);
  ctx.stroke();
  ctx.restore();
}

function drawSpeech(ctx: CanvasRenderingContext2D, world: World, speech: string): void {
  if (!speech) return;
  const p = world.player;
  ctx.font = "12px sans-serif";
  const w = Math.min(220, ctx.measureText(speech).width + 16);
  const x = p.x + p.w / 2 - w / 2;
  const y = p.y - 28;
  roundRect(ctx, x, y, w, 20, 6, "rgba(255,252,240,0.94)");
  ctx.strokeStyle = "#c9a227";
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, 19);
  ctx.fillStyle = "#3a2a10";
  ctx.fillText(speech, x + 8, y + 14);
}

function drawParticles(ctx: CanvasRenderingContext2D, world: World): void {
  for (const pt of world.particles) {
    ctx.globalAlpha = pt.life / pt.max;
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawHud(ctx: CanvasRenderingContext2D, world: World): void {
  ctx.fillStyle = "rgba(30, 22, 12, 0.45)";
  roundRect(ctx, 12, 10, 210, 36, 8, "rgba(30, 22, 12, 0.45)");
  ctx.fillStyle = "#fff6d8";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText(`果实 ${world.fruits}`, 24, 33);
  ctx.fillText(`时间 ${world.time.toFixed(1)}s`, 110, 33);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}
