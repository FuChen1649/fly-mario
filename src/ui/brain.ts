import type { FlyAgent } from "../agent/flyAgent";
import type { InputState, Sensors } from "../game/types";

const CHANNELS: { key: keyof Sensors; label: string; cn: string }[] = [
  { key: "groundedChannel", label: "Ground", cn: "地面接触" },
  { key: "gapChannel", label: "Gap", cn: "前方沟壑" },
  { key: "loomingChannel", label: "Looming", cn: "敌踪逼近" },
  { key: "wallChannel", label: "Obstacle", cn: "障碍高度" },
  { key: "goalChannel", label: "Chemotaxis", cn: "目标气味" },
];

const INTENT_CN: Record<string, string> = {
  idle: "待机 / Idle",
  run: "趋化奔跑 / Run toward goal",
  "gap-jump": "跨越沟壑 / Gap jump",
  stomp: "回避/踩踏 / Stomp",
  vault: "翻越障碍 / Vault",
  land: "稳定落地 / Land",
  win: "抵达旗杆 / Goal",
  fail: "失败 / Fail",
};

export function renderBrain(
  agent: FlyAgent,
  sensors: Sensors | null,
  input: InputState,
): void {
  const ch = document.getElementById("channels");
  const dec = document.getElementById("decision");
  const mot = document.getElementById("motors");
  const sp = document.getElementById("speech");
  if (!ch || !dec || !mot || !sp) return;

  const s = sensors ?? {
    groundedChannel: 0,
    gapChannel: 0,
    loomingChannel: 0,
    wallChannel: 0,
    goalChannel: 0,
  };

  ch.innerHTML = CHANNELS.map(({ key, label, cn }) => {
    const v = (s as Sensors)[key] as number;
    const pct = Math.round(clamp01(v) * 100);
    return `<div class="ch">
      <div class="ch-lab"><span>${cn}</span><small>${label} ${pct}%</small></div>
      <div class="bar"><i style="width:${pct}%"></i></div>
    </div>`;
  }).join("");

  dec.textContent = INTENT_CN[agent.intent] ?? agent.intent;

  mot.innerHTML = [
    ["← Left", input.left],
    ["→ Right", input.right],
    ["↑ Jump", input.jump],
  ]
    .map(
      ([lab, on]) =>
        `<div class="motor ${on ? "on" : ""}"><b></b><span>${lab}</span></div>`,
    )
    .join("");

  sp.textContent = agent.line;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}
