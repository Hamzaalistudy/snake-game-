# Snake Game — Test Cases

The spreadsheet asks for input/logic validation and at least five edge-case tests. The checks below cover the browser game and the matching C++ rules. For the browser app, open `index.html`; for C++, build and run `main.cpp` on Windows.

| # | Test | Steps | Expected result |
| --- | --- | --- | --- |
| 1 | Starting state | Load the app and inspect the board and score. | A three-segment snake appears; score is 000; the game is ready and does not move until started. |
| 2 | Immediate reverse | Start, then press Left while the snake initially moves Right. | The reverse request is ignored; the snake keeps moving right. |
| 3 | Food and growth | Steer into the visible fruit. | Score increases by 10; snake gains exactly one segment; a new fruit appears outside the body. |
| 4 | Wall collision | Start and continue straight into a wall. | The run ends; score remains visible; the overlay offers a new run. |
| 5 | Body collision | Guide the snake into a non-tail body segment. | The run ends immediately; the body is not allowed to overlap itself. |
| 6 | Moving into vacated tail | Arrange a loop so the next head cell is the tail cell that moves away on that update. | This is allowed when not eating; the snake moves without a false collision. |
| 7 | Pause / resume | Press Space or the pause button during a run, wait, then resume. | Position and score remain unchanged while paused; movement continues after resume. |
| 8 | Restart | Press R or the restart button during a run. | A new ready game has a three-segment snake and score 000. |
| 9 | Best score | Score points, then refresh the browser. | Best score persists when local storage is enabled; gameplay continues if storage is disabled. |
| 10 | Full-board win | On a test-sized 6 × 6 model, fill every open cell without collision. | The state changes to `won`; food placement does not loop forever. |
| 11 | Invalid board size | Construct the model with a width or height below 6 (developer console: `new SnakeGameEngine.Game({columns: 5})`). | A clear `RangeError` explains the minimum board size. |
| 12 | Small screen | Resize to a narrow mobile viewport. | Board stays in proportion; side panels stack; touch buttons appear. |

## Repeatable GUI checks

1. To check the loaded screen, verify the score, best-score card, board, speed selector, and start overlay are present.
2. Start with Enter, reverse with the opposite key, and confirm the snake continues in its original direction.
3. Pause with Space and verify the snake stays still; press Space again and observe movement.
4. Restart with R and verify the score resets to 000 and the opening body length returns to three.
5. Change speed and continue play; the HUD and controls must remain usable.
6. Resize the browser and verify the grid redraws without stretching.

## Edge-case notes

- Food selection builds a list of empty cells. It therefore cannot place food inside the snake and has no unbounded retry loop when the board fills.
- A non-growing move excludes the current tail from the collision check because it vacates that cell during the same update. A growing move does not exclude it.
- Direction input is checked against both the current and queued direction to prevent rapid opposite turns between updates.
- Scoring, movement, and collision checks are skipped while the model is paused or not yet started.
