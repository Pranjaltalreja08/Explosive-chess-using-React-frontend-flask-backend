"use client"
import { useSettings } from "../context/SettingsContext"

const GameOverModal = ({ result, winner, reason, gameTime, explosionCount, onNewGame, onExit }) => {
  const { theme } = useSettings()

  // Format time as mm:ss
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  // Determine the game result message and styling
  let resultMessage = ""
  let resultIcon = ""
  let resultClass = ""

  if (reason === "explosion") {
    resultMessage = `${winner === "white" ? "White" : "Black"} wins by exploding the opponent's king!`
    resultIcon = "💥"
    resultClass = winner === "white" ? "white-win explosion" : "black-win explosion"
  } else if (reason === "checkmate") {
    resultMessage = `Checkmate! ${winner === "white" ? "White" : "Black"} wins!`
    resultIcon = "♚"
    resultClass = winner === "white" ? "white-win" : "black-win"
  } else if (reason === "stalemate") {
    resultMessage = "Stalemate! The game is a draw."
    resultIcon = "🤝"
    resultClass = "draw"
  } else {
    resultMessage = "Game over!"
    resultIcon = "🏁"
    resultClass = "generic"
  }

  return (
    <div className={`game-over-modal-overlay ${theme}`}>
      <div className={`game-over-modal ${resultClass}`}>
        <div className="result-icon">{resultIcon}</div>
        <h2>Game Over</h2>
        <p className="result-message">{resultMessage}</p>

        <div className="game-summary">
          <div className="summary-item">
            <span className="summary-label">Game Duration:</span>
            <span className="summary-value">{formatTime(gameTime)}</span>
          </div>

          <div className="summary-item">
            <span className="summary-label">Explosions Triggered:</span>
            <span className="summary-value">{explosionCount}</span>
          </div>

          <div className="summary-item">
            <span className="summary-label">Result:</span>
            <span className="summary-value">
              {reason === "explosion"
                ? `${winner === "white" ? "White" : "Black"} Victory (King Explosion)`
                : reason === "checkmate"
                  ? `${winner === "white" ? "White" : "Black"} Victory (Checkmate)`
                  : reason === "stalemate"
                    ? "Draw (Stalemate)"
                    : "Game Ended"}
            </span>
          </div>
        </div>

        <div className="game-over-actions">
          <button className="primary-button" onClick={onNewGame}>
            Play Again
          </button>
          <button className="tertiary-button" onClick={onExit}>
            Main Menu
          </button>
        </div>
      </div>
    </div>
  )
}

export default GameOverModal
