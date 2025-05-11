"use client"
import { Link, useLocation, useNavigate } from "react-router-dom"
import "../App.css"

const GameSummaryPage = () => {
  const location = useLocation()
  const navigate = useNavigate()

  // Get game data from location state or use default values
  const gameData = location.state || {
    winner: "white",
    reason: "checkmate",
    moves: 24,
    duration: 720, // seconds
    whiteCaptures: [],
    blackCaptures: [],
    explosions: 3,
    isAIGame: false,
    difficulty: null,
  }

  // Format duration as minutes:seconds
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
  }

  // Generate key events (this would be more detailed in a real app)
  const generateKeyEvents = () => {
    const events = [
      { time: "0:10", description: "Game started" },
      { time: "1:45", description: "First capture" },
    ]

    if (gameData.explosions > 0) {
      events.push({ time: "3:20", description: "First explosion triggered" })
    }

    if (gameData.winner !== "draw") {
      events.push({
        time: formatDuration(gameData.duration),
        description: `${gameData.winner === "white" ? "White" : "Black"} wins by ${gameData.reason}`,
      })
    } else {
      events.push({
        time: formatDuration(gameData.duration),
        description: "Game ended in a draw",
      })
    }

    return events
  }

  const handlePlayAgain = () => {
    if (gameData.isAIGame) {
      navigate("/ai-game")
    } else {
      navigate("/game")
    }
  }

  return (
    <div className="summary-container">
      <div className="summary-header">
        <h1 className="summary-title">Game Summary</h1>
        <p className="summary-subtitle">
          {gameData.isAIGame ? "Player vs AI" : "Player vs Player"}
          {gameData.isAIGame && gameData.difficulty && ` (${gameData.difficulty})`}
        </p>
      </div>

      <div className="winner-display">
        <div className="winner-trophy">🏆</div>
        <h2 className="winner-name">
          {gameData.winner === "draw" ? "Draw" : `${gameData.winner === "white" ? "White" : "Black"} Wins!`}
        </h2>
      </div>

      <div className="summary-card">
        <h3 className="summary-section-title">Game Statistics</h3>

        <div className="game-stats">
          <div className="game-stat">
            <div className="game-stat-value">{gameData.moves}</div>
            <div className="game-stat-label">Total Moves</div>
          </div>

          <div className="game-stat">
            <div className="game-stat-value">{formatDuration(gameData.duration)}</div>
            <div className="game-stat-label">Game Duration</div>
          </div>

          <div className="game-stat">
            <div className="game-stat-value">{gameData.explosions}</div>
            <div className="game-stat-label">Explosions</div>
          </div>

          <div className="game-stat">
            <div className="game-stat-value">{gameData.whiteCaptures.length + gameData.blackCaptures.length}</div>
            <div className="game-stat-label">Pieces Captured</div>
          </div>
        </div>

        <div className="player-comparison">
          <div className="player-column">
            <h4 className="player-column-title">White</h4>

            <div className="player-stat">
              <span className="player-stat-label">Pieces Captured</span>
              <span className="player-stat-value">{gameData.whiteCaptures.length}</span>
            </div>

            <div className="player-stat">
              <span className="player-stat-label">Pieces Lost</span>
              <span className="player-stat-value">{gameData.blackCaptures.length}</span>
            </div>

            <div className="player-stat">
              <span className="player-stat-label">Explosions Triggered</span>
              <span className="player-stat-value">
                {Math.floor(gameData.explosions / 2) + (gameData.explosions % 2)}
              </span>
            </div>
          </div>

          <div className="vs-divider">
            <div className="vs-circle">VS</div>
            <div className="vs-line"></div>
          </div>

          <div className="player-column">
            <h4 className="player-column-title">{gameData.isAIGame ? "AI" : "Black"}</h4>

            <div className="player-stat">
              <span className="player-stat-label">Pieces Captured</span>
              <span className="player-stat-value">{gameData.blackCaptures.length}</span>
            </div>

            <div className="player-stat">
              <span className="player-stat-label">Pieces Lost</span>
              <span className="player-stat-value">{gameData.whiteCaptures.length}</span>
            </div>

            <div className="player-stat">
              <span className="player-stat-label">Explosions Triggered</span>
              <span className="player-stat-value">{Math.floor(gameData.explosions / 2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="summary-card">
        <h3 className="summary-section-title">Key Events</h3>

        <div className="key-events">
          {generateKeyEvents().map((event, index) => (
            <div key={index} className="event-item">
              <div className="event-time">{event.time}</div>
              <div className="event-description">{event.description}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="summary-buttons">
        <button className="btn btn-primary" onClick={handlePlayAgain}>
          Play Again
        </button>
        <Link to="/" className="btn btn-secondary">
          Main Menu
        </Link>
      </div>
    </div>
  )
}

export default GameSummaryPage
