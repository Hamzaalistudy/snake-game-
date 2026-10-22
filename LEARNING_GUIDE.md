# Snake Game Project — Documentation & Reference Guide

## 1. Project Overview
This project is a classic grid-based Snake game implemented across two different environments to demonstrate core programming principles:

- **Web Version (`index.html`, `styles.css`, `game.js`):** A frontend web app using standard HTML5 Canvas, modern CSS, and plain JavaScript. It runs instantly in any browser without installation.
- **Console Version (`main.cpp`):** A native C++ version that runs directly in the Windows command line, focusing on clean Object-Oriented Programming (OOP) and structural data handling.

Both versions are written completely from scratch and operate independently. The browser app runs purely on frontend client code and does not connect to a backend server.

---

## 2. Controls and Rules
- **Movement:** Use the Arrow keys or `W`/`A`/`S`/`D`. On mobile or touch devices, you can swipe the screen or use the on-screen buttons.
- **Game Controls:** Press **Spacebar** to pause/resume the game and **R** to restart at any time.
- **Difficulty:** Select between Chill, Classic, or Turbo modes before starting or mid-game to adjust the speed.
- **Scoring:** The snake moves around the grid to collect food. Each fruit adds 10 points to the score and grows the snake by one segment.
- **Game Over:** The game ends immediately if the snake hits the outer wall boundary or crashes into its own body. Your highest score is automatically saved in the browser's local storage.

---

## 3. Project Structure and Components

### Frontend Web Implementation

#### `index.html`
Defines the structure and visual elements of the game interface. It sets up the main layout container, score display blocks, the 2D canvas drawing board, layout controls, and descriptive labels. It acts as the backbone that links the styling (`styles.css`) and logic (`game.js`) files together.

#### `styles.css`
Handles the visual styling, theme coloring, typography, and responsive layouts. It uses **CSS Grid** to display the game board side-by-side with the stats panel on wide desktop screens, and seamlessly stacks them vertically on mobile devices. It also supports system accessibility features like fluid canvas scaling and motion preference settings.

#### `game.js`
The core game engine is organized around three main JavaScript classes that manage different parts of the application:

| Class | What it handles |
| --- | --- |
| `Snake` | Tracks the snake's body coordinates and current heading. It blocks illegal reverse turns and calculates future self-collisions. |
| `Food` | Manages the food target placement. It keeps picking a random position until it finds a coordinate that the snake isn't occupying. |
| `Game` | Coordinates the entire system. It initializes the board setup, monitors game states (playing, paused, game over), tracks score data, and handles resets. |

To ensure data integrity, these classes utilize JavaScript private fields (using the `#` prefix). Any interface updates that request coordinate data receive clean array copies rather than direct access to the live variables, preventing unexpected bugs or external modifications.

Key utility functions in the file include:
- `fitCanvas()`: Dynamically scales the canvas resolution to match your screen size and device pixel density.
- `draw()`: Paints the grid, body segments, head details, and food items onto the screen buffer every tick.
- `updateHud()`: Keeps the user interface synced with current points, best scores, game status text, and button flags.
- `tick()`: The central runtime engine loop. It monitors real elapsed time and moves the snake forward based on the selected speed setting, keeping game speed completely independent of screen refresh rates.

---

### Native C++ Implementation

#### `main.cpp`
The desktop version replicates the exact same game rules in C++, relying strictly on the standard library and low-level console polling for Windows.

| Structural Component | Purpose |
| --- | --- |
| `Point` | A lightweight data structure representing `(x, y)` grid coordinates with custom equality operators for rapid position matching. |
| `Direction` / `GameState` | Scoped definitions (`enum class`) that lock input parameters and game states to valid, explicit values. |
| `Snake` | Holds body segments in a `std::deque<Point>`, enabling fast front-loading (for head moves) and tail-dropping operations. |
| `Food` | Stores target positions safely behind read/write methods to protect internal state values. |
| `Game` | Combines the `Snake` and `Food` objects into a single managed manager instance with an independent random number seed generator. |
| `Draw()` / `ApplyKey()` | Completely separate drawing and input routines that talk directly to the Windows terminal screen buffer without spilling into core game rules. |

The application leverages standard containers and utilities to run efficiently: `std::find` handles quick collision checks, `std::mt19937` generates random coordinates without calculation bias, and `std::chrono` combined with thread sleeping manages smooth game loop timing.

---

## 4. Game Logic Flow
1. **Grid Map Setup:** The entire map is represented as simple integer grid coordinates `(x, y)` instead of pixel values, keeping physics and movement logic incredibly fast.
2. **Direction Validation:** Input vectors are checked immediately. If you try to turn directly backward into yourself, the input is discarded to prevent instant self-elimination.
3. **Head Prediction:** The game checks where the head *will* land on the next frame by adding coordinate adjustments based on your current direction.
4. **Pre-Movement Check:** Before the snake actually shifts position, the engine checks if the predicted head coordinates cross a wall or touch an existing body node. *Note:* The very last segment of the tail is temporarily ignored during this check since it naturally moves forward out of that spot at the exact same moment.
5. **Position Shifts:** If the path is clear, the new head coordinate is added to the front. The end of the tail is dropped unless the head lands on a fruit.
6. **Food Resolution:** If a fruit is eaten, the tail node is kept (causing growth), 10 points are added, and the engine searches for a free grid cell to drop the next piece of food. If the map fills up entirely, a win state is triggered.
7. **Pacing Loop:** A continuous timer tracks milliseconds between updates. The snake only takes a logical step forward once that accumulated time matches the speed setting.

---

## 5. Programming Concepts Implemented
- **Classes and Objects:** Separating blueprint structures (`Snake`) from live, active code objects (`game`).
- **Encapsulation:** Keeping raw variables private and forcing outside functions to modify properties safely through explicit class methods.
- **Composition:** Building a complex engine (`Game`) out of simpler individual components (`Snake`, `Food`).
- **Data Collection:** Using modern sequences like double-ended queues to keep item addition and deletion steps incredibly fast.
- **State Machine Architecture:** Utilizing strict operational limits (`ready`, `playing`, `paused`, `over`) to verify which button actions or rules apply at any given second.
