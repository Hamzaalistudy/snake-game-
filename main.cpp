#include <algorithm>
#include <chrono>
#include <cstdlib>
#include <deque>
#include <iostream>
#include <random>
#include <stdexcept>
#include <thread>
#include <vector>

#ifdef _WIN32
#include <conio.h>
#include <windows.h>
#endif

namespace {

constexpr int kBoardWidth = 22;
constexpr int kBoardHeight = 16;

struct Point {
    int x{};
    int y{};

    bool operator==(const Point& other) const {
        return x == other.x && y == other.y;
    }
};

enum class Direction { Up, Down, Left, Right };
enum class GameState { Ready, Running, Paused, GameOver, Won };

bool IsOpposite(Direction first, Direction second) {
    return (first == Direction::Up && second == Direction::Down) ||
           (first == Direction::Down && second == Direction::Up) ||
           (first == Direction::Left && second == Direction::Right) ||
           (first == Direction::Right && second == Direction::Left);
}

Point NextPosition(Point position, Direction direction) {
    switch (direction) {
        case Direction::Up:
            --position.y;
            break;
        case Direction::Down:
            ++position.y;
            break;
        case Direction::Left:
            --position.x;
            break;
        case Direction::Right:
            ++position.x;
            break;
    }
    return position;
}

class Snake {
public:
    Snake() : Snake({kBoardWidth / 2, kBoardHeight / 2}) {}

    explicit Snake(Point start)
        : segments_{{start.x, start.y}, {start.x - 1, start.y},
                    {start.x - 2, start.y}},
          direction_(Direction::Right),
          nextDirection_(Direction::Right) {}

    const std::deque<Point>& GetSegments() const { return segments_; }
    Point GetHead() const { return segments_.front(); }
    Direction GetNextDirection() const { return nextDirection_; }

    void SetDirection(Direction requested) {
        if (!IsOpposite(direction_, requested) &&
            !IsOpposite(nextDirection_, requested)) {
            nextDirection_ = requested;
        }
    }

    bool WouldHit(Point position, bool growing) const {
        const auto bodyEnd = growing ? segments_.end() : segments_.end() - 1;
        return std::find(segments_.begin(), bodyEnd, position) != bodyEnd;
    }

    void Move(bool grow) {
        direction_ = nextDirection_;
        segments_.push_front(NextPosition(GetHead(), direction_));
        if (!grow) {
            segments_.pop_back();
        }
    }

private:
    std::deque<Point> segments_;
    Direction direction_;
    Direction nextDirection_;
};

class Food {
public:
    Food() = default;
    explicit Food(Point position) : position_(position) {}

    Point GetPosition() const { return position_; }
    void SetPosition(Point position) { position_ = position; }

private:
    Point position_{};
};

class Game {
public:
    Game() : Game(kBoardWidth, kBoardHeight) {}

    Game(int width, int height)
        : width_(width),
          height_(height),
          snake_(Point{width / 2, height / 2}),
          food_(),
          score_(0),
          state_(GameState::Ready),
          random_(std::random_device{}()) {
        if (width < 6 || height < 6) {
            throw std::invalid_argument("The board must be at least 6 by 6.");
        }
        PlaceFood();
    }

    int GetWidth() const { return width_; }
    int GetHeight() const { return height_; }
    int GetScore() const { return score_; }
    GameState GetState() const { return state_; }
    Point GetFood() const { return food_.GetPosition(); }
    const std::deque<Point>& GetSnake() const { return snake_.GetSegments(); }

    void Start() {
        if (state_ == GameState::Ready) {
            state_ = GameState::Running;
        }
    }

    void TogglePause() {
        if (state_ == GameState::Running) {
            state_ = GameState::Paused;
        } else if (state_ == GameState::Paused) {
            state_ = GameState::Running;
        }
    }

    void SetDirection(Direction direction) {
        if (state_ == GameState::Running) {
            snake_.SetDirection(direction);
        }
    }

    void Update() {
        if (state_ != GameState::Running) {
            return;
        }

        const Point nextHead =
            NextPosition(snake_.GetHead(), snake_.GetNextDirection());
        const bool eating = nextHead == food_.GetPosition();
        const bool hitWall = nextHead.x < 0 || nextHead.x >= width_ ||
                             nextHead.y < 0 || nextHead.y >= height_;
        if (hitWall || snake_.WouldHit(nextHead, eating)) {
            state_ = GameState::GameOver;
            return;
        }

        snake_.Move(eating);
        if (eating) {
            score_ += 10;
            if (snake_.GetSegments().size() ==
                static_cast<std::size_t>(width_ * height_)) {
                state_ = GameState::Won;
            } else {
                PlaceFood();
            }
        }
    }

    void Reset() {
        snake_ = Snake(Point{width_ / 2, height_ / 2});
        score_ = 0;
        state_ = GameState::Ready;
        PlaceFood();
    }

private:
    void PlaceFood() {
        std::vector<Point> emptyCells;
        for (int y = 0; y < height_; ++y) {
            for (int x = 0; x < width_; ++x) {
                const Point cell{x, y};
                if (std::find(snake_.GetSegments().begin(),
                              snake_.GetSegments().end(),
                              cell) == snake_.GetSegments().end()) {
                    emptyCells.push_back(cell);
                }
            }
        }
        if (!emptyCells.empty()) {
            std::uniform_int_distribution<std::size_t> choose(
                0, emptyCells.size() - 1);
            food_.SetPosition(emptyCells[choose(random_)]);
        }
    }

    int width_;
    int height_;
    Snake snake_;
    Food food_;
    int score_;
    GameState state_;
    std::mt19937 random_;
};

#ifdef _WIN32
void Draw(const Game& game) {
    system("cls");
    std::cout << "S N A K E   /   Score " << game.GetScore()
              << "     WASD / arrows: move     P: pause     R: restart     Q: quit\n";

    const auto& snake = game.GetSnake();
    const Point food = game.GetFood();
    for (int y = -1; y <= game.GetHeight(); ++y) {
        for (int x = -1; x <= game.GetWidth(); ++x) {
            if (x < 0 || x == game.GetWidth() || y < 0 ||
                y == game.GetHeight()) {
                std::cout << '#';
            } else if (snake.front() == Point{x, y}) {
                std::cout << 'O';
            } else if (std::find(snake.begin() + 1, snake.end(),
                                 Point{x, y}) != snake.end()) {
                std::cout << 'o';
            } else if (food == Point{x, y}) {
                std::cout << '*';
            } else {
                std::cout << ' ';
            }
        }
        std::cout << '\n';
    }

    if (game.GetState() == GameState::Paused) std::cout << "\nPAUSED\n";
    if (game.GetState() == GameState::GameOver) std::cout << "\nGAME OVER\n";
    if (game.GetState() == GameState::Won) std::cout << "\nBOARD CLEARED!\n";
    std::cout.flush();
}

bool ApplyKey(Game& game, int key) {
    if (key == 0 || key == 224) {
        switch (_getch()) {
            case 72: game.SetDirection(Direction::Up); break;
            case 80: game.SetDirection(Direction::Down); break;
            case 75: game.SetDirection(Direction::Left); break;
            case 77: game.SetDirection(Direction::Right); break;
            default: break;
        }
        return true;
    }

    switch (key) {
        case 'w': case 'W': game.SetDirection(Direction::Up); break;
        case 's': case 'S': game.SetDirection(Direction::Down); break;
        case 'a': case 'A': game.SetDirection(Direction::Left); break;
        case 'd': case 'D': game.SetDirection(Direction::Right); break;
        case 'p': case 'P': game.TogglePause(); break;
        case 'r': case 'R':
            game.Reset();
            game.Start();
            break;
        case 'q': case 'Q': return false;
        default: break;
    }
    return true;
}
#endif

}  // namespace

int main() {
#ifdef _WIN32
    Game game;
    game.Start();
    Draw(game);

    while (game.GetState() == GameState::Running ||
           game.GetState() == GameState::Paused) {
        const auto frameStart = std::chrono::steady_clock::now();
        if (_kbhit() && !ApplyKey(game, _getch())) {
            return 0;
        }
        game.Update();
        Draw(game);
        std::this_thread::sleep_until(frameStart + std::chrono::milliseconds(120));
    }

    std::cout << "\nFinal score: " << game.GetScore() << "\n";
    std::cout << "Press R to play again, or Q to quit.\n";
    while (true) {
        const int key = _getch();
        if (key == 'q' || key == 'Q') break;
        if (key == 'r' || key == 'R') {
            game.Reset();
            game.Start();
            Draw(game);
            while (game.GetState() == GameState::Running ||
                   game.GetState() == GameState::Paused) {
                const auto frameStart = std::chrono::steady_clock::now();
                if (_kbhit() && !ApplyKey(game, _getch())) return 0;
                game.Update();
                Draw(game);
                std::this_thread::sleep_until(frameStart +
                                              std::chrono::milliseconds(120));
            }
            std::cout << "\nFinal score: " << game.GetScore()
                      << "\nPress R to play again, or Q to quit.\n";
        }
    }
#else
    std::cout << "The C++ console controls use Windows _getch().\n"
                 "Open index.html in a browser for the full playable GUI.\n";
#endif
    return 0;
}
