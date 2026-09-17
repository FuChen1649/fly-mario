/**
 * Optional OpenAI-compatible helper. The model may ONLY:
 *   A) overlay currents on named *sensory* channels (tool-style recipe)
 *   B) write 旁白 from firing / state
 *   C) write a post-fail review
 *
 * It is never the left/right/jump policy. Missing env → all functions no-op.
 */

import type { Sensors } from "../game/types";
import { NEURONS } from "../brain/circuit";
import type { NeuronName } from "../brain/types";
import { firingSummary } from "./narrate";

const SENSORY = new Set(NEURONS.filter((n) => n.layer === "sensory").map((n) => n.name));

export interface LlmConfig {
  url: string;
  model: string;
  key?: string;
}

export function getLlmConfig(): LlmConfig | null {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  const url = env?.VITE_FLY_LLM_URL;
  if (!url) return null;
  return {
    url,
    model: env.VITE_FLY_LLM_MODEL ?? "local",
    key: env.VITE_FLY_LLM_KEY,
  };
}

export async function optionalStimulusRecipe(
  sensors: Sensors,
): Promise<Partial<Record<NeuronName, number>> | null> {
  const cfg = getLlmConfig();
  if (!cfg) return null;
  const text = await chat(
    cfg,
    "You propose an OPTIONAL sensory-current overlay for a fruit-fly LIF. Reply JSON only: {\"GRN_sugar\":0,\"LC4\":0,...} using sensory names. Do not mention actions. Overlay will be clamped and cannot drive descending neurons.",
    JSON.stringify({
      onGround: sensors.onGround,
      gapDist: round(sensors.gapDist),
      enemyDist: round(sensors.enemyDist),
      wallDist: round(sensors.wallDist),
      goalDist: round(sensors.goalDist),
    }),
  );
  if (!text) return null;
  return parseOverlay(text);
}

export async function optionalNarrate(prompt: string): Promise<string | null> {
  const cfg = getLlmConfig();
  if (!cfg) return null;
  return chat(
    cfg,
    "你是一只果蝇大脑的旁白，根据神经元放电用不超过18个汉字说话。不要下命令，不要写 left/right/jump。",
    prompt,
  );
}

export async function optionalFailReview(sensors: Sensors, counts: Float32Array): Promise<string | null> {
  const cfg = getLlmConfig();
  if (!cfg) return null;
  return chat(
    cfg,
    "用不超过40个汉字复盘果蝇为何没通关。只谈感觉通道与下行神经元，不要给出按键策略。",
    JSON.stringify({
      x: round(sensors.x),
      gapDist: round(sensors.gapDist),
      enemyDist: round(sensors.enemyDist),
      firing: firingSummary(counts),
    }),
  );
}

function parseOverlay(text: string): Partial<Record<NeuronName, number>> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const obj = JSON.parse(match[0]) as Record<string, unknown>;
    const out: Partial<Record<NeuronName, number>> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (!SENSORY.has(k as NeuronName)) continue;
      if (typeof v === "number" && Number.isFinite(v)) out[k as NeuronName] = v;
    }
    return out;
  } catch {
    return null;
  }
}

async function chat(cfg: LlmConfig, system: string, user: string): Promise<string | null> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (cfg.key) headers.Authorization = `Bearer ${cfg.key}`;
    const res = await fetch(cfg.url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: cfg.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.4,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content?.trim();
    return content || null;
  } catch {
    return null;
  }
}

function round(v: number): number {
  return Math.round(v * 10) / 10;
}
