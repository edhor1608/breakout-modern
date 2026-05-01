import { Application, Assets, Container, Sprite, Text, Texture } from "pixi.js";
import { ASSETS, GAME, type GameMode } from "../core/constants";
import { loadLegacyMap, type ParsedMap } from "../core/map";
import { InputState } from "./input";
import { SoundPlayer } from "./sound";
import type { Ball, Block, GameResult, Item, ItemKind, Paddle, Rect } from "./types";

type GameCallbacks = {
  onHudChange: (hud: { lives: number; time: number; destroyed: number; total: number }) => void;
  onResult: (result: GameResult) => void;
};

const ITEM_KINDS = ["fasterStick", "slowerStick", "biggerStick", "smallerStick", "fasterBall", "slowerBall"] as const;

export class BreakoutGame {
  readonly app = new Application();
  private readonly world = new Container();
  private readonly uiLayer = new Container();
  private readonly input = new InputState();
  private readonly sound = new SoundPlayer();
  private readonly callbacks: GameCallbacks;
  private readonly textures = new Map<string, Texture>();
  private mode: GameMode = "single";
  private paused = false;
  private finished = false;
  private lives = GAME.lives;
  private elapsed = 0;
  private destroyedBlocks = 0;
  private totalBlocks = 0;
  private itemChance = GAME.itemChance;
  private bottom!: Paddle;
  private top?: Paddle;
  private ball!: Ball;
  private blocks: Block[] = [];
  private items: Item[] = [];
  private hearts: Sprite[] = [];
  private hudText!: Text;

  constructor(callbacks: GameCallbacks) {
    this.callbacks = callbacks;
  }

  async mount(target: HTMLElement): Promise<void> {
    await this.app.init({
      width: GAME.width,
      height: GAME.height,
      background: "#05070b",
      antialias: false,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    });

    this.app.canvas.className = "game-canvas";
    target.append(this.app.canvas);
    this.app.stage.addChild(this.world, this.uiLayer);
    await this.loadAssets();
    this.app.ticker.add((ticker) => this.tick(ticker.deltaMS / 1000));
  }

  async start(mode: GameMode, mapName: string): Promise<void> {
    this.mode = mode;
    this.paused = false;
    this.finished = false;
    this.lives = GAME.lives;
    this.elapsed = 0;
    this.destroyedBlocks = 0;
    this.itemChance = GAME.itemChance;
    this.world.removeChildren();
    this.uiLayer.removeChildren();
    this.blocks = [];
    this.items = [];
    this.hearts = [];

    const parsedMap = await loadLegacyMap(mapName);
    this.buildScene(parsedMap);
    this.sound.playMusic();
    this.emitHud();
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  toggleSound(): boolean {
    return this.sound.toggle();
  }

  private async loadAssets(): Promise<void> {
    const paths = [
      ASSETS.images.background,
      ASSETS.images.ball,
      ASSETS.images.stick,
      ASSETS.images.stickBigger,
      ASSETS.images.stickSmaller,
      ASSETS.images.heart,
      ASSETS.images.bar,
      ...ASSETS.images.blocks,
      ...Object.values(ASSETS.images.items)
    ];

    await Promise.all(
      paths.map(async (path) => {
        this.textures.set(path, await Assets.load<Texture>(path));
      })
    );
  }

  private texture(path: string): Texture {
    const texture = this.textures.get(path);
    if (!texture) {
      throw new Error(`Texture not loaded: ${path}`);
    }
    return texture;
  }

  private buildScene(map: ParsedMap): void {
    const background = new Sprite(this.texture(ASSETS.images.background));
    background.width = GAME.width;
    background.height = GAME.height;
    this.world.addChild(background);

    const bar = new Sprite(this.texture(ASSETS.images.bar));
    bar.anchor.set(0.5);
    bar.position.set(400, 15);
    this.uiLayer.addChild(bar);

    this.bottom = this.createPaddle(GAME.stickStartX, GAME.stickStartY, "bottom");
    if (this.mode === "multi") {
      this.top = this.createPaddle(GAME.stickStartX, GAME.upperStickY, "top");
    } else {
      this.top = undefined;
    }

    this.ball = this.createBall();
    this.blocks = map.blocks.map((cell) => this.createBlock(cell.id, cell.x, cell.y, cell.hits));
    this.totalBlocks = this.blocks.length;
    this.createHud();
    this.attachBall();
  }

  private createPaddle(x: number, y: number, kind: Paddle["kind"]): Paddle {
    const sprite = new Sprite(this.texture(ASSETS.images.stick));
    sprite.anchor.set(0.5);
    sprite.position.set(x, y);
    this.world.addChild(sprite);
    return {
      x,
      y,
      width: sprite.width,
      height: sprite.height,
      speed: GAME.stickSpeed,
      kind,
      sprite
    };
  }

  private createBall(): Ball {
    const sprite = new Sprite(this.texture(ASSETS.images.ball));
    sprite.anchor.set(0.5);
    this.world.addChild(sprite);
    return {
      x: GAME.stickStartX,
      y: GAME.stickStartY - 26,
      radius: GAME.ballRadius,
      vx: 0,
      vy: 0,
      speed: GAME.initialBallSpeed,
      sprite,
      attached: true
    };
  }

  private createBlock(id: string, x: number, y: number, hits: number): Block {
    const sprite = new Sprite(this.texture(this.blockTexture(hits)));
    sprite.anchor.set(0.5);
    sprite.position.set(x, y);
    this.world.addChild(sprite);
    return { id, x, y, width: sprite.width, height: sprite.height, hits, sprite };
  }

  private createHud(): void {
    this.hudText = new Text({
      text: "",
      style: {
        fontFamily: "Fixedsys, monospace",
        fontSize: 18,
        fill: "#f8f6e7"
      }
    });
    this.hudText.position.set(10, 2);
    this.uiLayer.addChild(this.hudText);

    for (let index = 0; index < GAME.lives; index += 1) {
      const heart = new Sprite(this.texture(ASSETS.images.heart));
      heart.anchor.set(0.5);
      heart.position.set(372 + index * 30, 20);
      this.uiLayer.addChild(heart);
      this.hearts.push(heart);
    }
  }

  private tick(deltaSeconds: number): void {
    if (this.paused || this.finished || !this.ball) {
      return;
    }

    this.handleControls(deltaSeconds);
    if (this.ball.attached) {
      this.attachBall();
    } else {
      this.elapsed += deltaSeconds;
      this.moveBall(deltaSeconds);
    }
    this.moveItems(deltaSeconds);
    this.syncSprites();
    this.emitHud();
  }

  private handleControls(deltaSeconds: number): void {
    this.movePaddle(this.bottom, deltaSeconds, "ArrowLeft", "ArrowRight");
    if (this.top) {
      this.movePaddle(this.top, deltaSeconds, "KeyA", "KeyD");
    }

    if (this.ball.attached && this.input.pressed("Space")) {
      this.launchBall();
    }
  }

  private movePaddle(paddle: Paddle, deltaSeconds: number, leftKey: string, rightKey: string): void {
    const direction = Number(this.input.pressed(rightKey)) - Number(this.input.pressed(leftKey));
    paddle.x += direction * paddle.speed * deltaSeconds;
    paddle.x = clamp(paddle.x, paddle.width / 2 + 5, GAME.width - paddle.width / 2 - 5);
  }

  private launchBall(): void {
    const angle = Math.random() > 0.5 ? 35 : -35;
    this.ball.attached = false;
    this.setBallAngle(angle);
  }

  private attachBall(): void {
    this.ball.attached = true;
    this.ball.x = this.bottom.x;
    this.ball.y = this.bottom.y - 26;
    this.ball.vx = 0;
    this.ball.vy = 0;
  }

  private moveBall(deltaSeconds: number): void {
    this.ball.x += this.ball.vx * deltaSeconds;
    this.ball.y += this.ball.vy * deltaSeconds;

    if (this.ball.x - this.ball.radius <= 0) {
      this.ball.x = this.ball.radius;
      this.ball.vx = Math.abs(this.ball.vx);
      this.sound.play("border");
    } else if (this.ball.x + this.ball.radius >= GAME.width) {
      this.ball.x = GAME.width - this.ball.radius;
      this.ball.vx = -Math.abs(this.ball.vx);
      this.sound.play("border");
    }

    if (this.ball.y - this.ball.radius <= 30) {
      this.ball.y = 30 + this.ball.radius;
      this.ball.vy = Math.abs(this.ball.vy);
      this.sound.play("border");
    }

    if (this.ball.y - this.ball.radius > GAME.height) {
      this.loseLife();
      return;
    }

    this.hitPaddle(this.bottom);
    if (this.top) {
      this.hitPaddle(this.top);
    }
    this.hitBlocks();
  }

  private hitPaddle(paddle: Paddle): void {
    if (!circleRect(this.ball, paddle)) {
      return;
    }

    if (paddle.kind === "bottom" && this.ball.vy <= 0) {
      return;
    }
    if (paddle.kind === "top" && this.ball.vy >= 0) {
      return;
    }

    const normalized = clamp((this.ball.x - paddle.x) / (paddle.width / 2), -1, 1);
    const maxAngle = 62;
    const angle = normalized * maxAngle;
    this.setBallAngle(paddle.kind === "bottom" ? angle : 180 - angle);
    this.ball.y = paddle.kind === "bottom" ? paddle.y - paddle.height / 2 - this.ball.radius : paddle.y + paddle.height / 2 + this.ball.radius;
    this.raiseBallSpeed();
    this.sound.play("stick");
  }

  private hitBlocks(): void {
    const block = this.blocks.find((candidate) => circleRect(this.ball, candidate));
    if (!block) {
      return;
    }

    const overlapX = block.width / 2 + this.ball.radius - Math.abs(this.ball.x - block.x);
    const overlapY = block.height / 2 + this.ball.radius - Math.abs(this.ball.y - block.y);
    if (overlapX < overlapY) {
      this.ball.vx *= -1;
    } else {
      this.ball.vy *= -1;
    }

    block.hits -= 1;
    this.raiseBallSpeed();
    this.sound.play("block");

    if (block.hits <= 0) {
      this.world.removeChild(block.sprite);
      this.blocks = this.blocks.filter((candidate) => candidate !== block);
      this.destroyedBlocks += 1;
      this.maybeSpawnItem(block.x, block.y);
      if (this.blocks.length === 0) {
        this.finish("won");
      }
    } else {
      block.sprite.texture = this.texture(this.blockTexture(block.hits));
    }
  }

  private maybeSpawnItem(x: number, y: number): void {
    if (Math.random() > this.itemChance) {
      this.itemChance += GAME.itemChanceStep;
      return;
    }

    this.itemChance = GAME.itemChance;
    const kind = ITEM_KINDS[Math.floor(Math.random() * ITEM_KINDS.length)];
    this.createItem(kind, x, y);
  }

  private createItem(kind: ItemKind, x: number, y: number): void {
    const sprite = new Sprite(this.texture(ASSETS.images.items[kind]));
    sprite.anchor.set(0.5);
    sprite.position.set(x, y);
    this.world.addChild(sprite);
    this.items.push({ kind, x, y, width: sprite.width, height: sprite.height, sprite });
  }

  private moveItems(deltaSeconds: number): void {
    for (const item of [...this.items]) {
      item.y += GAME.itemFallSpeed * deltaSeconds;
      const hitBottom = rectsOverlap(item, this.bottom);
      const hitTop = this.top ? rectsOverlap(item, this.top) : false;
      if (hitBottom || hitTop) {
        this.applyItem(item.kind);
        this.removeItem(item);
        this.sound.play("item");
      } else if (item.y - item.height / 2 > GAME.height) {
        this.removeItem(item);
      }
    }
  }

  private applyItem(kind: ItemKind): void {
    const paddles = [this.bottom, this.top].filter((paddle): paddle is Paddle => Boolean(paddle));
    for (const paddle of paddles) {
      if (kind === "fasterStick") {
        paddle.speed += 90;
      } else if (kind === "slowerStick") {
        paddle.speed = Math.max(240, paddle.speed - 70);
      } else if (kind === "biggerStick") {
        this.resizePaddle(paddle, ASSETS.images.stickBigger);
      } else if (kind === "smallerStick") {
        this.resizePaddle(paddle, ASSETS.images.stickSmaller);
      }
    }

    if (kind === "fasterBall") {
      this.ball.speed += 80;
      this.normalizeVelocity();
    } else if (kind === "slowerBall") {
      this.ball.speed = Math.max(220, this.ball.speed - 80);
      this.normalizeVelocity();
    }
  }

  private resizePaddle(paddle: Paddle, texturePath: string): void {
    paddle.sprite.texture = this.texture(texturePath);
    paddle.width = paddle.sprite.width;
    paddle.height = paddle.sprite.height;
    paddle.x = clamp(paddle.x, paddle.width / 2 + 5, GAME.width - paddle.width / 2 - 5);
  }

  private removeItem(item: Item): void {
    this.world.removeChild(item.sprite);
    this.items = this.items.filter((candidate) => candidate !== item);
  }

  private loseLife(): void {
    this.lives -= 1;
    this.hearts[this.lives]?.destroy();
    if (this.lives <= 0) {
      this.sound.play("gameOver");
      this.finish("gameover");
      return;
    }
    this.sound.play("lostLife");
    this.attachBall();
  }

  private finish(outcome: GameResult["outcome"]): void {
    this.finished = true;
    this.sound.play(outcome === "won" ? "win" : "gameOver");
    this.callbacks.onResult({
      outcome,
      destroyedBlocks: this.destroyedBlocks,
      elapsedSeconds: Math.round(this.elapsed)
    });
  }

  private setBallAngle(angleDegrees: number): void {
    const radians = ((angleDegrees - 90) * Math.PI) / 180;
    this.ball.vx = Math.cos(radians) * this.ball.speed;
    this.ball.vy = Math.sin(radians) * this.ball.speed;
  }

  private raiseBallSpeed(): void {
    this.ball.speed += GAME.speedupPerHit;
    this.normalizeVelocity();
  }

  private normalizeVelocity(): void {
    const length = Math.hypot(this.ball.vx, this.ball.vy);
    if (length === 0) {
      return;
    }
    this.ball.vx = (this.ball.vx / length) * this.ball.speed;
    this.ball.vy = (this.ball.vy / length) * this.ball.speed;
  }

  private syncSprites(): void {
    for (const paddle of [this.bottom, this.top]) {
      if (paddle) {
        paddle.sprite.position.set(paddle.x, paddle.y);
      }
    }
    this.ball.sprite.position.set(this.ball.x, this.ball.y);
    for (const item of this.items) {
      item.sprite.position.set(item.x, item.y);
    }
  }

  private emitHud(): void {
    const hud = {
      lives: this.lives,
      time: Math.round(this.elapsed),
      destroyed: this.destroyedBlocks,
      total: this.totalBlocks
    };
    this.hudText.text = `Time: ${hud.time}s`;
    this.callbacks.onHudChange(hud);
  }

  private blockTexture(hits: number): string {
    return ASSETS.images.blocks[Math.min(Math.max(hits, 1), 4) - 1];
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function circleRect(circle: Pick<Ball, "x" | "y" | "radius">, rect: Rect): boolean {
  const closestX = clamp(circle.x, rect.x - rect.width / 2, rect.x + rect.width / 2);
  const closestY = clamp(circle.y, rect.y - rect.height / 2, rect.y + rect.height / 2);
  return Math.hypot(circle.x - closestX, circle.y - closestY) <= circle.radius;
}

function rectsOverlap(left: Rect, right: Rect): boolean {
  return (
    Math.abs(left.x - right.x) * 2 < left.width + right.width &&
    Math.abs(left.y - right.y) * 2 < left.height + right.height
  );
}
