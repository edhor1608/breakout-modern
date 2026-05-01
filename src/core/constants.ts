export const GAME = {
  width: 800,
  height: 600,
  targetFps: 120,
  lives: 3,
  initialBallSpeed: 360,
  speedupPerHit: 10,
  stickSpeed: 560,
  stickStartX: 400,
  stickStartY: 565,
  upperStickY: 465,
  ballRadius: 13,
  itemChance: 0.1,
  itemChanceStep: 0.05,
  itemFallSpeed: 210
} as const;

export const ASSETS = {
  font: "/font/fixedsys.ttf",
  images: {
    background: "/images/background.png",
    ball: "/images/ball.png",
    stick: "/images/stick.png",
    stickBigger: "/images/stickBigger.png",
    stickSmaller: "/images/stickSmaller.png",
    blocks: ["/images/block_1.png", "/images/block_2.png", "/images/block_3.png", "/images/block_4.png"] as const,
    heart: "/images/heart.png",
    bar: "/images/balken.png",
    menu: "/images/menu.png",
    gameOver: "/images/gameover_new.png",
    gameWon: "/images/gamewontest.png",
    help: "/images/helpbackground.png",
    about: "/images/abouttestimage.png",
    items: {
      fasterStick: "/images/faster.png",
      slowerStick: "/images/slower.png",
      biggerStick: "/images/bigger.png",
      smallerStick: "/images/smaller.png",
      fasterBall: "/images/fasterball.png",
      slowerBall: "/images/slowerball.png"
    }
  },
  sounds: {
    background: "/sounds/backgroundMusic.wav",
    block: "/sounds/hitBlock.wav",
    stick: "/sounds/hitStick.wav",
    border: "/sounds/border.wav",
    item: "/sounds/itemHitStick.wav",
    gameOver: "/sounds/game-over-yeah.wav",
    win: "/sounds/winSound.wav",
    click: "/sounds/click.wav",
    lostLife: "/sounds/evil-laugh.wav"
  }
} as const;

export const MAPS = [
  "level1.map",
  "levelBlock1.map",
  "levelBlockTest5.map",
  "levelEmpty.map",
  "levelTest2.map",
  "levelTestBlock.map"
] as const;

export type GameMode = "single" | "multi";
export type Screen = "menu" | "playing" | "paused" | "gameover" | "won" | "highscores" | "help" | "about";
