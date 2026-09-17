import { describe, expect, it } from "vitest";
import { simulateClear } from "../src/sim/clear";
import { World } from "../src/game/world";
import { FlyAgent } from "../src/agent/flyAgent";
import { DT } from "../src/game/constants";

describe("fly agent vs shipped level", () => {
  it("reaches the flag without dying", () => {
    const result = simulateClear(45);
    expect(result.status, `died or timed out at x=${result.x.toFixed(1)} t=${result.time.toFixed(2)}`).toBe(
      "won",
    );
    expect(result.time).toBeGreaterThan(5);
    expect(result.time).toBeLessThan(40);
  });

  it("is deterministic across two rollouts", () => {
    const a = simulateClear(45);
    const b = simulateClear(45);
    expect(a).toEqual(b);
  });

  it("reports upcoming hazards from game state (not pixels)", () => {
    const world = new World();
    const agent = new FlyAgent();
    world.player.x = 13 * 32 - 50;
    world.player.y = 14 * 32 - 28;
    world.player.onGround = true;
    const { sensors } = agent.act(world);
    expect(sensors.gapDist).toBeLessThan(80);
    expect(sensors.goalDist).toBeGreaterThan(2000);
  });
});

describe("world basics", () => {
  it("kills the player in a pit without input", () => {
    const world = new World();
    world.player.x = 13 * 32 + 8;
    world.player.y = 12 * 32;
    world.player.onGround = false;
    for (let i = 0; i < 180; i++) {
      world.step({ left: false, right: false, jump: false }, DT);
    }
    expect(world.status).toBe("lost");
  });
});
