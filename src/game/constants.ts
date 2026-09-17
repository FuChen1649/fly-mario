export const TILE = 32;
export const VIEW_W = 960;
export const VIEW_H = 540;
export const DT = 1 / 60;

export const MOVE_SPEED = 250;
export const JUMP_VEL = -680;
export const GRAVITY = 1700;
export const MAX_FALL = 980;
export const COYOTE = 0.1;
export const JUMP_CUT = 0.45;
export const PLAYER_W = 24;
export const PLAYER_H = 28;
export const ENEMY_W = 26;
export const ENEMY_H = 22;
export const ENEMY_SPEED = 55;

export const JUMP_LEAD_GAP = 62;
export const JUMP_LEAD_ENEMY = 70;
export const JUMP_LEAD_WALL = 36;
export const JUMP_HOLD_TIME = 0.42;

export enum Tile {
  Empty = 0,
  Grass = 1,
  Dirt = 2,
  Crate = 3,
  Brick = 4,
  Stump = 5,
}
