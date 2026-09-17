# Fly Mario / 果蝇闯关

A self-contained **browser Mario-style platformer** where a fruit-fly-inspired agent senses the stage, decides, and motors its way to the flag.

This is a **homage demo** to 2026 fruit-fly connectome + LLM experiments (fly-brain / flyputer / talking-fly). It does **not** download or claim to run a real ~138k-neuron FlyWire model, and it does **not** use Nintendo ROM, assets, or characters.

---

## English

### What it is

- Original 2D canvas game: run, jump, pits, aphids, crates, flag.
- Two modes: **Manual** (keyboard) and **Auto Fly**.
- Default agent is an **offline heuristic planner** (sensors from game state, not pixels). It is tuned to clear the shipped level reliably / deterministically.
- Brain panel: sensory channels → decision → motor out (metaphor for neural readout) plus short Chinese talking-fly lines (`前方有沟，跳。`).

### Run

```bash
npm install
npm run dev
```

Open the printed local URL (default `http://localhost:5173`).

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Serve `dist/` |
| `npm test` | Headless sim: agent must reach the flag |

Controls: `← →` / `A D` move, `Space` / `W` / `K` jump, `R` retry, `M` toggle mode. Or use the buttons.

### What the fly agent is (and is not)

**Is:** a tiny sense→decide→act loop.

1. **Sense** (state, not pixels): position, grounded, distance to next gap / enemy / wall, distance to goal.
2. **Decide:** always taxis toward the flag; jump when a gap, aphid, or crate is inside a tuned lead distance.
3. **Act:** left / right / jump. Hold jump briefly for full height.
4. **Narrate:** short Chinese lines when the intent changes.

**Is not:** FlyWire weights, a 138k-neuron connectome, or an LLM by default. Optional later hook: set `VITE_FLY_LLM_URL` (see `src/agent/llmHook.ts`) to swap narration only. Gameplay never requires a network.

### Proof

`npm test` rolls the shipped level at a fixed 60 Hz timestep. The agent must finish `won` without dying. Two rollouts must match (deterministic).

---

## 中文

### 这是什么

- 原创 2D 平台跳跃（画布绘制，非任天堂素材）：跑、跳、沟、蚜虫、木箱、旗杆。
- **手动** 与 **自动果蝇** 两种模式；自动模式可一键通关，成功/失败可重试。
- 默认 Agent 完全离线：从游戏状态读传感器，用启发式规划器清关，不依赖大模型。
- 脑区面板把感觉通道、决策、运动输出画出来（神经读出的隐喻），并配中文旁白。

### 运行

```bash
npm install
npm run dev
```

浏览器打开终端里的本地地址。`npm run build` 用于生产构建；`npm test` 用无头仿真证明 Agent 能通关。

### 果蝇 Agent 是什么（不是什么）

这是向果蝇连接组 / talking-fly 演示致敬的**玩具大脑**，不是真实 FlyWire 权重，也不会去下载 13.8 万神经元模拟。

感知来自关卡几何：脚下是否有地、前方沟宽、蚜虫距离、墙/箱子、终点气味（距离）。决策是「向右趋化 + 提前起跳」。旁白只是读出口袋里的短句。

---

## Layout

```
src/game/     physics, level, renderer
src/agent/    sensors + heuristic fly + optional LLM hook
src/ui/       brain panel
src/sim/      headless clear rollout
tests/        must-win contract
```
