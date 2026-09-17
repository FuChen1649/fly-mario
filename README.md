# Fly Mario / 果蝇闯关

A browser Mario-style platformer whose **joystick is a fruit-fly neural circuit**, not a language model.

Game state → fixed sensory atlas → flyputer-style **2-hop LIF** → descending-neuron readout → left / right / jump.

This is original art and physics (no Nintendo ROM, assets, or characters). It is **not** a 138k-neuron FlyWire whole-brain simulation.

---

## English

### Control authority (locked)

| Role | What it does |
| --- | --- |
| **Fly circuit (main controller)** | Every tick: encode sensors onto named cells, step LIF, read DNp09 / DNa02 / MDN / DNp01 (Giant Fiber) into Mario actions. |
| **LLM (optional only)** | A) sensory-current recipe overlay (clamped, cannot drive DNs) · B) 旁白 from firing · C) post-fail review. **Never** left/right/jump. |

Default Auto Fly **clears the demo level with no API key**.

### Tick loop

1. Observe (position, ground, gap, enemy, goal) from game state, not pixels.
2. Encoder (frozen atlas; optional LLM A) injects current into named sensory channels.
3. LIF on a **reduced 21-cell 2-hop subcircuit** (honest: not 138k). Persistent V / Isyn.
4. DN / motor-like readout → actions.
5. Apply to Mario physics.
6. Feedback; 旁白 from linear templates (or LLM B); optional learning-style fail review (LLM C).

### What is real

- Cell **names and roles** follow the published DN dictionary used by [flyputer](https://github.com/migkapa/flyputer): DNp09 walk, DNa02 steer, MDN backup, DNp01 escape; LC4/LPLC2 looming → Giant Fiber.
- LIF implementation follows flyputer `flysim.run_lif` (current-based, Shiu-style ACh+/GABA−).
- Listed FlyWire v783 root IDs for named DNs come from the public fly-brain atlas.

### What is reduced / demo-tuned

- **21 neurons**, not 138,639. Weights are tuned so this platformer closed loop works; they are **not** dumped FlyWire synapse counts.
- VNC/muscles are missing from the brain dataset — a labelled `MotorPlant` holds jump after a Giant Fiber pulse, as in flyputer’s virtual body.
- Optional `scripts/download-connectome.sh` fetches annotations (CC BY-NC). The 852 MB graph is not required to play.

See [docs/CIRCUIT.md](docs/CIRCUIT.md).

### Run

```bash
npm install
npm run dev
```

Open the printed URL (default `http://localhost:5173`). Auto Fly starts immediately.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck + production bundle |
| `npm test` | Headless LIF rollout **must** reach the flag |
| `npm run sim` | Same must-win contract |

Controls: `← →` / `A D` move, `Space` / `W` / `K` jump, `R` retry, `M` toggle mode.

### Optional LLM (旁白 / recipe only)

Set `VITE_FLY_LLM_URL` (OpenAI-compatible chat completions), optionally `VITE_FLY_LLM_MODEL` and `VITE_FLY_LLM_KEY`. Gameplay still runs if the endpoint is down. Overlay currents cannot target descending neurons.

---

## 中文

**果蝇回路是主控，大模型不当摇杆。**

每一步：观察关卡几何 → 固定感觉图谱把沟/蚜虫/墙/终点写成命名感觉通道的电流 → 21 细胞、2 跳 LIF（flyputer 风格，**不是** 13.8 万全脑）→ 读 DNp09（前进→右）、DNa02（转向）、DNp01 巨纤维（逃逸跳）→ 作用到马里奥物理 → 旁白。

默认 **Auto Fly 离线通关**，不需要 API Key。配置了 OpenAI 兼容接口时，模型只能：写感觉配方（且钳位在感觉层）、写旁白、失败后复盘。

这是向 flyputer / fly-brain / talking-fly 致敬的浏览器演示：原创像素、原创物理，非任天堂素材。连接组数据若另下，遵循 FlyWire CC BY-NC。

---

## Layout

```
src/game/     physics, original-art renderer, demo level
src/brain/    atlas encoder, LIF, DN readout, reduced circuit
src/agent/    closed loop + optional LLM A/B/C
src/ui/       brain panel
src/sim/      headless must-win rollout
docs/         circuit honesty notes
scripts/      optional FlyWire annotation download
```
