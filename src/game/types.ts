import type { Graphics, Sprite } from "pixi.js";

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Paddle = Rect & {
  sprite: Sprite;
  mask: Graphics;
  speed: number;
  kind: "bottom" | "top";
};

export type Ball = {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  speed: number;
  sprite: Sprite;
  attached: boolean;
};

export type Block = Rect & {
  id: string;
  hits: number;
  sprite: Sprite;
};

export type ItemKind = "fasterStick" | "slowerStick" | "biggerStick" | "smallerStick" | "fasterBall" | "slowerBall";

export type Item = Rect & {
  kind: ItemKind;
  sprite: Sprite;
};

export type GameResult = {
  outcome: "won" | "gameover";
  destroyedBlocks: number;
  elapsedSeconds: number;
};
