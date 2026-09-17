import "./styles.css";
import { DT, VIEW_H, VIEW_W } from "./game/constants";
import { Keyboard } from "./game/input";
import { cameraFollow, drawWorld, type Camera } from "./game/renderer";
import { World } from "./game/world";
import { FlyAgent } from "./agent/flyAgent";
import { renderBrain } from "./ui/brain";
import type { InputState, Mode, Sensors } from "./game/types";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const rawCtx = canvas.getContext("2d");
if (!rawCtx) throw new Error("Canvas unsupported");
const ctx = rawCtx;
ctx.imageSmoothingEnabled = true;

const world = new World();
const agent = new FlyAgent();
const keys = new Keyboard();
const cam: Camera = { x: 0, y: 80 };
let mode: Mode = "auto";
let acc = 0;
let last = performance.now();
let overlayShown = false;

const btnManual = document.getElementById("btn-manual")!;
const btnAuto = document.getElementById("btn-auto")!;
const btnRetry = document.getElementById("btn-retry")!;
const overlay = document.getElementById("overlay")!;

btnManual.addEventListener("click", () => setMode("manual"));
btnAuto.addEventListener("click", () => {
  reset();
  setMode("auto");
});
btnRetry.addEventListener("click", () => reset());

window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "r") reset();
  if (e.key.toLowerCase() === "m") setMode(mode === "auto" ? "manual" : "auto");
});

function setMode(next: Mode): void {
  mode = next;
  btnManual.classList.toggle("active", mode === "manual");
  btnAuto.classList.toggle("active", mode === "auto");
  if (mode === "auto") agent.reset();
}

function reset(): void {
  world.reset();
  agent.reset();
  cam.x = 0;
  cam.y = 80;
  hideOverlay();
}

function hideOverlay(): void {
  overlayShown = false;
  overlay.classList.add("hidden");
  overlay.innerHTML = "";
}

function showOverlay(): void {
  if (world.status === "play" || overlayShown) return;
  overlayShown = true;
  const ok = world.status === "won";
  overlay.classList.remove("hidden");
  const review = !ok && agent.failReview()
    ? `<p class="review">${agent.failReview()}</p>`
    : ok
      ? `<p>控制权：DNp09 / DNa02 / DNp01 读出（LIF），不是大模型。</p>`
      : `<p>Failed — 再试一次。Time ${world.time.toFixed(1)}s</p>`;
  overlay.innerHTML = ok
    ? `<div class="card win"><h2>果蝇通关！</h2><p>Brain readout reached the flag in ${world.time.toFixed(1)}s · 果实 ${world.fruits}</p>${review}<button type="button" class="btn primary" id="again">再来一次 Retry</button></div>`
    : `<div class="card lose"><h2>跌入培养皿…</h2>${review}<button type="button" class="btn primary" id="again">重试 Retry</button></div>`;
  document.getElementById("again")?.addEventListener("click", () => {
    reset();
    if (mode === "auto") agent.reset();
  });
}

function frame(now: number): void {
  const raw = Math.min(0.05, (now - last) / 1000);
  last = now;
  acc += raw;
  while (acc >= DT) {
    let input: InputState;
    let sensors: Sensors | null = null;
    if (mode === "auto" && world.status === "play") {
      const out = agent.act(world);
      input = out.input;
      sensors = out.sensors;
    } else {
      input = keys.snapshot();
      const out = agent.act(world);
      sensors = out.sensors;
    }
    world.step(input, DT);
    renderBrain(agent, sensors, input);
    acc -= DT;
  }

  cameraFollow(world, cam);
  drawWorld(ctx, world, cam, agent.line);
  if (world.status !== "play") showOverlay();
  requestAnimationFrame(frame);
}

function fit(): void {
  const wrap = canvas.parentElement!;
  const maxW = wrap.clientWidth;
  const scale = Math.min(1, maxW / VIEW_W);
  canvas.style.width = `${VIEW_W * scale}px`;
  canvas.style.height = `${VIEW_H * scale}px`;
}

window.addEventListener("resize", fit);
fit();
renderBrain(agent, null, { left: false, right: false, jump: false });
requestAnimationFrame(frame);
