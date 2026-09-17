/**
 * LLM B fallback: linear readout templates from DN / sensory firing.
 * Never chooses left/right/jump.
 */

import type { Intent, Sensors } from "../game/types";
import { INDEX, NAME_OF } from "../brain/circuit";
import type { MotorCommand } from "../brain/types";

export type { Intent };

export function intentFromReadout(
  sensors: Sensors,
  motor: MotorCommand,
  counts: Float32Array,
  status: "play" | "won" | "lost",
): { intent: Intent; line: string } {
  if (status === "won") return { intent: "win", line: "巨纤维安静。旗杆气味到了。" };
  if (status === "lost") return { intent: "fail", line: "回路没跳过沟……再试。" };

  const gap = counts[INDEX.L1_gap];
  const loom = counts[INDEX.LC4] + counts[INDEX.LPLC2];
  const wall = counts[INDEX.L1_wall];
  const gf = motor.dn.jump;
  const walk = motor.dn.walk;

  if (gf >= 1 && loom > gap && loom > wall) {
    return { intent: "stomp", line: pick(sensors.x, ["LC4 逼近，巨纤维放电。", "蚜虫！DNp01 起跳。", "逃逸回路：踩过去。"]) };
  }
  if (gf >= 1 && wall > gap) {
    return { intent: "vault", line: pick(sensors.x, ["障碍对比，DNp01 翻越。", "台阶！巨纤维。", "箱子，逃逸跳跃。"]) };
  }
  if (gf >= 1) {
    return { intent: "gap-jump", line: pick(sensors.x, ["前方沟壑，巨纤维跳。", "L1 见空，DNp01。", "别掉下去——逃逸跳。"]) };
  }
  if (!sensors.onGround) {
    return { intent: "land", line: "IN_hold 维持翅振，落地。" };
  }
  if (walk >= 2) {
    return { intent: "run", line: pick(sensors.x, ["DNp09 前进，糖气味在前。", "趋化：向右走。", "P9/DNp09 步行指令。"]) };
  }
  return { intent: "idle", line: "感觉通道很安静。" };
}

function pick(seed: number, lines: string[]): string {
  const i = Math.abs(Math.floor(seed * 0.07)) % lines.length;
  return lines[i]!;
}

export function firingSummary(counts: Float32Array): string {
  const top = NAME_OF
    .map((name, i) => ({ name, n: counts[i] }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 6)
    .map((x) => `${x.name}:${x.n}`)
    .join(" ");
  return top || "(silent)";
}
