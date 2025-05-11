"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useGame } from "../context/GameContext"
import { useSettings } from "../context/SettingsContext"

const GameModePage = () => {
  const navigate = useNavigate()
  const { gameMode, setGameMode, setDifficulty, difficulty } = useGame()
  const { theme } = useSettings()
  const [loading, setLoading] = useState(false)

  const handleStartGame = () => {
    setLoading(true)

    if (gameMode === "ai") {
      navigate("/ai-game")
    } else {
      navigate("/game")
    }

    setLoading(false)
  }

  const handleBack = () => {
    navigate("/")
  }

  return (
    <div className={`game-mode-page ${theme}`}>
      <div className="page-header">
        <h1>Game Setup</h1>
        <p className="subtitle">Configure your game</p>
      </div>

      <div className="game-mode-content">
        <div className="game-mode-section">
          <h2>Game Mode</h2>
          <div className="mode-options">
            <button
              className={`mode-option ${gameMode === "local" ? "active" : ""}`}
              onClick={() => setGameMode("local")}
            >
              <div className="mode-icon">👥</div>
              <div className="mode-details">
                <h3>Local Game</h3>
                <p>Play against a friend on the same device</p>
              </div>
            </button>

            <button className={`mode-option ${gameMode === "ai" ? "active" : ""}`} onClick={() => setGameMode("ai")}>
              <div className="mode-icon">🤖</div>
              <div className="mode-details">
                <h3>Play Against AI</h3>
                <p>Challenge the computer</p>
              </div>
            </button>
          </div>

          {gameMode === "ai" && (
            <div className="difficulty-selector">
              <h4>Select Difficulty:</h4>
              <div className="difficulty-options">
                <button
                  className={`difficulty-button ${difficulty === "easy" ? "active" : ""}`}
                  onClick={() => setDifficulty("easy")}
                >
                  Easy
                </button>
                <button
                  className={`difficulty-button ${difficulty === "medium" ? "active" : ""}`}
                  onClick={() => setDifficulty("medium")}
                >
                  Medium
                </button>
                <button
                  className={`difficulty-button ${difficulty === "hard" ? "active" : ""}`}
                  onClick={() => setDifficulty("hard")}
                >
                  Hard
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="game-mode-section">
          <h2>Game Rules</h2>
          <div className="rules-summary">
            <ul>
              <li>When a piece is captured, it explodes!</li>
              <li>The explosion affects all surrounding squares.</li>
              <li>All pieces in the explosion radius are removed, except pawns.</li>
              <li>If a king is caught in an explosion, that player loses.</li>
              <li>You cannot make a move that would cause your own king to explode.</li>
            </ul>
          </div>
        </div>

        <div className="game-mode-actions">
          <button className="secondary-button" onClick={handleBack} disabled={loading}>
            Back
          </button>
          <button className="primary-button" onClick={handleStartGame} disabled={loading}>
            {loading ? "Starting Game..." : "Start Game"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default GameModePage
