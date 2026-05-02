import "./styles.css";
import { type GameMode, MAPS, type Screen } from "./core/constants";
import { createHighscoreEntry } from "./core/highscore";
import { addHighscore, readHighscores, resetHighscores } from "./core/highscoreStorage";
import { BreakoutGame } from "./game/BreakoutGame";
import type { GameResult } from "./game/types";

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) {
  throw new Error("Missing app root.");
}

root.innerHTML = `
  <main class="shell">
    <section class="stage" aria-label="Breakout game">
      <div class="canvas-wrap" id="canvas-wrap"></div>
      <div class="overlay is-visible" id="overlay"></div>
    </section>
    <aside class="side">
      <div>
        <p class="eyebrow">FoP Breakout</p>
        <h1>Breakout</h1>
        <p class="summary">The old university game, ported to a stable browser runtime.</p>
      </div>
      <dl class="hud">
        <div><dt>Lives</dt><dd id="hud-lives">3</dd></div>
        <div><dt>Time</dt><dd id="hud-time">0s</dd></div>
        <div><dt>Blocks</dt><dd id="hud-blocks">0/0</dd></div>
      </dl>
      <div class="controls">
        <button id="pause-button" type="button">Pause</button>
        <button id="sound-button" type="button">Sound on</button>
        <button id="spin-button" type="button">Spin off</button>
        <button id="menu-button" type="button">Menu</button>
      </div>
    </aside>
  </main>
`;

const canvasWrap = element<HTMLDivElement>("canvas-wrap");
const overlay = element<HTMLDivElement>("overlay");
const hudLives = element<HTMLElement>("hud-lives");
const hudTime = element<HTMLElement>("hud-time");
const hudBlocks = element<HTMLElement>("hud-blocks");
const pauseButton = element<HTMLButtonElement>("pause-button");
const soundButton = element<HTMLButtonElement>("sound-button");
const spinButton = element<HTMLButtonElement>("spin-button");
const menuButton = element<HTMLButtonElement>("menu-button");

let currentScreen: Screen = "menu";
let selectedMode: GameMode = "single";
let selectedMap = "level1.map";
let spinEnabled = false;
let pendingResult: GameResult | undefined;

const game = new BreakoutGame({
  onHudChange: (hud) => {
    hudLives.textContent = String(hud.lives);
    hudTime.textContent = `${hud.time}s`;
    hudBlocks.textContent = `${hud.destroyed}/${hud.total}`;
  },
  onResult: (result) => {
    pendingResult = result;
    showResult(result);
  },
});

void boot();

async function boot(): Promise<void> {
  await game.mount(canvasWrap);
  showMenu();
}

pauseButton.addEventListener("click", () => {
  if (currentScreen === "playing") {
    showPause();
  } else if (currentScreen === "paused") {
    hideOverlay();
    currentScreen = "playing";
    game.setPaused(false);
  }
});

soundButton.addEventListener("click", () => {
  soundButton.textContent = game.toggleSound() ? "Sound on" : "Sound off";
});

spinButton.addEventListener("click", () => {
  spinEnabled = !spinEnabled;
  game.setSpinEnabled(spinEnabled);
  updateSpinButton();
});

menuButton.addEventListener("click", showMenu);

window.addEventListener("keydown", (event) => {
  if (event.code === "Escape") {
    showMenu();
  } else if (event.code === "KeyP" && currentScreen === "playing") {
    showPause();
  } else if (event.code === "KeyP" && currentScreen === "paused") {
    hideOverlay();
    currentScreen = "playing";
    game.setPaused(false);
  } else if (event.code === "KeyR" && currentScreen === "playing") {
    void startGame();
  }
});

function showMenu(): void {
  currentScreen = "menu";
  game.setPaused(true);
  overlay.classList.add("is-visible");
  overlay.innerHTML = `
    <div class="panel menu-panel">
      <div>
        <p class="eyebrow">Modern web port</p>
        <h2>Breakout</h2>
        <p>Keep the ball alive, clear the legacy maps, and write a new local highscore.</p>
      </div>
      <label>
        Mode
        <select id="mode-select">
          <option value="single">Single player</option>
          <option value="multi">Two sticks</option>
        </select>
      </label>
      <label>
        Map
        <select id="map-select">
          ${MAPS.map((map) => `<option value="${map}">${map}</option>`).join("")}
        </select>
      </label>
      <label class="check-row">
        Spin physics
        <input id="spin-checkbox" type="checkbox" />
      </label>
      <div class="button-row">
        <button id="start-button" type="button">Start</button>
        <button id="highscores-button" type="button">Highscores</button>
        <button id="help-button" type="button">Help</button>
        <button id="about-button" type="button">About</button>
      </div>
    </div>
  `;

  const modeSelect = element<HTMLSelectElement>("mode-select");
  const mapSelect = element<HTMLSelectElement>("map-select");
  const spinCheckbox = element<HTMLInputElement>("spin-checkbox");
  modeSelect.value = selectedMode;
  mapSelect.value = selectedMap;
  spinCheckbox.checked = spinEnabled;
  modeSelect.addEventListener("change", () => {
    selectedMode = modeSelect.value as GameMode;
  });
  mapSelect.addEventListener("change", () => {
    selectedMap = mapSelect.value;
  });
  spinCheckbox.addEventListener("change", () => {
    spinEnabled = spinCheckbox.checked;
    game.setSpinEnabled(spinEnabled);
    updateSpinButton();
  });
  element("start-button").addEventListener("click", () => void startGame());
  element("highscores-button").addEventListener("click", showHighscores);
  element("help-button").addEventListener("click", showHelp);
  element("about-button").addEventListener("click", showAbout);
}

async function startGame(): Promise<void> {
  currentScreen = "playing";
  hideOverlay();
  game.setSpinEnabled(spinEnabled);
  await game.start(selectedMode, selectedMap);
  game.setPaused(false);
}

function showPause(): void {
  currentScreen = "paused";
  game.setPaused(true);
  overlay.classList.add("is-visible");
  overlay.innerHTML = `
    <div class="panel compact-panel">
      <p class="eyebrow">Paused</p>
      <h2>Breakout</h2>
      <div class="button-row">
        <button id="resume-button" type="button">Resume</button>
        <button id="pause-menu-button" type="button">Menu</button>
      </div>
    </div>
  `;
  element("resume-button").addEventListener("click", () => {
    currentScreen = "playing";
    game.setPaused(false);
    hideOverlay();
  });
  element("pause-menu-button").addEventListener("click", showMenu);
}

function showResult(result: GameResult): void {
  currentScreen = result.outcome === "won" ? "won" : "gameover";
  game.setPaused(true);
  overlay.classList.add("is-visible");
  const title = result.outcome === "won" ? "Map cleared" : "Game over";
  overlay.innerHTML = `
    <form class="panel compact-panel" id="score-form">
      <p class="eyebrow">${title}</p>
      <h2>${result.destroyedBlocks} blocks in ${result.elapsedSeconds}s</h2>
      <label>
        Name
        <input id="name-input" name="name" maxlength="10" autocomplete="off" placeholder="PLAYER" />
      </label>
      <p class="form-error" id="form-error"></p>
      <div class="button-row">
        <button type="submit">Save score</button>
        <button id="skip-score-button" type="button">Skip</button>
      </div>
    </form>
  `;

  element("score-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = element<HTMLInputElement>("name-input");
    const formError = element<HTMLElement>("form-error");
    try {
      addHighscore(createHighscoreEntry(input.value, result.destroyedBlocks, result.elapsedSeconds));
      showHighscores();
    } catch (error) {
      formError.textContent = error instanceof Error ? error.message : "Could not save score.";
    }
  });
  element("skip-score-button").addEventListener("click", showHighscores);
}

function showHighscores(): void {
  currentScreen = "highscores";
  game.setPaused(true);
  const scores = readHighscores();
  overlay.classList.add("is-visible");
  overlay.innerHTML = `
    <div class="panel scores-panel">
      <p class="eyebrow">Local scores</p>
      <h2>Highscores</h2>
      <ol class="scores">
        ${
          scores.length
            ? scores
                .map(
                  (score) =>
                    `<li><span>${score.name}</span><span>${score.destroyedBlocks} blocks</span><span>${score.elapsedSeconds}s</span></li>`,
                )
                .join("")
            : `<li><span>No scores yet</span><span>-</span><span>-</span></li>`
        }
      </ol>
      <div class="button-row">
        <button id="scores-menu-button" type="button">Menu</button>
        <button id="reset-scores-button" type="button">Reset</button>
      </div>
    </div>
  `;
  element("scores-menu-button").addEventListener("click", showMenu);
  element("reset-scores-button").addEventListener("click", () => {
    resetHighscores();
    showHighscores();
  });
}

function showHelp(): void {
  currentScreen = "help";
  game.setPaused(true);
  overlay.classList.add("is-visible");
  overlay.innerHTML = `
    <div class="panel info-panel">
      <p class="eyebrow">Controls</p>
      <h2>Keep the ball in play</h2>
      <dl class="help-list">
        <div><dt>Left / Right</dt><dd>Move the lower stick</dd></div>
        <div><dt>A / D</dt><dd>Move the upper stick in two-stick mode</dd></div>
        <div><dt>Space</dt><dd>Launch the ball</dd></div>
        <div><dt>P</dt><dd>Pause</dd></div>
        <div><dt>R</dt><dd>Restart current map</dd></div>
        <div><dt>Esc</dt><dd>Return to menu</dd></div>
      </dl>
      <div class="button-row"><button id="help-menu-button" type="button">Menu</button></div>
    </div>
  `;
  element("help-menu-button").addEventListener("click", showMenu);
}

function showAbout(): void {
  currentScreen = "about";
  game.setPaused(true);
  overlay.classList.add("is-visible");
  overlay.innerHTML = `
    <div class="panel info-panel">
      <p class="eyebrow">About</p>
      <h2>Old idea, modern runtime</h2>
      <p>This port keeps the original maps and visual assets, but replaces the university-era Java/LWJGL stack with TypeScript, Vite, and PixiJS.</p>
      <p>It is intentionally small: one canvas, local scores, legacy controls, and stable browser delivery.</p>
      <div class="button-row"><button id="about-menu-button" type="button">Menu</button></div>
    </div>
  `;
  element("about-menu-button").addEventListener("click", showMenu);
}

function hideOverlay(): void {
  overlay.classList.remove("is-visible");
  overlay.innerHTML = "";
}

function element<T extends HTMLElement = HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) {
    throw new Error(`Missing element #${id}.`);
  }
  return found as T;
}

function updateSpinButton(): void {
  spinButton.textContent = spinEnabled ? "Spin on" : "Spin off";
}

void pendingResult;
