import type { InputState, Sensors } from "../game/types";
import type { World } from "../game/world";
import {
  INDEX,
  LifEngine,
  MotorPlant,
  NAME_OF,
  STEPS_PER_TICK,
  buildWeightMatrix,
  currentsToIext,
  encodeAtlas,
  ratesHz,
} from "../brain";
import { DEFAULT_LIF } from "../brain/lif";
import type { MotorCommand, NeuronName, StimulusCurrents } from "../brain/types";
import { getLlmConfig, optionalFailReview, optionalNarrate, optionalStimulusRecipe } from "./llm";
import { type Intent, firingSummary, intentFromReadout } from "./narrate";
import { sense } from "./sense";

export interface AgentTick {
  input: InputState;
  sensors: Sensors;
  stimulus: StimulusCurrents;
  counts: Float32Array;
  ratesHz: Float32Array;
  motor: MotorCommand;
  intent: Intent;
  line: string;
  controller: "lif-dn";
  llm: { enabled: boolean; overlay: boolean };
}

/**
 * Closed-loop fly controller:
 * observe → fixed atlas (+ optional LLM sensory overlay) → LIF step → DN readout → Mario keys.
 * The LLM is never the joystick.
 */
export class FlyAgent {
  intent: Intent = "idle";
  line = "糖气味在前面。DNp09 待命。";
  lastTick: AgentTick | null = null;
  private engine: LifEngine;
  private plant: MotorPlant;
  private lastIntent: Intent = "idle";
  private lineUntil = 0;
  private overlay: Partial<Record<NeuronName, number>> | null = null;
  private overlayAt = -999;
  private review: string | null = null;
  private pending = false;
  private failAsked = false;

  constructor() {
    const { W, tauM, tauS } = buildWeightMatrix();
    this.engine = new LifEngine(NAME_OF.length, W, tauM, tauS);
    this.plant = new MotorPlant();
  }

  reset(): void {
    this.engine.reset();
    this.plant.reset();
    this.intent = "idle";
    this.line = "糖气味在前面。DNp09 待命。";
    this.lastIntent = "idle";
    this.lineUntil = 0;
    this.overlay = null;
    this.overlayAt = -999;
    this.review = null;
    this.pending = false;
    this.failAsked = false;
    this.lastTick = null;
  }

  failReview(): string | null {
    return this.review;
  }

  act(world: World): AgentTick {
    const sensors = sense(world);
    const stimulus = encodeAtlas(sensors);
    const Iext = currentsToIext(stimulus, this.overlay ?? undefined);
    const counts = this.engine.step(Iext, STEPS_PER_TICK);
    const hz = ratesHz(counts, STEPS_PER_TICK, DEFAULT_LIF.dt);
    const motor = this.plant.step(counts, sensors.onGround);
    const { intent, line } = intentFromReadout(sensors, motor, counts, world.status);
    this.setIntent(world.time, intent, line);

    const input: InputState = {
      left: motor.left,
      right: motor.right,
      jump: motor.jump,
    };

    if (world.status === "won" || world.status === "lost") {
      input.left = false;
      input.right = false;
      input.jump = false;
    }

    this.maybeLlm(world, sensors, counts);

    const tick: AgentTick = {
      input,
      sensors,
      stimulus,
      counts,
      ratesHz: hz,
      motor,
      intent: this.intent,
      line: this.line,
      controller: "lif-dn",
      llm: { enabled: Boolean(getLlmConfig()), overlay: Boolean(this.overlay) },
    };
    this.lastTick = tick;
    return tick;
  }

  dnRate(name: NeuronName): number {
    if (!this.lastTick) return 0;
    return this.lastTick.ratesHz[INDEX[name]] ?? 0;
  }

  private setIntent(time: number, intent: Intent, line: string): void {
    this.intent = intent;
    if (intent !== this.lastIntent || time >= this.lineUntil) {
      this.line = line;
      this.lastIntent = intent;
      this.lineUntil = time + (intent === "run" ? 1.6 : 1.05);
    }
  }

  private maybeLlm(world: World, sensors: Sensors, counts: Float32Array): void {
    if (!getLlmConfig() || this.pending) return;

    if (world.status === "lost" && !this.failAsked) {
      this.failAsked = true;
      this.pending = true;
      void optionalFailReview(sensors, counts).then((text) => {
        this.pending = false;
        if (text) this.review = text;
      });
      return;
    }

    if (world.status !== "play") return;

    if (world.time - this.overlayAt > 0.85) {
      this.overlayAt = world.time;
      this.pending = true;
      void optionalStimulusRecipe(sensors).then((ov) => {
        this.pending = false;
        if (ov) this.overlay = ov;
      });
    }

    if (world.time > 0.4) {
      const prompt = `${this.line} | ${firingSummary(counts)}`;
      void optionalNarrate(prompt).then((text) => {
        if (text) this.line = text.slice(0, 24);
      });
    }
  }
}
