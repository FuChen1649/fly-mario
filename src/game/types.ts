export type Mode = "manual" | "auto";

export type Status = "play" | "won" | "lost";

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  onGround: boolean;
  coyote: number;
  jumpHeld: boolean;
  facing: 1 | -1;
}

export interface Enemy {
  x: number;
  y: number;
  vx: number;
  w: number;
  h: number;
  left: number;
  right: number;
  alive: boolean;
}

export interface Fruit {
  x: number;
  y: number;
  r: number;
  taken: boolean;
  kind: "cherry" | "grape" | "peach";
}

export interface Flag {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Sensors {
  x: number;
  y: number;
  vx: number;
  vy: number;
  onGround: boolean;
  goalDist: number;
  gapDist: number;
  gapWidth: number;
  enemyDist: number;
  wallDist: number;
  stepUpDist: number;
  pitBelow: boolean;
  groundedChannel: number;
  loomingChannel: number;
  gapChannel: number;
  wallChannel: number;
  goalChannel: number;
}

export type Intent =
  | "idle"
  | "run"
  | "gap-jump"
  | "stomp"
  | "vault"
  | "land"
  | "win"
  | "fail";

export interface BrainView {
  controller: "lif-dn";
  line: string;
  intent: Intent;
  sensory: Record<string, number>;
  dnHz: Record<string, number>;
  motor: { left: boolean; right: boolean; jump: boolean };
  llmEnabled: boolean;
}
