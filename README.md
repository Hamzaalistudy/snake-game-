# Snake — Arcade Lab

A complete Snake project built from the requirements in the **Snake Game** row of `C++_OOP_40_Projects_and_Games.xlsx` (project 31). The project includes a responsive, playable browser GUI and a companion C++ console implementation that demonstrates the requested object-oriented design.

## Project files

| File | Purpose |
| --- | --- |
| `index.html` | Semantic page structure, score panels, game board, instructions, and controls. |
| `styles.css` | Responsive visual design, layout, color system, and accessible focus states. |
| `game.js` | Playable browser game: OOP game model, keyboard/touch input, rendering, HUD, and saved best score. |
| `main.cpp` | C++17 console version with `Snake`, `Food`, and `Game` classes. |
| `LEARNING_GUIDE.md` | Formal walkthrough of the files, functions, libraries, OOP design, and game logic. |
| `TEST_CASES.md` | Required edge-case checklist and reproducible test steps. |
| `snake-game-poster.png` | Project infographic, designed to match the supplied example poster's format. |

## Run the GUI

1. Open `index.html` in a current browser. No server, package installation, or build step is required.
2. Choose a speed and press **Start Game** (or Enter).
3. Steer with the arrow keys or W/A/S/D. On a phone, use the on-screen buttons or swipe on the board.
4. Press Space to pause/resume and R or the restart button to start a new run.

The best score is stored in browser local storage when available. If browser privacy settings disable storage, gameplay still works and the best-score panel displays a dash.

## Build the C++ version

The C++ implementation uses C++17 and the Windows console input API (`_getch`). With MinGW-w64 installed, open PowerShell in this folder and run:

```powershell
g++ -std=c++17 -Wall -Wextra -pedantic main.cpp -o snake-game.exe
.\snake-game.exe
```

Alternatively, open `main.cpp` in Visual Studio and build it as a C++ Console App. The web GUI is the polished visual deliverable; the C++ program is the assignment-focused console implementation. Both follow the same movement, growth, scoring, collision, pause, and restart rules.

## Requirements implemented

- Grid-based directional movement, with arrow keys, WASD, touch swipes, and mobile direction buttons.
- Snake grows by one segment and earns 10 points when food is eaten.
- Wall and body collision ends the run; eating the last open cell wins.
- Pause/resume, restart, three selectable speeds, and a persistent best score.
- Encapsulated `Snake`, `Food`, and `Game` classes, constructors, getters, and rule-preserving methods.
- Five-plus edge cases and testing instructions in `TEST_CASES.md`.

## Concepts demonstrated

Classes and objects; encapsulation and private state; constructors; getters; member functions; enums; composition; grids and coordinates; collections; random food placement; collision detection; conditions; timed updates; keyboard events; responsive canvas rendering; and client-side persistence.

## Class relationship

```text
Game
├── owns one Snake
├── owns one Food
└── tracks board dimensions, score, state, and random generator

Snake
├── stores ordered grid coordinates
└── controls direction, reversal rules, collision checks, and movement

Food
└── stores its coordinate and chooses an unoccupied grid cell
```

See `LEARNING_GUIDE.md` to understand each file and method, and `TEST_CASES.md` to reproduce the main checks.
