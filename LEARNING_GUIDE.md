# Snake Game — Learning Guide

## 1. Project overview

Snake is a small grid game: steer a moving snake, collect food, grow longer, and avoid the wall and your own body. This project was selected from project 31, **Snake Game**, in the supplied project workbook. Its required features are movement, growth on food, score, wall/body collision, pause, and restart. Its listed learning goals are classes and objects, encapsulation, access control, constructors, getters/setters, member functions, coordinates, collision, and timed state updates.

The project has two implementations of the same rules:

- The browser app (`index.html`, `styles.css`, `game.js`) is the polished, easy-to-run GUI.
- `main.cpp` is a C++17 console implementation that makes the course OOP requirements explicit.

Both are independent implementations: the browser version does not call a C++ server. This keeps the GUI install-free and lets you trace the same game rules in either language.

## 2. How to play

Open `index.html` in a modern browser. Press **Start Game** or Enter. Use arrow keys or W/A/S/D; on a touch screen, swipe the board or press the direction buttons. Space pauses or resumes, and R starts a fresh game. Select Chill, Classic, or Turbo before or during a run.

The snake earns 10 points and gains one segment for each fruit. Touching a wall or the snake's body ends the run. Filling every cell wins. The best score is saved in local browser storage when that feature is available.

## 3. What each file does

### `index.html` — structure and content

HTML describes the meaning and order of the interface: header, title, score cards, canvas, controls, objective, and learning strip. Buttons have labels for assistive technology. IDs such as `game-canvas`, `start-button`, and `score-value` are connection points that JavaScript uses to find and update the correct element. The file loads `styles.css` for presentation and `game.js` for behavior.

### `styles.css` — visual design

CSS controls color, typography, spacing, responsive columns, card styling, focus outlines, and mobile controls. CSS Grid arranges the board next to the information panel on wide screens; media queries stack the panels on smaller screens. `prefers-reduced-motion` respects a user's operating-system preference. The canvas keeps its grid ratio while the interface adapts to the viewport.

### `game.js` — model, input, drawing, and interface

The script is organized around three classes:

| Class | Responsibility |
| --- | --- |
| `Snake` | Owns ordered body coordinates and direction. It rejects an immediate reverse, predicts body collisions, and moves/grows. |
| `Food` | Owns one coordinate and chooses an unoccupied cell. |
| `Game` | Owns the snake, food, board dimensions, score, and game state. It starts, pauses, updates, detects a win, and resets. |

The classes use JavaScript private fields (`#segments`, `#position`, `#state`, etc.). Callers receive copies from coordinate getters, so changing a returned object cannot silently mutate the game model.

The rest of the file connects that model to the browser:

- `fitCanvas()` scales the drawing surface for the current screen and device pixel ratio.
- `draw()` paints the grid, fruit, body segments, and eyes from the model's coordinates.
- `updateHud()` synchronizes score, best score, length, pace, button state, and status text.
- `beginGame()` starts or restarts the model and hides the introductory overlay.
- `tick()` is the animation loop. It accumulates elapsed time and advances the model at the selected interval.
- Event listeners translate keyboard, buttons, and touch swipes into direction/pause/restart actions.
- `localStorage` keeps the best score between visits. Storage being unavailable does not prevent play.

`window.SnakeGameEngine` exposes the model classes for inspection in the browser developer console; the UI itself still uses the same `Game` object.

### `main.cpp` — C++ OOP version

The C++ file uses only standard-library containers, algorithms, random numbers, and timing, plus Windows `_getch()` for non-blocking console controls.

| C++ element | Purpose |
| --- | --- |
| `Point` | A coordinate (`x`, `y`) with equality comparison for grid-cell checks. |
| `Direction`, `GameState` | `enum class` types make valid directions and states explicit. |
| `Snake` | Private deque of body coordinates and directions. Public methods return the head/body, validate a direction, test body collision, and move. |
| `Food` | Private food coordinate with a getter and controlled position setter. |
| `Game` | Composes a `Snake` and a `Food`; privately owns board dimensions, score, state, and random generator. Public methods start, pause, update, reset, and report state. |
| `Draw()` | Renders the model to the Windows console. It does not decide game rules. |
| `ApplyKey()` | Translates key codes into calls on the `Game` object. |
| `main()` | Creates the game, runs timed updates, draws frames, and offers restart/quit. |

`std::deque<Point>` is useful for the snake because a move adds a head at the front and usually removes a tail at the back. `std::find` checks whether a coordinate is already occupied. `std::mt19937` and `std::uniform_int_distribution` select food cells without modulo bias. `std::chrono` and `std::this_thread::sleep_until` pace the loop.

## 4. Game logic, step by step

1. **Represent space as a grid.** Each segment and the food have integer `(x, y)` coordinates. This avoids pixel-based collision calculations.
2. **Request a direction.** A direction opposite to the current movement is rejected; otherwise the snake could instantly fold back through its neck.
3. **Predict the next head.** Add the selected direction's coordinate delta to the current head.
4. **Check collision before moving.** A head outside the board hits a wall. A head inside an occupied body cell hits the snake. When the snake is not growing, its current tail cell is excluded because that cell moves away in the same update.
5. **Move once.** Add the new head. Remove the last segment unless food is being eaten.
6. **Resolve food.** Award 10 points, keep the tail (growth), then choose a free cell for the next fruit. If there is no free cell, the player wins.
7. **Advance on a timer.** The UI's animation loop does not move the snake every display frame. It accumulates elapsed milliseconds and updates only after the selected speed interval.

## 5. Concepts to be ready to explain

- **Class and object:** `Snake` describes behavior and state; `game` is one concrete `Game` object.
- **Encapsulation:** the model's fields are private. Callers ask it to move, reset, or change direction rather than edit the score or body directly.
- **Constructor:** `Game` initializes a valid board and its contained objects; `Snake` creates a starting body.
- **Getter:** a read-only method/property gives the interface a score or coordinate without exposing mutable internal state.
- **Composition:** a `Game` has a `Snake` and a `Food`; they are components of the game rather than subclasses of it.
- **Collections:** a deque/list stores body segments in head-to-tail order.
- **Coordinate arithmetic:** a direction maps to a small `(dx, dy)` change.
- **Collision detection:** compare the predicted head with board bounds and occupied coordinates before committing the move.
- **State machine:** `ready`, `playing`, `paused`, `over`, and `won` define which actions and transitions are valid.
- **Timed update:** the game loop separates a logical move from a screen redraw.

## 6. Libraries and browser APIs

**C++ standard library:** `<deque>` stores the snake; `<algorithm>` provides `std::find`; `<random>` provides the random engine and uniform distribution; `<vector>` gathers empty food cells; `<chrono>` and `<thread>` pace frames; `<iostream>` handles console output.

**Windows console API:** `<conio.h>` provides `_kbhit()` and `_getch()` for immediate keyboard input. This is why `main.cpp` is a Windows console version.

**Browser APIs:** Canvas 2D draws the game board; `requestAnimationFrame` schedules redraw/update work; DOM events handle keys/buttons/touch; `ResizeObserver` scales the board; `localStorage` retains the best score. No external JavaScript library or build tool is required. The Google Fonts link is optional decoration; fallback system fonts remain defined.

## 7. Suggested walkthrough for a class presentation

1. Show `Snake` and point out its private body and direction.
2. Explain how `(x, y)` coordinates change for a move.
3. Trace `Game::Update()` (C++) or `Game.update()` (browser) from next-head prediction to collision checks and movement.
4. Demonstrate that reversing direction is ignored.
5. Eat one fruit and explain why the tail is not removed on that update.
6. Pause, resume, restart, then intentionally hit a wall.
7. Identify one possible extension: sound, obstacles, themes, saved settings, or a Qt front end.

## 8. Build the C++ version

With MinGW-w64 in PowerShell:

```powershell
g++ -std=c++17 -Wall -Wextra -pedantic main.cpp -o snake-game.exe
.\snake-game.exe
```

The C++ console controls are Windows-specific. For the visual GUI, open `index.html` directly. See `README.md` for the complete file list and run instructions.
