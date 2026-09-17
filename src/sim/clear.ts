import { DT } from "../game/constants";
import { World } from "../game/world";
import { FlyAgent } from "../agent/flyAgent";

export interface ClearResult {
  status: "won" | "lost" | "play";
  time: number;
  steps: number;
  fruits: number;
  x: number;
  jumpsFromGf: number;
  walkFromDn: number;
}

/** Deterministic fixed-step rollout: LIF DN readout must reach the flag. */
export function simulateClear(maxSeconds = 40): ClearResult {
  const world = new World();
  const agent = new FlyAgent();
  const steps = Math.ceil(maxSeconds / DT);
  let jumpsFromGf = 0;
  let walkFromDn = 0;
  for (let i = 0; i < steps; i++) {
    const { input, motor } = agent.act(world);
    if (input.jump) {
      if (motor.dn.jump >= 1) jumpsFromGf += 1;
    }
    if (input.right && motor.dn.walk >= 1) walkFromDn += 1;
    world.step(input, DT);
    if (world.status !== "play") {
      return {
        status: world.status,
        time: world.time,
        steps: i + 1,
        fruits: world.fruits,
        x: world.player.x,
        jumpsFromGf,
        walkFromDn,
      };
    }
  }
  return {
    status: world.status,
    time: world.time,
    steps,
    fruits: world.fruits,
    x: world.player.x,
    jumpsFromGf,
    walkFromDn,
  };
}
