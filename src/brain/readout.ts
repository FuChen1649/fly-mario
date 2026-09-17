/**
 * Descending-neuron readout → Mario left / right / jump.
 *
 * The body (VNC + muscles) is not in the FlyWire brain dataset. flyputer maps
 * realized DN spikes onto a labelled stand-in. We do the same in 2D:
 *   DNp09 + DNa02_R  → right (forward / ipsilateral right)
 *   DNa02_L + MDN    → left  (steer / moonwalk)
 *   DNp01 Giant Fiber → jump start; a VNC/muscle leaky hold keeps the button
 *   down in the air so a single GF volley can produce a full jump.
 *
 * Thresholds are on spike counts this tick. No LLM, no heuristic planner.
 */

import { DT } from "../game/constants";
import { INDEX } from "./circuit";
import type { MotorCommand } from "./types";

export const WALK_TH = 1;
export const STEER_TH = 2;
export const JUMP_TH = 1;
export const JUMP_MUSCLE_S = 0.42;

export class MotorPlant {
  jumpRemain = 0;

  reset(): void {
    this.jumpRemain = 0;
  }

  /**
   * `onGround` is proprioception for the VNC stand-in (release jump on landing
   * so the next Giant Fiber volley is a fresh rising edge).
   */
  step(counts: Float32Array, onGround: boolean, dt: number = DT): MotorCommand {
    const walk =
      counts[INDEX.DNp09_L] + counts[INDEX.DNp09_R] + 0.6 * counts[INDEX.DNa02_R];
    const leftDn = counts[INDEX.DNa02_L] + counts[INDEX.MDN];
    const gf = counts[INDEX.DNp01_L] + counts[INDEX.DNp01_R];

    if (gf >= JUMP_TH) this.jumpRemain = JUMP_MUSCLE_S;
    else if (onGround) this.jumpRemain = 0;
    else this.jumpRemain = Math.max(0, this.jumpRemain - dt);

    const right = walk >= WALK_TH && walk >= leftDn;
    const left = leftDn >= STEER_TH && leftDn > walk;
    const jump = gf >= JUMP_TH || this.jumpRemain > 0;

    return {
      left,
      right,
      jump,
      dn: { walk, left: leftDn, right: walk, jump: gf + (this.jumpRemain > 0 ? 1 : 0) },
    };
  }
}

/** Stateless helper for motif tests that only care about instantaneous DNs. */
export function readout(counts: Float32Array, onGround = true): MotorCommand {
  const plant = new MotorPlant();
  return plant.step(counts, onGround);
}
