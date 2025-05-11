"use client"

import { useState } from "react"
import { useGame } from "../context/GameContext"

const DebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false)
  const {
    board,
    currentPlayer,
    connectionStatus,
    offlineMode,
    gameMode,
    difficulty,
    gameStatus,
    message,
    isExplosiveMode,
  } = useGame()

  const togglePanel = () => {
    setIsOpen(!isOpen)
  }

  // Render a mini version of the board for debugging
  const renderMiniBoard = () => {
    return (
      <div className="debug-mini-board">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="debug-board-row">
            {row.map((piece, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`debug-square ${(rowIndex + colIndex) % 2 === 0 ? "debug-white" : "debug-black"}`}
              >
                {piece || ""}
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`debug-panel ${isOpen ? "open" : ""}`}>
      <button className="debug-toggle" onClick={togglePanel}>
        {isOpen ? "Hide Debug" : "Show Debug"}
      </button>

      {isOpen && (
        <div className="debug-content">
          <h3>Debug Information</h3>

          <div className="debug-section">
            <h4>Connection Status</h4>
            <p>
              Status:{" "}
              <span className={connectionStatus === "Connected" ? "connected" : "disconnected"}>
                {connectionStatus}
              </span>
            </p>
            <p>Mode: {offlineMode ? "Offline" : "Online"}</p>
          </div>

          <div className="debug-section">
            <h4>Game State</h4>
            <p>Current Player: {currentPlayer}</p>
            <p>Game Mode: {gameMode}</p>
            <p>Difficulty: {difficulty}</p>
            <p>Explosive Mode: {isExplosiveMode ? "Enabled" : "Disabled"}</p>
            <p>Game Over: {gameStatus.gameOver ? "Yes" : "No"}</p>
            {gameStatus.gameOver && <p>Winner: {gameStatus.winner || "Draw"}</p>}
            <p>Check: {gameStatus.isCheck ? "Yes" : "No"}</p>
            <p>Checkmate: {gameStatus.isCheckmate ? "Yes" : "No"}</p>
          </div>

          <div className="debug-section">
            <h4>Last Message</h4>
            <p>{message}</p>
          </div>

          <div className="debug-section">
            <h4>Board Preview</h4>
            {renderMiniBoard()}
          </div>
        </div>
      )}
    </div>
  )
}

export default DebugPanel
