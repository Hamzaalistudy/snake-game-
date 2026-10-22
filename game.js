"use strict";

(() => {
  // Grid matrix configurations
  const COLUMNS = 22;
  const ROWS = 16;
  
  // Game loop intervals per difficulty level (in ms)
  const SPEEDS = { chill: 150, classic: 115, turbo: 80 };
  
  const Direction = Object.freeze({ UP: "up", DOWN: "down", LEFT: "left", RIGHT: "right" });
  
  const DELTAS = Object.freeze({
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  });

  const samePoint = (a, b) => a.x === b.x && a.y === b.y;
  
  const opposite = (a, b) =>
    (a === Direction.UP && b === Direction.DOWN) ||
    (a === Direction.DOWN && b === Direction.UP) ||
    (a === Direction.LEFT && b === Direction.RIGHT) ||
    (a === Direction.RIGHT && b === Direction.LEFT);

  class Snake {
    #segments;
    #direction;
    #nextDirection;

    constructor(start = { x: Math.floor(COLUMNS / 2), y: Math.floor(ROWS / 2) }) {
      this.#segments = [
        { ...start },
        { x: start.x - 1, y: start.y },
        { x: start.x - 2, y: start.y }
      ];
      this.#direction = Direction.RIGHT;
      this.#nextDirection = Direction.RIGHT;
    }

    get segments() { return this.#segments.map((point) => ({ ...point })); }
    get head() { return { ...this.#segments[0] }; }
    get direction() { return this.#direction; }
    get nextDirection() { return this.#nextDirection; }

    setDirection(direction) {
      if (!DELTAS[direction]) return false;
      if (opposite(this.#direction, direction) || opposite(this.#nextDirection, direction)) return false;
      this.#nextDirection = direction;
      return true;
    }

    wouldHit(point, growing) {
      const body = growing ? this.#segments : this.#segments.slice(0, -1);
      return body.some((segment) => samePoint(segment, point));
    }

    move(grow = false) {
      this.#direction = this.#nextDirection;
      const delta = DELTAS[this.#direction];
      const head = this.head;
      this.#segments.unshift({ x: head.x + delta.x, y: head.y + delta.y });
      if (!grow) this.#segments.pop();
    }
  }

  class Food {
    #position;

    constructor(position = { x: 0, y: 0 }) { this.#position = { ...position }; }
    get position() { return { ...this.#position }; }
    setPosition(position) { this.#position = { ...position }; }

    place(columns, rows, occupied, random = Math.random) {
      const empty = [];
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < columns; x += 1) {
          const candidate = { x, y };
          if (!occupied.some((point) => samePoint(point, candidate))) empty.push(candidate);
        }
      }
      if (empty.length === 0) return false;
      const index = Math.min(empty.length - 1, Math.floor(random() * empty.length));
      this.setPosition(empty[index]);
      return true;
    }
  }

  class Game {
    #columns;
    #rows;
    #snake;
    #food;
    #score;
    #state;
    #random;

    constructor({ columns = COLUMNS, rows = ROWS, random = Math.random } = {}) {
      if (!Number.isInteger(columns) || !Number.isInteger(rows) || columns < 6 || rows < 6) {
        throw new RangeError("The game board must be at least 6x6 tiles.");
      }
      this.#columns = columns;
      this.#rows = rows;
      this.#random = random;
      this.reset();
    }

    get columns() { return this.#columns; }
    get rows() { return this.#rows; }
    get score() { return this.#score; }
    get state() { return this.#state; }
    get snake() { return this.#snake.segments; }
    get food() { return this.#food.position; }

    start() {
      if (this.#state === "ready") this.#state = "playing";
    }

    togglePause() {
      if (this.#state === "playing") this.#state = "paused";
      else if (this.#state === "paused") this.#state = "playing";
    }

    setDirection(direction) {
      if (this.#state === "playing") return this.#snake.setDirection(direction);
      return false;
    }

    update() {
      if (this.#state !== "playing") return this.#state;
      const head = this.#snake.head;
      const direction = this.#snake.nextDirection;
      const delta = DELTAS[direction];
      const next = { x: head.x + delta.x, y: head.y + delta.y };
      const eating = samePoint(next, this.#food.position);
      const hitWall = next.x < 0 || next.x >= this.#columns || next.y < 0 || next.y >= this.#rows;

      if (hitWall || this.#snake.wouldHit(next, eating)) {
        this.#state = "over";
        return this.#state;
      }

      this.#snake.move(eating);
      if (eating) {
        this.#score += 10;
        const placed = this.#food.place(this.#columns, this.#rows, this.#snake.segments, this.#random);
        if (!placed) this.#state = "won";
      }
      return this.#state;
    }

    reset() {
      this.#snake = new Snake({ x: Math.floor(this.#columns / 2), y: Math.floor(this.#rows / 2) });
      this.#food = new Food();
      this.#food.place(this.#columns, this.#rows, this.#snake.segments, this.#random);
      this.#score = 0;
      this.#state = "ready";
    }
  }

  // DOM Layout Connectors
  const canvas = document.querySelector("#game-canvas");
  const context = canvas.getContext("2d");
  const overlay = document.querySelector("#game-overlay");
  const overlayTitle = document.querySelector("#overlay-title");
  const overlayCopy = document.querySelector("#overlay-copy");
  const startButton = document.querySelector("#start-button");
  const scoreValue = document.querySelector("#score-value");
  const bestValue = document.querySelector("#best-value");
  const bestLabel = document.querySelector("#best-label");
  const paceValue = document.querySelector("#pace-value");
  const lengthValue = document.querySelector("#length-value");
  const progressFill = document.querySelector("#progress-fill");
  const statusLabel = document.querySelector("#game-status");
  const pauseButton = document.querySelector("#pause-button");
  const restartButton = document.querySelector("#restart-button");
  const speedSelect = document.querySelector("#speed-select");
  
  const game = new Game();
  let bestScore = 0;
  let bestAvailable = true;
  let lastStep = 0;
  let accumulator = 0;
  let touchStart = null;

  // Custom local storage key tracking personal records safely
  try {
    bestScore = Number(window.localStorage.getItem("ali_hamza_snake_highscore")) || 0;
  } catch (error) {
    bestAvailable = false;
    console.warn("Storage profile is inaccessible; run records won't persist.", error);
  }

  const formatScore = (value) => String(value).padStart(3, "0");

  function fitCanvas() {
    const bounds = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(bounds.width * ratio);
    canvas.height = Math.round(bounds.height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }

  function draw() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    const cell = Math.min(width / game.columns, height / game.rows);
    const offsetX = (width - cell * game.columns) / 2;
    const offsetY = (height - cell * game.rows) / 2;

    context.clearRect(0, 0, width, height);
    context.fillStyle = "#0b151b";
    context.fillRect(0, 0, width, height);
    context.strokeStyle = "rgba(178, 214, 199, .055)";
    context.lineWidth = 1;
    for (let x = 0; x <= game.columns; x += 1) {
      const px = offsetX + x * cell;
      context.beginPath(); context.moveTo(px, offsetY); context.lineTo(px, offsetY + cell * game.rows); context.stroke();
    }
    for (let y = 0; y <= game.rows; y += 1) {
      const py = offsetY + y * cell;
      context.beginPath(); context.moveTo(offsetX, py); context.lineTo(offsetX + cell * game.columns, py); context.stroke();
    }

    const food = game.food;
    const fruitX = offsetX + (food.x + .5) * cell;
    const fruitY = offsetY + (food.y + .5) * cell;
    context.save();
    context.shadowColor = "rgba(255, 133, 103, .76)";
    context.shadowBlur = cell * .75;
    context.fillStyle = "#ff8b6d";
    context.beginPath(); context.arc(fruitX, fruitY, cell * .29, 0, Math.PI * 2); context.fill();
    context.shadowBlur = 0;
    context.strokeStyle = "#a9df7e";
    context.lineWidth = Math.max(1.5, cell * .08);
    context.beginPath(); context.moveTo(fruitX, fruitY - cell * .22); context.quadraticCurveTo(fruitX + cell * .08, fruitY - cell * .48, fruitX + cell * .23, fruitY - cell * .35); context.stroke();
    context.restore();

    const segments = game.snake;
    segments.forEach((segment, index) => {
      const inset = cell * .105;
      const x = offsetX + segment.x * cell + inset;
      const y = offsetY + segment.y * cell + inset;
      const size = cell - inset * 2;
      const radius = Math.max(2, cell * .24);
      const shade = index === 0 ? "#c9ff9b" : Math.max(0, 1 - index / Math.max(9, segments.length)) * .28;
      context.save();
      if (index === 0) {
        context.shadowColor = "rgba(184, 242, 139, .55)";
        context.shadowBlur = cell * .7;
        context.fillStyle = "#c9ff9b";
      } else {
        context.fillStyle = `hsl(94 66% ${Math.round(43 + shade * 17)}%)`;
      }
      context.beginPath();
      context.roundRect(x, y, size, size, radius);
      context.fill();
      if (index === 0) {
        const direction = getHeadDirection();
        const eyeRadius = Math.max(1.2, cell * .06);
        context.shadowBlur = 0;
        context.fillStyle = "#1a3021";
        const positions = direction === "right"
          ? [[x + size * .7, y + size * .31], [x + size * .7, y + size * .69]]
          : direction === "left"
            ? [[x + size * .3, y + size * .31], [x + size * .3, y + size * .69]]
            : direction === "up"
              ? [[x + size * .31, y + size * .3], [x + size * .69, y + size * .3]]
              : [[x + size * .31, y + size * .7], [x + size * .69, y + size * .7]];
        positions.forEach(([ex, ey]) => {
context.beginPath(); context.arc(ex, ey, eyeRadius, 0, Math.PI * 2); context.fill();
});
}
context.restore();
});
}
function getHeadDirection() {
const segments = game.snake;
if (segments.length < 2) return "right";
const head = segments[0];
const neck = segments[1];
if (head.x > neck.x) return "right";
if (head.x < neck.x) return "left";
if (head.y > neck.y) return "down";
return "up";
}
function updateHud() {
scoreValue.textContent = formatScore(game.score);
bestValue.textContent = bestAvailable ? formatScore(bestScore) : "—";
bestLabel.textContent = bestAvailable ? "PERSONAL BEST" : "BEST NOT SAVED";
bestValue.title = bestAvailable ? "Saved in this browser local session" : "Browser local dynamic storage is unavailable.";
const pace = Math.min(9, 1 + Math.floor(game.score / 50));
paceValue.innerHTML = ${String(pace).padStart(2, "0")} <span>×</span>;
lengthValue.textContent = LENGTH ${String(game.snake.length).padStart(2, "0")};
progressFill.style.width = ${Math.min(100, (game.snake.length / 16) * 100)}%;
pauseButton.disabled = game.state !== "playing" && game.state !== "paused";
pauseButton.textContent = game.state === "paused" ? "▶" : "Ⅱ";
pauseButton.setAttribute("aria-label", game.state === "paused" ? "Resume game" : "Pause game");
statusLabel.textContent = ({
ready: "READY — CLICK START",
playing: "GAME ACTIVE",
paused: "PAUSED",
over: "GAME OVER",
won: "VICTORY"
})[game.state];
if (game.score > bestScore) {
bestScore = game.score;
if (bestAvailable) {
try { window.localStorage.setItem("ali_hamza_snake_highscore", String(bestScore)); }
catch (error) {
bestAvailable = false;
console.warn("Highscore updates could not be committed.", error);
}
}
}
}
function showOverlay(title, copy, buttonText = "PLAY AGAIN") {
overlayTitle.innerHTML = title;
overlayCopy.innerHTML = copy;
startButton.innerHTML = ${buttonText} <span aria-hidden="true">→</span>;
overlay.classList.remove("is-hidden");
}
function hideOverlay() { overlay.classList.add("is-hidden"); }
function beginGame() {
if (game.state === "over" || game.state === "won") game.reset();
if (game.state === "paused") game.togglePause();
else game.start();
lastStep = 0;
accumulator = 0;
hideOverlay();
updateHud();
draw();
canvas.focus({ preventScroll: true });
}
function handleGameEnd() {
if (game.state === "over") showOverlay("Ali Hamza's Project
Game over.", Final score: ${formatScore(game.score)} points., "TRY AGAIN");
if (game.state === "won") showOverlay("Ali Hamza's Project
Victory!", Flawless execution! Final Score: ${formatScore(game.score)} points., "PLAY AGAIN");
}
function tick(timestamp) {
if (game.state === "playing") {
if (lastStep === 0) lastStep = timestamp;
accumulator += timestamp - lastStep;
lastStep = timestamp;
const pace = Math.min(9, 1 + Math.floor(game.score / 50));
const interval = Math.max(45, SPEEDS[speedSelect.value] - (pace - 1) * 5);
while (accumulator >= interval && game.state === "playing") {
game.update();
accumulator -= interval;
}
updateHud();
draw();
handleGameEnd();
} else {
lastStep = timestamp;
}
window.requestAnimationFrame(tick);
}
function requestDirection(direction) {
if (game.state === "ready") beginGame();
game.setDirection(direction);
}
startButton.addEventListener("click", beginGame);
pauseButton.addEventListener("click", () => {
game.togglePause();
if (game.state === "paused") showOverlay("Ali Hamza's Project
Game Paused", "Take a short break and click resume when ready.", "RESUME GAME");
else hideOverlay();
updateHud();
});
restartButton.addEventListener("click", () => {
game.reset();
beginGame();
});
speedSelect.addEventListener("change", () => updateHud());
document.addEventListener("keydown", (event) => {
if (event.target instanceof HTMLElement && event.target.closest("button, select, input, textarea")) return;
const key = event.key.toLowerCase();
const directions = {
arrowup: Direction.UP, w: Direction.UP,
arrowdown: Direction.DOWN, s: Direction.DOWN,
arrowleft: Direction.LEFT, a: Direction.LEFT,
arrowright: Direction.RIGHT, d: Direction.RIGHT
};
if (directions[key]) {
event.preventDefault();
requestDirection(directions[key]);
} else if (key === " " || key === "spacebar") {
event.preventDefault();
if (game.state === "ready") beginGame();
else {
game.togglePause();
if (game.state === "paused") showOverlay("Ali Hamza's Project
Game Paused", "Take a short break and click resume when ready.", "RESUME GAME");
else hideOverlay();
updateHud();
}
} else if (key === "enter") {
if (game.state === "ready" || game.state === "over" || game.state === "won") beginGame();
else if (game.state === "paused") {
game.togglePause();
hideOverlay();
updateHud();
}
} else if (key === "r") {
game.reset();
beginGame();
}
});
document.querySelectorAll("[data-direction]").forEach((button) => {
button.addEventListener("click", () => requestDirection(button.dataset.direction));
});
canvas.addEventListener("touchstart", (event) => {
const touch = event.changedTouches[0];
touchStart = { x: touch.clientX, y: touch.clientY };
}, { passive: true });
canvas.addEventListener("touchend", (event) => {
if (!touchStart) return;
const touch = event.changedTouches[0];
const dx = touch.clientX - touchStart.x;
const dy = touch.clientY - touchStart.y;
if (Math.max(Math.abs(dx), Math.abs(dy)) > 22) {
requestDirection(Math.abs(dx) > Math.abs(dy)
? (dx > 0 ? Direction.RIGHT : Direction.LEFT)
: (dy > 0 ? Direction.DOWN : Direction.UP));
}
touchStart = null;
}, { passive: true });
if ("ResizeObserver" in window) new ResizeObserver(fitCanvas).observe(canvas);
else window.addEventListener("resize", fitCanvas);
fitCanvas();
updateHud();
window.requestAnimationFrame(tick);
window.SnakeGameEngine = Object.freeze({ Game, Snake, Food, Direction, COLUMNS, ROWS });
})();
