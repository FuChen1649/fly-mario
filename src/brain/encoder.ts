/**
 * Fixed stimulus atlas: structured game observations → named sensory currents.
 *
 * This is the flyputer `stimulate()` analogue, but the default recipe is a
 * frozen encoder (no LLM). Optional LLM A may add a *clamped overlay* on
 * sensory channels only — never on descending neurons.
 *
 * Looming channels use an inverse-size ramp (swatter.py angular-size idea):
 * drive grows as a hazard approaches, then the Giant Fiber integrates to spike.
 * Timing therefore lives in the encoder+LIF, not in an if-then joystick.
 */

import type { Sensors } from "../game/types";
import { INDEX, NAME_OF, NEURONS, emptyIext } from "./circuit";
import type { NeuronName, StimulusCurrents } from "./types";

const SENSORY = new Set(NEURONS.filter((n) => n.layer === "sensory").map((n) => n.name));

/** Inverse-size looming drive: 0 at `far`, `peak` at `near` (flyputer swatter analogue). */
export function inverseSizeDrive(
  dist: number,
  near: number,
  far: number,
  peak: number,
): number {
  if (!Number.isFinite(dist) || dist >= far || dist < -12) return 0;
  const d = Math.max(near, dist);
  const ang = 1 / d;
  const angFar = 1 / far;
  const angNear = 1 / near;
  const t = (ang - angFar) / (angNear - angFar);
  return peak * Math.max(0, Math.min(1, t));
}

/** Linear approach ramp — used for pits/walls so the GF can integrate before the lip. */
export function approachDrive(dist: number, start: number, full: number, peak: number): number {
  if (!Number.isFinite(dist) || dist >= start || dist < -12) return 0;
  if (dist <= full) return peak;
  return peak * (start - dist) / (start - full);
}

export function encodeAtlas(sensors: Sensors): StimulusCurrents {
  const gap = approachDrive(sensors.gapDist, 92, 38, 52);
  const loom = inverseSizeDrive(sensors.enemyDist, 20, 120, 50);
  const wall = approachDrive(Math.min(sensors.wallDist, sensors.stepUpDist), 64, 14, 52);
  const ground = sensors.onGround ? 36 : 6 * sensors.groundedChannel;
  const fall = sensors.pitBelow && sensors.vy > 40 ? 42 : 0;
  const sugar = 34 + 8 * sensors.goalChannel;
  const progress = sensors.vx > 40 ? 18 : sensors.vx > 0 ? 10 : 0;
  const air = sensors.onGround ? 0 : 32;

  const currents: Partial<Record<NeuronName, number>> = {
    GRN_sugar: sugar,
    JO_ground: ground,
    LC4: loom,
    LPLC2: loom * 0.85,
    L1_gap: gap,
    L1_wall: wall,
    JO_fall: fall,
    T4_progress: progress,
    IN_gaba_air: air, // internuncial with tonic drive when airborne — still not a DN
  };

  return {
    currents,
    channels: {
      sugar,
      ground,
      loom,
      gap,
      wall,
      fall,
      progress,
      air,
    },
  };
}

export function currentsToIext(
  stim: StimulusCurrents,
  overlay?: Partial<Record<NeuronName, number>>,
): Float32Array {
  const I = emptyIext();
  for (const [name, val] of Object.entries(stim.currents) as [NeuronName, number][]) {
    const i = INDEX[name];
    if (i === undefined) continue;
    I[i] = val;
  }
  if (overlay) {
    for (const [name, val] of Object.entries(overlay) as [NeuronName, number][]) {
      if (!SENSORY.has(name)) continue; // LLM A cannot drive DNs / motor
      const i = INDEX[name];
      if (i === undefined) continue;
      const cap = 0.4 * Math.max(I[i], 20);
      I[i] += Math.max(-cap, Math.min(cap, val));
    }
  }
  return I;
}

export function sensoryNames(): NeuronName[] {
  return NAME_OF.filter((n) => SENSORY.has(n));
}
