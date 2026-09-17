/**
 * Reduced 2-hop sensorimotor subcircuit for Fly Mario.
 *
 * HONESTY
 * - This is NOT the full FlyWire adult brain (~138,639 neurons, ~5M synapses).
 * - It is a flyputer-style 2-hop motif: sensory → interneuron → descending neuron.
 * - Cell **names** and **roles** follow published DN→behavior and looming-escape
 *   dictionaries (DNp09 walk, DNa02 steer, MDN backup, DNp01 Giant Fiber jump,
 *   LC4/LPLC2 looming). Listed FlyWire v783 root IDs come from the public
 *   fly-brain neuron atlas / FlyWire annotations.
 * - Synaptic **weights are demo-tuned** for a platformer closed loop. They are
 *   not dumped FlyWire synapse counts. Optional `scripts/download-connectome.sh`
 *   fetches the real CC BY-NC graph for exploration.
 *
 * Sign convention (Shiu / flyputer toy): ACh = excitatory (+), GABA/Glu = inhibitory (−).
 */

import type { CircuitData, NeuronName, NeuronSpec, SynapseSpec } from "./types";

export const STEPS_PER_TICK = 40; // 40 × 0.5 ms = 20 ms of brain time per game frame

export const NEURONS: NeuronSpec[] = [
  {
    name: "GRN_sugar",
    layer: "sensory",
    nt: "ACh",
    flywireIds: [720575940616885538, 720575940630233916],
    role: "Sugar gustatory receptor neuron — goal chemotaxis",
    roleCn: "甜味感觉神经元 · 终点趋化",
  },
  {
    name: "JO_ground",
    layer: "sensory",
    nt: "ACh",
    flywireIds: [720575940645106376],
    role: "Johnston organ / mechanosensory — substrate contact",
    roleCn: "约翰斯顿器官 · 地面接触",
  },
  {
    name: "LC4",
    layer: "sensory",
    nt: "ACh",
    flywireIds: [720575940605598892, 720575940611134833],
    role: "Lobula columnar LC4 — looming / approaching object",
    roleCn: "LC4 视觉投射 · 敌踪逼近",
  },
  {
    name: "LPLC2",
    layer: "sensory",
    nt: "ACh",
    flywireIds: [],
    role: "LPLC2 looming detector (flyputer escape circuit partner of LC4)",
    roleCn: "LPLC2 掠食逼近检测",
  },
  {
    name: "L1_gap",
    layer: "sensory",
    nt: "ACh",
    flywireIds: [],
    role: "Lamina L1-style contrast: missing ground ahead (void 'loom')",
    roleCn: "L1 式对比 · 前方沟壑",
  },
  {
    name: "L1_wall",
    layer: "sensory",
    nt: "ACh",
    flywireIds: [],
    role: "Near-field obstacle / step-up contrast",
    roleCn: "近距障碍 / 台阶",
  },
  {
    name: "JO_fall",
    layer: "sensory",
    nt: "ACh",
    flywireIds: [],
    role: "Loss of substrate while falling",
    roleCn: "悬空下落机械感觉",
  },
  {
    name: "T4_progress",
    layer: "sensory",
    nt: "ACh",
    flywireIds: [],
    role: "T4-like preferred-direction motion (rightward progress)",
    roleCn: "T4 式方向运动 · 向右进展",
  },
  {
    name: "IN_walk",
    layer: "interneuron",
    nt: "ACh",
    flywireIds: [],
    role: "Walk command internuncial (2-hop, GRN → DN)",
    roleCn: "步行指令中间神经元",
  },
  {
    name: "IN_steer_R",
    layer: "interneuron",
    nt: "ACh",
    flywireIds: [],
    role: "Right-steering internuncial onto DNa02_R / DNp09",
    roleCn: "右转中间元",
  },
  {
    name: "IN_threat",
    layer: "interneuron",
    nt: "ACh",
    flywireIds: [],
    role: "Pooled looming / gap / wall threat",
    roleCn: "威胁整合",
  },
  {
    name: "IN_jump_AND",
    layer: "interneuron",
    nt: "ACh",
    flywireIds: [],
    role: "AND-like motif: threat and ground contact (flyputer logic-gate style)",
    roleCn: "威胁 ∧ 着地 → 起跳门控",
  },
  {
    name: "IN_hold",
    layer: "interneuron",
    nt: "ACh",
    flywireIds: [],
    role: "Jump-hold internuncial (visualized GF follower; VNC muscle plant actually holds the button)",
    roleCn: "起跳维持中间元（面板显示；真正按住跳跃的是腹神经索替身）",
  },
  {
    name: "IN_gaba_air",
    layer: "interneuron",
    nt: "GABA",
    flywireIds: [],
    role: "Airborne inhibitor of a new jump gate",
    roleCn: "滞空抑制新起跳",
  },
  {
    name: "DNp09_L",
    layer: "descending",
    nt: "ACh",
    flywireIds: [720575940627652358],
    role: "DNp09 / P9 — forward walking (mapped to Mario right)",
    roleCn: "DNp09 前进 · 映射为向右跑",
  },
  {
    name: "DNp09_R",
    layer: "descending",
    nt: "ACh",
    flywireIds: [720575940635872101],
    role: "DNp09 / P9 contralateral copy — forward walking",
    roleCn: "DNp09 对侧 · 前进",
  },
  {
    name: "DNa02_L",
    layer: "descending",
    nt: "ACh",
    flywireIds: [720575940604737708],
    role: "DNa02 left — ipsilateral steering (Mario left)",
    roleCn: "DNa02 左 · 转向（向左）",
  },
  {
    name: "DNa02_R",
    layer: "descending",
    nt: "ACh",
    flywireIds: [720575940629327659],
    role: "DNa02 right — ipsilateral steering (Mario right)",
    roleCn: "DNa02 右 · 转向（向右）",
  },
  {
    name: "MDN",
    layer: "descending",
    nt: "ACh",
    flywireIds: [720575940616026939, 720575940631082808],
    role: "Moonwalker DN — backward walking (Mario left)",
    roleCn: "MDN 月步后退 · 向左",
  },
  {
    name: "DNp01_L",
    layer: "descending",
    nt: "ACh",
    flywireIds: [720575940622838154],
    role: "DNp01 Giant Fiber — escape takeoff (Mario jump)",
    roleCn: "DNp01 巨纤维 · 逃逸起跳",
  },
  {
    name: "DNp01_R",
    layer: "descending",
    nt: "ACh",
    flywireIds: [720575940632499757],
    role: "DNp01 Giant Fiber contralateral copy",
    roleCn: "DNp01 巨纤维对侧",
  },
];

export const SYNAPSES: SynapseSpec[] = [
  // Hop 1: sensory → internuncials
  { pre: "GRN_sugar", post: "IN_walk", w: 24 },
  { pre: "GRN_sugar", post: "IN_steer_R", w: 18 },
  { pre: "T4_progress", post: "IN_walk", w: 8 },
  { pre: "T4_progress", post: "IN_steer_R", w: 8 },

  { pre: "LC4", post: "IN_threat", w: 22 },
  { pre: "LPLC2", post: "IN_threat", w: 18 },
  { pre: "L1_gap", post: "IN_threat", w: 26 },
  { pre: "L1_wall", post: "IN_threat", w: 28 },
  { pre: "JO_fall", post: "IN_threat", w: 28 },

  { pre: "IN_threat", post: "IN_jump_AND", w: 32 },
  { pre: "IN_gaba_air", post: "IN_jump_AND", w: 22 },

  { pre: "IN_walk", post: "DNp09_L", w: 28 },
  { pre: "IN_walk", post: "DNp09_R", w: 28 },
  { pre: "IN_steer_R", post: "DNa02_R", w: 26 },
  { pre: "IN_steer_R", post: "DNp09_L", w: 14 },
  { pre: "IN_steer_R", post: "DNp09_R", w: 14 },

  { pre: "IN_jump_AND", post: "DNp01_L", w: 28 },
  { pre: "IN_jump_AND", post: "DNp01_R", w: 28 },

  { pre: "LC4", post: "DNp01_L", w: 4 },
  { pre: "LC4", post: "DNp01_R", w: 4 },
  { pre: "LPLC2", post: "DNp01_L", w: 3 },
  { pre: "LPLC2", post: "DNp01_R", w: 3 },
  { pre: "L1_gap", post: "DNp01_L", w: 5 },
  { pre: "L1_gap", post: "DNp01_R", w: 5 },
  { pre: "L1_wall", post: "DNp01_L", w: 6 },
  { pre: "L1_wall", post: "DNp01_R", w: 6 },
  { pre: "IN_gaba_air", post: "DNp01_L", w: 18 },
  { pre: "IN_gaba_air", post: "DNp01_R", w: 18 },

  { pre: "DNp01_L", post: "IN_hold", w: 22 },
  { pre: "DNp01_R", post: "IN_hold", w: 22 },
];

/**
 * Extra inhibitory (GABA-signed) synapses that must not inherit ACh from JO_ground.
 * Implemented as a virtual GABA copy: we inject via IN_gaba? No — JO_ground is ACh.
 * Use explicit negative weights in `buildWeightMatrix` for these named exceptions
 * (documented as "JO_ground recruits local GABA onto IN_hold", not JO itself being GABA).
 */
export const INHIBITORY_EXCEPTIONS: SynapseSpec[] = [];

export const CIRCUIT_NOTES = [
  "Reduced 2-hop subcircuit (~21 cells), not the 138k-neuron FlyWire whole brain.",
  "DN names follow flyputer: DNp09 forward, DNa02 steering, MDN backward, DNp01 Giant Fiber escape.",
  "Looming path follows the LPLC2/LC4 → DNp01 motif (swatter.py), mapped onto a 2D pit/enemy loom.",
  "Weights are demo-tuned for this platformer; they are not FlyWire synapse counts.",
  "VNC and muscles are absent from the brain dataset — MotorPlant is a labelled stand-in so a Giant Fiber pulse can hold jump in the air.",
  "FlyWire connectome data is CC BY-NC 4.0. This repo does not vendor the 852 MB graph.",
];

export const CIRCUIT: CircuitData = {
  neurons: NEURONS,
  synapses: SYNAPSES,
  notes: CIRCUIT_NOTES,
};

export const INDEX: Record<NeuronName, number> = Object.fromEntries(
  NEURONS.map((n, i) => [n.name, i]),
) as Record<NeuronName, number>;

export const NAME_OF: NeuronName[] = NEURONS.map((n) => n.name);

export function ntSign(nt: NeuronSpec["nt"]): number {
  if (nt === "GABA" || nt === "Glu") return -1;
  return 1;
}

export function buildWeightMatrix(): {
  W: Float32Array;
  tauM: Float32Array;
  tauS: Float32Array;
} {
  const n = NEURONS.length;
  const W = new Float32Array(n * n);
  const tauM = new Float32Array(n);
  const tauS = new Float32Array(n);
  tauM.fill(8);
  tauS.fill(5);

  for (const cell of NEURONS) {
    if (cell.layer === "sensory") tauM[INDEX[cell.name]] = 4;
  }
  tauM[INDEX.IN_hold] = 8;
  tauS[INDEX.IN_hold] = 12;
  tauM[INDEX.IN_jump_AND] = 6;
  tauM[INDEX.IN_gaba_air] = 5;
  tauM[INDEX.IN_threat] = 6;
  tauM[INDEX.IN_walk] = 6;
  tauM[INDEX.IN_steer_R] = 6;

  const byName = new Map(NEURONS.map((cell) => [cell.name, cell]));

  for (const syn of SYNAPSES) {
    const pre = byName.get(syn.pre)!;
    const i = INDEX[syn.post];
    const j = INDEX[syn.pre];
    W[i * n + j] += syn.w * ntSign(pre.nt);
  }

  for (const syn of INHIBITORY_EXCEPTIONS) {
    const i = INDEX[syn.post];
    const j = INDEX[syn.pre];
    W[i * n + j] -= syn.w; // local GABA recruited by JO_ground onto IN_hold
  }

  return { W, tauM, tauS };
}

export function emptyIext(): Float32Array {
  return new Float32Array(NEURONS.length);
}
