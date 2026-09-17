import { describe, expect, it } from "vitest";
import { simulateClear } from "../src/sim/clear";
import { World } from "../src/game/world";
import { FlyAgent } from "../src/agent/flyAgent";
import { DT } from "../src/game/constants";
import { getLlmConfig } from "../src/agent/llm";
import { INDEX, NAME_OF, STEPS_PER_TICK, buildWeightMatrix, emptyIext } from "../src/brain/circuit";
import { LifEngine } from "../src/brain/lif";
import { encodeAtlas, inverseSizeDrive } from "../src/brain/encoder";
import { readout } from "../src/brain/readout";
import { sense } from "../src/agent/sense";

describe("fly LIF vs shipped level", () => {
  it("reaches the flag without dying (offline, no LLM)", () => {
    expect(getLlmConfig()).toBeNull();
    const result = simulateClear(45);
    expect(result.status, `died or timed out at x=${result.x.toFixed(1)} t=${result.time.toFixed(2)}`).toBe(
      "won",
    );
    expect(result.time).toBeGreaterThan(5);
    expect(result.time).toBeLessThan(40);
    expect(result.walkFromDn).toBeGreaterThan(100);
    expect(result.jumpsFromGf).toBeGreaterThan(5);
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

  it("maps jump/right only from DN readout", () => {
    const world = new World();
    const agent = new FlyAgent();
    for (let i = 0; i < 90; i++) {
      const { input, motor } = agent.act(world);
      if (input.jump) expect(motor.dn.jump).toBeGreaterThanOrEqual(1);
      if (input.right) expect(motor.dn.walk).toBeGreaterThanOrEqual(1);
      if (input.left) expect(motor.dn.left).toBeGreaterThanOrEqual(2);
      expect(agent.lastTick?.controller).toBe("lif-dn");
      world.step(input, DT);
    }
  });
});

describe("2-hop LIF motifs", () => {
  it("sugar GRN drive makes DNp09 fire", () => {
    const { W, tauM, tauS } = buildWeightMatrix();
    const eng = new LifEngine(NAME_OF.length, W, tauM, tauS);
    const I = emptyIext();
    I[INDEX.GRN_sugar] = 34;
    let dn = 0;
    for (let t = 0; t < 8; t++) {
      const c = eng.step(I, STEPS_PER_TICK);
      dn += c[INDEX.DNp09_L] + c[INDEX.DNp09_R];
    }
    expect(dn).toBeGreaterThan(0);
    const motor = readout(eng.lastCounts);
    expect(motor.right).toBe(true);
    expect(motor.jump).toBe(false);
  });

  it("grounded gap loom recruits Giant Fiber", () => {
    const { W, tauM, tauS } = buildWeightMatrix();
    const eng = new LifEngine(NAME_OF.length, W, tauM, tauS);
    const I = emptyIext();
    I[INDEX.JO_ground] = 36;
    I[INDEX.L1_gap] = 52;
    I[INDEX.GRN_sugar] = 34;
    let gf = 0;
    for (let t = 0; t < 10; t++) {
      const c = eng.step(I, STEPS_PER_TICK);
      gf += c[INDEX.DNp01_L] + c[INDEX.DNp01_R];
    }
    expect(gf).toBeGreaterThan(0);
  });

  it("inverse-size loom is weak far away and strong near", () => {
    expect(inverseSizeDrive(400, 18, 88, 46)).toBe(0);
    expect(inverseSizeDrive(18, 18, 88, 46)).toBeGreaterThan(inverseSizeDrive(70, 18, 88, 46));
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

  it("sense reads the first pit from tiles", () => {
    const world = new World();
    world.player.x = 13 * 32 - 40;
    world.player.y = 14 * 32 - 28;
    world.player.onGround = true;
    const s = sense(world);
    expect(s.gapDist).toBeLessThan(60);
    const stim = encodeAtlas(s);
    expect(stim.channels.gap).toBeGreaterThan(10);
  });
});
