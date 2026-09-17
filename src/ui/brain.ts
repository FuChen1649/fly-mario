import type { FlyAgent } from "../agent/flyAgent";
import { INDEX, NEURONS } from "../brain/circuit";
import type { InputState, Sensors } from "../game/types";

const CHANNELS: { key: string; label: string; cn: string }[] = [
  { key: "ground", label: "JO_ground", cn: "地面接触" },
  { key: "gap", label: "L1_gap", cn: "前方沟壑" },
  { key: "loom", label: "LC4/LPLC2", cn: "敌踪逼近" },
  { key: "wall", label: "L1_wall", cn: "障碍高度" },
  { key: "sugar", label: "GRN_sugar", cn: "目标气味" },
];

const INTENT_CN: Record<string, string> = {
  idle: "静息 / Idle",
  run: "DNp09 前进 / Walk",
  "gap-jump": "DNp01 跨沟 / Giant Fiber",
  stomp: "LC4→DNp01 逃逸 / Escape",
  vault: "障碍起跳 / Vault",
  land: "IN_hold 落地 / Hold",
  win: "抵达旗杆 / Goal",
  fail: "失败 / Fail",
};

const DN_SHOW = ["DNp09_L", "DNp09_R", "DNa02_R", "DNa02_L", "MDN", "DNp01_L", "DNp01_R", "IN_hold"] as const;

export function renderBrain(
  agent: FlyAgent,
  _sensors: Sensors | null,
  input: InputState,
): void {
  const ch = document.getElementById("channels");
  const dec = document.getElementById("decision");
  const mot = document.getElementById("motors");
  const sp = document.getElementById("speech");
  const dns = document.getElementById("dns");
  const llm = document.getElementById("llm-status");
  if (!ch || !dec || !mot || !sp) return;

  const stim = agent.lastTick?.stimulus.channels ?? {
    ground: 0,
    gap: 0,
    loom: 0,
    wall: 0,
    sugar: 0,
  };

  ch.innerHTML = CHANNELS.map(({ key, label, cn }) => {
    const v = stim[key] ?? 0;
    const pct = Math.round(clamp01(v / 46) * 100);
    return `<div class="ch">
      <div class="ch-lab"><span>${cn}</span><small>${label} ${pct}%</small></div>
      <div class="bar"><i style="width:${pct}%"></i></div>
    </div>`;
  }).join("");

  dec.textContent = INTENT_CN[agent.intent] ?? agent.intent;

  if (dns) {
    const rates = agent.lastTick?.ratesHz;
    dns.innerHTML = DN_SHOW.map((name) => {
      const hz = rates ? rates[INDEX[name]] : 0;
      const on = hz > 20;
      const spec = NEURONS.find((n) => n.name === name);
      return `<div class="dn ${on ? "on" : ""}" title="${spec?.role ?? ""}">
        <b></b><span>${name}</span><small>${hz.toFixed(0)} Hz</small>
      </div>`;
    }).join("");
  }

  mot.innerHTML = [
    ["← Left", input.left, "DNa02_L/MDN"],
    ["→ Right", input.right, "DNp09/DNa02_R"],
    ["↑ Jump", input.jump, "DNp01/IN_hold"],
  ]
    .map(
      ([lab, on, src]) =>
        `<div class="motor ${on ? "on" : ""}"><b></b><span>${lab}</span><small>${src}</small></div>`,
    )
    .join("");

  sp.textContent = agent.line;
  if (llm) {
    const enabled = Boolean(agent.lastTick?.llm.enabled);
    llm.textContent = enabled
      ? "LLM：仅旁白 / 感觉配方（非摇杆）"
      : "LLM：关闭 · 图谱+回路离线通关";
  }
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}
