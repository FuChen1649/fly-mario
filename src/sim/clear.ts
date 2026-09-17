import { DT } from "../game/constants";
import { World } from "../game/world";
import { FlyAgent } from "../agent/flyAgent";

export interface ClearResult {
  status: "won" | "lost" | "play";
  time: number;
  steps: number;
  fruits: number;
  x: number;
}

/** Deterministic fixed-step rollout used by tests and the Auto Fly button proof. */
export function simulateClear(maxSeconds = 40): ClearResult {
  const world = new World();
  const agent = new FlyAgent();
  const steps = Math.ceil(maxSeconds / DT);
  for (let i = 0; i < steps; i++) {
    const { input } = agent.act(world);
    world.step(input, DT);
    if (world.status !== "play") {
      return {
        status: world.status,
        time: world.time,
        steps: i + 1,
        fruits: world.fruits,
        x: world.player.x,
      };
    }
  }
  return {
    status: world.status,
    time: world.time,
    steps,
    fruits: world.fruits,
    x: world.player.x,
  };
}
